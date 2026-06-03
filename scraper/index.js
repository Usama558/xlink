const fs = require('fs')
const path = require('path')
const xml2js = require('xml2js')
const { FEEDS, CATEGORIES } = require('./feeds.js')

const DATA_DIR = path.join(__dirname, '..', 'data')
const CACHE_FILE = path.join(DATA_DIR, 'feed-cache.json')
const SIX_HOURS_MS = 6 * 60 * 60 * 1000
const REFRESH_INTERVAL_MS = SIX_HOURS_MS

const NEWSAPI_QUERIES = [
  'business entrepreneurship', 'marketing growth', 'artificial intelligence',
  'ecommerce retail', 'startup founder', 'freelancing remote work',
]
// map a query topic to a category bucket
const QUERY_CATEGORY = {
  'business entrepreneurship': 'Business',
  'marketing growth': 'Marketing',
  'artificial intelligence': 'AI',
  'ecommerce retail': 'Ecommerce',
  'startup founder': 'SaaS',
  'freelancing remote work': 'Leadership',
}

function ensureDataDir() {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch (e) {}
}
function clean(s) {
  return String(s == null ? '' : s)
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ').trim()
}
function pickText(v) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  if (Array.isArray(v)) return pickText(v[0])
  if (typeof v === 'object') return pickText(v._ || v['#text'] || (v.$ && v.$.href) || '')
  return String(v)
}
function pickLink(entry) {
  // RSS <link>text</link>, or Atom <link href="">
  if (entry.link) {
    if (typeof entry.link === 'string') return entry.link
    if (Array.isArray(entry.link)) {
      const alt = entry.link.find(l => l && l.$ && (!l.$.rel || l.$.rel === 'alternate'))
      const l = alt || entry.link[0]
      if (l && l.$) return l.$.href || ''
      if (typeof l === 'string') return l
    }
    if (entry.link.$) return entry.link.$.href || ''
  }
  return ''
}

// ── One RSS / Atom feed → article objects. Never throws. ──
async function fetchRSSFeed(feed) {
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; XLinkBot/1.0; +https://xlink.app)' },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return []
    const xml = await res.text()
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false, trim: true })

    let entries = []
    if (parsed.rss && parsed.rss.channel) entries = parsed.rss.channel.item || []
    else if (parsed.feed && parsed.feed.entry) entries = parsed.feed.entry || []        // Atom
    else if (parsed['rdf:RDF'] && parsed['rdf:RDF'].item) entries = parsed['rdf:RDF'].item || []
    if (!Array.isArray(entries)) entries = [entries]

    const now = Date.now()
    return entries.map(e => {
      const title = clean(pickText(e.title))
      if (!title) return null
      const desc = clean(pickText(e.description || e.summary || e.content || e['content:encoded'] || ''))
      const pubRaw = pickText(e.pubDate || e.published || e.updated || e['dc:date'] || '')
      const ts = pubRaw ? Date.parse(pubRaw) : 0
      return {
        title,
        description: desc.slice(0, 400),
        link: pickLink(e),
        source: feed.name,
        category: feed.category,
        pubDate: ts ? new Date(ts).toISOString() : '',
        fetchedAt: now,
      }
    }).filter(Boolean)
  } catch (e) {
    return []
  }
}

// ── NewsAPI (optional) ──
async function fetchNewsAPI(query, category) {
  const key = process.env.NEWSAPI_KEY
  if (!key) return []
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=100&apiKey=${key}`
    const res = await fetch(url, { headers: { 'User-Agent': 'XLinkBot/1.0' }, signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const data = await res.json()
    const now = Date.now()
    return (data.articles || []).filter(a => a.title && a.title !== '[Removed]').map(a => ({
      title: clean(a.title),
      description: clean(a.description || '').slice(0, 400),
      link: a.url || '',
      source: (a.source && a.source.name) || 'NewsAPI',
      category,
      pubDate: a.publishedAt || '',
      fetchedAt: now,
    }))
  } catch (e) { console.warn('[scraper] NewsAPI failed:', e.message); return [] }
}

// ── Guardian API (optional, free unlimited) ──
async function fetchGuardianAPI(query, category) {
  const key = process.env.GUARDIAN_API_KEY
  if (!key) return []
  try {
    const url = `https://content.guardianapis.com/search?q=${encodeURIComponent(query)}&api-key=${key}&page-size=50&order-by=newest&show-fields=trailText`
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const data = await res.json()
    const results = (data.response && data.response.results) || []
    const now = Date.now()
    return results.filter(r => r.webTitle).map(r => ({
      title: clean(r.webTitle),
      description: clean((r.fields && r.fields.trailText) || '').slice(0, 400),
      link: r.webUrl || '',
      source: 'The Guardian',
      category,
      pubDate: r.webPublicationDate || '',
      fetchedAt: now,
    }))
  } catch (e) { console.warn('[scraper] Guardian failed:', e.message); return [] }
}

// ── Fetch everything in parallel, dedupe ──
async function fetchAllFeeds() {
  console.log(`Feed refresh started — fetching ${FEEDS.length} RSS feeds + API sources`)

  const rssResults = await Promise.allSettled(FEEDS.map(f => fetchRSSFeed(f)))
  let rssArticles = [], rssFailed = 0, rssOk = 0
  rssResults.forEach(r => {
    if (r.status === 'fulfilled' && Array.isArray(r.value) && r.value.length) { rssArticles.push(...r.value); rssOk++ }
    else rssFailed++
  })
  console.log(`RSS complete: ${rssArticles.length} articles from ${rssOk} feeds (${rssFailed} failed silently)`)

  // NewsAPI
  let newsArticles = []
  if (process.env.NEWSAPI_KEY) {
    const r = await Promise.allSettled(NEWSAPI_QUERIES.map(q => fetchNewsAPI(q, QUERY_CATEGORY[q] || 'Business')))
    r.forEach(x => { if (x.status === 'fulfilled') newsArticles.push(...x.value) })
  }
  console.log(`NewsAPI complete: ${newsArticles.length} articles`)

  // Guardian
  let guardianArticles = []
  if (process.env.GUARDIAN_API_KEY) {
    const r = await Promise.allSettled(NEWSAPI_QUERIES.map(q => fetchGuardianAPI(q, QUERY_CATEGORY[q] || 'Business')))
    r.forEach(x => { if (x.status === 'fulfilled') guardianArticles.push(...x.value) })
  }
  console.log(`Guardian API complete: ${guardianArticles.length} articles`)

  const all = [...rssArticles, ...newsArticles, ...guardianArticles]
  const seen = new Set(), unique = []
  for (const a of all) {
    const key = a.title.toLowerCase().slice(0, 50)
    if (!key || seen.has(key)) continue
    seen.add(key); unique.push(a)
  }
  console.log(`Deduplication: ${all.length} total → ${unique.length} unique articles`)
  return unique
}

// ── Refresh and write cache ──
async function refreshCache() {
  ensureDataDir()
  const articles = await fetchAllFeeds()

  const byCategory = {}
  CATEGORIES.forEach(c => { byCategory[c] = [] })
  for (const a of articles) {
    const c = byCategory[a.category] ? a.category : 'Business'
    byCategory[c].push(a)
  }
  // sort by pubDate desc, cap 200
  Object.keys(byCategory).forEach(c => {
    byCategory[c].sort((x, y) => (Date.parse(y.pubDate) || 0) - (Date.parse(x.pubDate) || 0))
    byCategory[c] = byCategory[c].slice(0, 200)
  })
  const totalArticles = Object.values(byCategory).reduce((s, a) => s + a.length, 0)
  const cache = { refreshedAt: new Date().toISOString(), totalArticles, byCategory }

  try { fs.writeFileSync(CACHE_FILE, JSON.stringify(cache)) } catch (e) { console.error('[scraper] cache write failed:', e.message) }
  const nCats = Object.values(byCategory).filter(a => a.length).length
  console.log(`Cache written: ${totalArticles} articles across ${nCats} categories`)
  console.log(`Feed cache refreshed: ${totalArticles} articles across ${nCats} categories`)
  console.log('Next refresh in 6 hours')
  return cache
}

// ── Read cache (sync). Returns null if missing/corrupt (deletes corrupt). ──
function getCachedFeed() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'))
  } catch (e) {
    if (fs.existsSync(CACHE_FILE)) { try { fs.unlinkSync(CACHE_FILE) } catch (e2) {} }
    return null
  }
}

function isCacheStale() {
  const cache = getCachedFeed()
  if (!cache || !cache.refreshedAt) return true
  return (Date.now() - Date.parse(cache.refreshedAt)) > SIX_HOURS_MS
}

module.exports = { fetchRSSFeed, fetchNewsAPI, fetchGuardianAPI, fetchAllFeeds, refreshCache, getCachedFeed, isCacheStale, REFRESH_INTERVAL_MS, SIX_HOURS_MS, CATEGORIES }
