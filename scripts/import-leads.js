#!/usr/bin/env node
/* ──────────────────────────────────────────────────────────────────────────
   One-time backfill: import historical signups (from a Google Sheet export or
   any CSV/JSONL) into the persistent store so they show in the admin panel and
   returning customers are recognised.

   USAGE:
     node scripts/import-leads.js <source> [--dry]

   <source> can be:
     • a local CSV file        e.g. ./contento-signups.csv
     • a local JSONL file      e.g. ./leads-backup.jsonl
     • an http(s) URL          e.g. a Google Sheet "Publish to web (CSV)" link
                                    or  .../export?format=csv&gid=0

   It writes to the SAME DATA_ROOT the server uses (DATA_DIR / Railway volume /
   repo dir), appending only NEW signups (deduped by email/LinkedIn/X) and
   merging contact details onto each email user's profile.

   --dry  parse + report what WOULD be imported, write nothing.
   ────────────────────────────────────────────────────────────────────────── */
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const DATA_ROOT = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, '..')
const LEADS_FILE = path.join(DATA_ROOT, 'leads.jsonl')
const PROFILES_DIR = path.join(DATA_ROOT, 'profiles')

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const source = args.find(a => !a.startsWith('--'))

if (!source) {
  console.error('Usage: node scripts/import-leads.js <source.csv|.jsonl|url> [--dry]')
  process.exit(1)
}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex')
}

// ─── Minimal robust CSV parser (handles quotes, commas, newlines in fields) ──
function parseCSV(text) {
  const rows = []
  let row = [], field = '', inQuotes = false
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else inQuotes = false }
      else field += c
    } else {
      if (c === '"') inQuotes = true
      else if (c === ',') { row.push(field); field = '' }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
      else field += c
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter(r => r.some(c => String(c).trim() !== ''))
}

// Map a header label to a known field
function classify(header) {
  const h = String(header).trim().toLowerCase()
  if (h.includes('email')) return 'email'
  if (h.includes('linkedin')) return 'linkedin'
  if (h === 'x' || h.includes('twitter') || h.includes('x /') || h.includes('x/') || h === 'handle') return 'twitter'
  if (h.includes('name')) return 'name'
  if (h.includes('time') || h.includes('date') || h.includes('joined') || h.includes('created')) return 'timestamp'
  if (h.includes('niche')) return 'niche'
  if (h.includes('topic')) return 'topic'
  if (h.includes('starting')) return 'startingOut'
  return null
}

function rowsFromCSV(text) {
  const grid = parseCSV(text)
  if (!grid.length) return []
  const headers = grid[0].map(classify)
  // If no recognizable headers, assume positional: timestamp,name,email,linkedin,twitter
  const hasHeader = headers.some(Boolean)
  const out = []
  const startIdx = hasHeader ? 1 : 0
  for (let r = startIdx; r < grid.length; r++) {
    const cells = grid[r]
    const rec = {}
    if (hasHeader) {
      headers.forEach((key, i) => { if (key && cells[i] != null) rec[key] = String(cells[i]).trim() })
    } else {
      ;['timestamp', 'name', 'email', 'linkedin', 'twitter'].forEach((k, i) => { if (cells[i] != null) rec[k] = String(cells[i]).trim() })
    }
    out.push(rec)
  }
  return out
}

function rowsFromJSONL(text) {
  const out = []
  text.split('\n').forEach(line => { line = line.trim(); if (!line) return; try { out.push(JSON.parse(line)) } catch (e) {} })
  return out
}

function identityKey(r) {
  const email = (r.email || '').trim().toLowerCase()
  if (email) return 'em:' + email
  const li = (r.linkedin || '').trim().toLowerCase()
  if (li) return 'li:' + li
  const tw = (r.twitter || '').trim().toLowerCase()
  if (tw) return 'tw:' + tw
  const nm = (r.name || '').trim().toLowerCase()
  return nm ? 'nm:' + nm : null
}

async function loadSource(src) {
  let text
  if (/^https?:\/\//i.test(src)) {
    console.log('Fetching', src, '...')
    const res = await fetch(src)
    if (!res.ok) throw new Error('Fetch failed: HTTP ' + res.status)
    text = await res.text()
  } else {
    text = fs.readFileSync(src, 'utf8')
  }
  const looksJSON = src.endsWith('.jsonl') || src.endsWith('.json') ||
    text.trim().startsWith('{') || text.trim().startsWith('[')
  if (src.endsWith('.jsonl') || (looksJSON && text.trim().split('\n').every(l => !l.trim() || l.trim().startsWith('{')))) {
    return rowsFromJSONL(text)
  }
  if (text.trim().startsWith('[')) { try { return JSON.parse(text) } catch (e) {} }
  return rowsFromCSV(text)
}

;(async () => {
  const incoming = (await loadSource(source))
    .map(r => ({
      timestamp: r.timestamp || r.date || new Date().toISOString(),
      name: r.name || '', email: r.email || '', linkedin: r.linkedin || '', twitter: r.twitter || '',
      startingOut: r.startingOut || '', niche: r.niche || '', topic: r.topic || '',
    }))
    .filter(r => r.email || r.linkedin || r.twitter || r.name)

  console.log(`Parsed ${incoming.length} signup row(s) from source.`)
  if (!incoming.length) { console.log('Nothing to import.'); return }

  // Existing identities (dedup)
  const existing = new Set()
  try {
    fs.readFileSync(LEADS_FILE, 'utf8').split('\n').forEach(l => {
      l = l.trim(); if (!l) return
      try { const k = identityKey(JSON.parse(l)); if (k) existing.add(k) } catch (e) {}
    })
  } catch (e) {}

  let added = 0, profilesWritten = 0, skipped = 0
  const linesToAppend = []
  const seenThisRun = new Set()

  for (const r of incoming) {
    const k = identityKey(r)
    if (!k) { skipped++; continue }
    if (existing.has(k) || seenThisRun.has(k)) { skipped++; continue }
    seenThisRun.add(k)
    linesToAppend.push(JSON.stringify(r))
    added++

    // Merge contact onto the email user's profile so admin + returning-user load works
    if (r.email && !dry) {
      try {
        fs.mkdirSync(PROFILES_DIR, { recursive: true })
        const pPath = path.join(PROFILES_DIR, hashEmail(r.email) + '.json')
        let prof = null
        try { prof = JSON.parse(fs.readFileSync(pPath, 'utf8')) } catch (e) {}
        const now = new Date().toISOString()
        if (!prof) prof = { emailHash: hashEmail(r.email), voiceProfile: null, positioning: null, lastSettings: { tone: '', platform: '', cta: '', postCount: 3, outputType: 'full' }, posts: [], createdAt: r.timestamp || now, updatedAt: now }
        const prev = prof.contact || {}
        prof.contact = {
          name: r.name || prev.name || '', email: r.email || prev.email || '',
          linkedin: r.linkedin || prev.linkedin || '', twitter: r.twitter || prev.twitter || '',
          updatedAt: now,
        }
        fs.writeFileSync(pPath, JSON.stringify(prof))
        profilesWritten++
      } catch (e) { console.warn('  profile merge failed for', r.email, '-', e.message) }
    } else if (r.email && dry) {
      profilesWritten++
    }
  }

  if (!dry && linesToAppend.length) {
    fs.mkdirSync(DATA_ROOT, { recursive: true })
    fs.appendFileSync(LEADS_FILE, linesToAppend.join('\n') + '\n')
  }

  console.log('───────────────────────────────────────────')
  console.log('DATA_ROOT       :', DATA_ROOT)
  console.log(dry ? 'DRY RUN (nothing written)' : 'Import complete.')
  console.log('New signups     :', added)
  console.log('Profiles merged :', profilesWritten, '(email users)')
  console.log('Skipped (dupes) :', skipped)
})().catch(e => { console.error('Import error:', e.message); process.exit(1) })
