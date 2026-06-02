/* ══════════════════════════════════════════════════════════════════════════
   XLink shared module — voice profile, voice input, speak hints,
   post tracking storage, and the repurpose modal. Used on every page.
   Exposes window.XL
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  const VOICE_KEY = 'xlink_voice_profile'
  const POSTS_KEY = 'xlink_posts'

  // ─── Injected CSS (keeps page files clean, consistent black/white design) ──
  const css = `
  .xl-voice-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#86efac;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:99px;padding:4px 11px}
  .xl-voice-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 7px #22c55e}
  .xl-voice-reset{font-size:12px;font-weight:600;color:rgba(255,255,255,0.35);text-decoration:none;margin-left:8px;transition:color .15s}
  .xl-voice-reset:hover{color:rgba(255,255,255,0.7)}
  .xl-voice-link{font-size:13px;font-weight:600;color:rgba(255,255,255,0.6);text-decoration:none}
  .xl-voice-link:hover{color:#fff}

  .xl-speak-hint{font-size:11px;color:rgba(255,255,255,0.22);margin-top:5px;display:flex;align-items:center;gap:5px;font-weight:500}

  .xl-pill{position:fixed;z-index:9000;display:flex;align-items:center;gap:8px;background:#16161d;border:1px solid rgba(255,255,255,0.14);border-radius:99px;padding:8px 14px;font-size:12px;font-weight:600;color:#fff;box-shadow:0 10px 30px rgba(0,0,0,0.5);pointer-events:none}
  .xl-pill .xl-mic{width:9px;height:9px;border-radius:50%;background:#ef4444;animation:xlpulse 1s ease-in-out infinite}
  .xl-pill.processing .xl-mic{background:#f59e0b;animation:none}
  .xl-pill.tip .xl-mic{display:none}
  @keyframes xlpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}

  .xl-modal-overlay{position:fixed;inset:0;z-index:8000;display:none;align-items:center;justify-content:center;padding:24px;background:rgba(6,6,10,0.8);backdrop-filter:blur(8px)}
  .xl-modal-overlay.open{display:flex}
  .xl-modal{position:relative;width:100%;max-width:560px;max-height:88vh;overflow-y:auto;background:#111114;border:1px solid rgba(255,255,255,0.12);border-radius:22px;padding:28px;box-shadow:0 30px 80px rgba(0,0,0,0.6)}
  .xl-modal::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(96,165,250,0.5),transparent)}
  .xl-modal-close{position:absolute;top:16px;right:18px;background:none;border:none;color:rgba(255,255,255,0.35);font-size:24px;line-height:1;cursor:pointer;transition:color .15s}
  .xl-modal-close:hover{color:#fff}
  .xl-modal-title{font-size:21px;font-weight:900;letter-spacing:-.5px;margin-bottom:18px;color:#fff}
  .xl-rp-options{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px}
  @media(max-width:520px){.xl-rp-options{grid-template-columns:1fr}}
  .xl-rp-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:16px 14px;cursor:pointer;transition:all .15s;text-align:left}
  .xl-rp-card:hover{border-color:rgba(37,99,235,0.5);background:rgba(37,99,235,0.08)}
  .xl-rp-card.active{border-color:#2563eb;background:rgba(37,99,235,0.12)}
  .xl-rp-card-t{font-size:14px;font-weight:700;color:#fff;margin-bottom:4px}
  .xl-rp-card-d{font-size:11px;color:rgba(255,255,255,0.4);line-height:1.45}
  .xl-rp-output{margin-top:4px}
  .xl-rp-loading{text-align:center;padding:32px 12px;color:rgba(255,255,255,0.4);font-size:13px}
  .xl-rp-ring{width:34px;height:34px;border:3px solid rgba(255,255,255,0.08);border-top-color:#2563eb;border-radius:50%;animation:xlspin .7s linear infinite;margin:0 auto 14px}
  @keyframes xlspin{to{transform:rotate(360deg)}}
  .xl-tweet{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:13px 15px;margin-bottom:9px}
  .xl-tweet-meta{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:rgba(96,165,250,0.8);margin-bottom:6px}
  .xl-tweet-text{font-size:13px;line-height:1.6;color:rgba(255,255,255,0.85);white-space:pre-wrap}
  .xl-slide{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;padding:14px 15px;margin-bottom:9px}
  .xl-slide-t{font-size:13px;font-weight:700;color:#fff;margin-bottom:8px}
  .xl-slide-n{color:rgba(96,165,250,0.8)}
  .xl-slide-b{font-size:12.5px;line-height:1.55;color:rgba(255,255,255,0.7);display:flex;gap:9px;margin-bottom:5px}
  .xl-slide-b::before{content:'';width:6px;height:6px;border-radius:50%;background:#2563eb;flex-shrink:0;margin-top:7px}
  .xl-hook-headline{font-size:22px;font-weight:900;letter-spacing:-.5px;line-height:1.2;color:#fff;margin-bottom:16px}
  .xl-hook-benefit{font-size:14px;line-height:1.6;color:rgba(255,255,255,0.78);display:flex;gap:10px;margin-bottom:9px}
  .xl-hook-benefit::before{content:'\\2713';color:#22c55e;font-weight:800;flex-shrink:0}
  .xl-copy{background:none;border:1px solid rgba(255,255,255,0.1);border-radius:8px;padding:7px 13px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.6);cursor:pointer;font-family:inherit;transition:all .15s;display:inline-flex;align-items:center;gap:6px;margin-top:8px}
  .xl-copy:hover{border-color:rgba(255,255,255,0.25);color:#fff}
  .xl-copy.copied{border-color:rgba(34,197,94,0.3);color:#22c55e}
  .xl-rp-err{background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:12px 14px;font-size:13px;color:#fca5a5}
  `
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  // ─── Voice profile helpers ────────────────────────────────────────────────
  function getVoiceProfile() { try { return JSON.parse(localStorage.getItem(VOICE_KEY) || 'null') } catch (e) { return null } }
  function getVoiceProfileRaw() { const v = localStorage.getItem(VOICE_KEY); return v && v !== 'null' ? v : null }
  function setVoiceProfile(p) { localStorage.setItem(VOICE_KEY, JSON.stringify(p)); renderVoiceBadge() }
  function clearVoiceProfile() { localStorage.removeItem(VOICE_KEY); renderVoiceBadge() }

  function renderVoiceBadge() {
    const slot = document.getElementById('voiceBadgeSlot')
    if (!slot) return
    if (getVoiceProfile()) {
      slot.innerHTML = `<span class="xl-voice-badge"><span class="xl-voice-dot"></span>Voice Active</span><a href="#" class="xl-voice-reset" id="xlVoiceReset">Reset Voice</a>`
      const r = document.getElementById('xlVoiceReset')
      if (r) r.addEventListener('click', e => { e.preventDefault(); if (confirm('Reset your voice profile?')) clearVoiceProfile() })
    } else {
      slot.innerHTML = `<a href="/voice" class="xl-voice-link">Set up voice</a>`
    }
  }

  // ─── Post tracking storage ────────────────────────────────────────────────
  function getPosts() { try { return JSON.parse(localStorage.getItem(POSTS_KEY) || '[]') } catch (e) { return [] } }
  function savePosts(a) { localStorage.setItem(POSTS_KEY, JSON.stringify(a)) }
  function upsertPost(rec) {
    const a = getPosts()
    const i = a.findIndex(x => x.id === rec.id)
    if (i >= 0) a[i] = Object.assign({}, a[i], rec)
    else a.push(rec)
    savePosts(a)
    return rec
  }
  function clearPosts() { localStorage.removeItem(POSTS_KEY) }

  // ─── Speak hints under text fields ────────────────────────────────────────
  function addHints() {
    document.querySelectorAll('textarea, input[type=text]').forEach(el => {
      if (el.hasAttribute('data-no-hint') || el.dataset.xlHinted) return
      el.dataset.xlHinted = '1'
      const hint = document.createElement('div')
      hint.className = 'xl-speak-hint'
      hint.innerHTML = 'Hold <span style="font-weight:700">&#8997; Option</span> to speak'
      el.insertAdjacentElement('afterend', hint)
    })
  }

  // ─── Voice input (Feature 2) ──────────────────────────────────────────────
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  let recognition = null
  if (SR) {
    recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'
  }
  let holdTimer = null
  let isRecording = false
  let activeField = null
  let pillEl = null

  function isTextField(el) { return el && el.matches && el.matches('input[type=text], textarea') }

  function makePill() {
    if (pillEl) return pillEl
    pillEl = document.createElement('div')
    pillEl.className = 'xl-pill'
    document.body.appendChild(pillEl)
    return pillEl
  }
  function positionPill(field) {
    const p = makePill()
    const r = field.getBoundingClientRect()
    let top = r.top - 44
    if (top < 8) top = r.bottom + 8
    p.style.top = top + 'px'
    p.style.left = Math.max(8, r.left) + 'px'
  }
  function showListening(field) {
    const p = makePill(); p.className = 'xl-pill'
    p.innerHTML = '<span class="xl-mic"></span>Listening...'
    positionPill(field)
  }
  function showProcessingThenHide() {
    if (!pillEl) return
    pillEl.className = 'xl-pill processing'
    pillEl.innerHTML = '<span class="xl-mic"></span>Processing...'
    setTimeout(hidePill, 700)
  }
  function showTip(field) {
    const p = makePill(); p.className = 'xl-pill tip'
    p.innerHTML = 'Voice input works in Chrome'
    positionPill(field)
    setTimeout(hidePill, 2200)
  }
  function hidePill() { if (pillEl) { pillEl.remove(); pillEl = null } }

  document.addEventListener('keydown', e => {
    if (e.key === 'Alt' && !isRecording && isTextField(document.activeElement)) {
      if (holdTimer) return
      activeField = document.activeElement
      holdTimer = setTimeout(() => {
        holdTimer = null
        if (!SR) { showTip(activeField); return }
        isRecording = true
        showListening(activeField)
        try { recognition.start() } catch (err) { isRecording = false; hidePill() }
      }, 1500)
    }
  })
  document.addEventListener('keyup', e => {
    if (e.key === 'Alt') {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null }
      if (isRecording) { try { recognition.stop() } catch (err) {} }
    }
  })
  if (recognition) {
    recognition.onresult = e => {
      const transcript = e.results[0][0].transcript
      const f = activeField || document.activeElement
      if (isTextField(f)) {
        f.value += (f.value ? ' ' : '') + transcript
        f.dispatchEvent(new Event('input', { bubbles: true }))
      }
    }
    recognition.onerror = () => {}
    recognition.onend = () => { isRecording = false; showProcessingThenHide() }
  }

  // ─── Repurpose modal (Feature 4) ──────────────────────────────────────────
  let rpText = ''
  function buildRepurposeModal() {
    if (document.getElementById('xlRepurposeOverlay')) return
    const ov = document.createElement('div')
    ov.className = 'xl-modal-overlay'
    ov.id = 'xlRepurposeOverlay'
    ov.innerHTML = `
      <div class="xl-modal">
        <button class="xl-modal-close" id="xlRpClose" aria-label="Close">&times;</button>
        <div class="xl-modal-title">Turn this post into more</div>
        <div class="xl-rp-options" id="xlRpOptions">
          <div class="xl-rp-card" data-fmt="x-thread"><div class="xl-rp-card-t">X Thread</div><div class="xl-rp-card-d">Expand into a 5 to 7 tweet thread</div></div>
          <div class="xl-rp-card" data-fmt="linkedin-carousel"><div class="xl-rp-card-t">LinkedIn Carousel</div><div class="xl-rp-card-d">A 6 slide carousel outline</div></div>
          <div class="xl-rp-card" data-fmt="lead-magnet-hook"><div class="xl-rp-card-t">Lead Magnet Hook</div><div class="xl-rp-card-d">Headline plus 3 benefits</div></div>
        </div>
        <div class="xl-rp-output" id="xlRpOutput"></div>
      </div>`
    document.body.appendChild(ov)
    ov.addEventListener('click', e => { if (e.target === ov) closeRepurpose() })
    document.getElementById('xlRpClose').addEventListener('click', closeRepurpose)
    ov.querySelectorAll('.xl-rp-card').forEach(card => {
      card.addEventListener('click', () => {
        ov.querySelectorAll('.xl-rp-card').forEach(c => c.classList.remove('active'))
        card.classList.add('active')
        runRepurpose(card.dataset.fmt)
      })
    })
  }
  function openRepurpose(text) {
    buildRepurposeModal()
    rpText = text || ''
    document.getElementById('xlRpOutput').innerHTML = ''
    document.querySelectorAll('#xlRpOptions .xl-rp-card').forEach(c => c.classList.remove('active'))
    document.getElementById('xlRepurposeOverlay').classList.add('open')
  }
  function closeRepurpose() {
    const ov = document.getElementById('xlRepurposeOverlay')
    if (ov) ov.classList.remove('open')
  }
  async function runRepurpose(fmt) {
    const out = document.getElementById('xlRpOutput')
    out.innerHTML = '<div class="xl-rp-loading"><div class="xl-rp-ring"></div>Repurposing your post...</div>'
    try {
      const r = await fetch('/api/repurpose', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post: rpText, format: fmt, voiceProfile: getVoiceProfileRaw() }),
      })
      const d = await r.json()
      if (!r.ok || d.error) throw new Error(d.error || 'Failed')
      renderRepurpose(d.result, fmt)
    } catch (e) {
      out.innerHTML = `<div class="xl-rp-err">${esc(e.message)}</div>`
    }
  }
  function renderRepurpose(result, fmt) {
    const out = document.getElementById('xlRpOutput')
    let html = '', copyText = ''
    if (fmt === 'x-thread' && result.tweets) {
      html = result.tweets.map((t, i) => `<div class="xl-tweet"><div class="xl-tweet-meta">Tweet ${i + 1} &middot; ${t.length} chars</div><div class="xl-tweet-text">${esc(t)}</div></div>`).join('')
      copyText = result.tweets.map((t, i) => `${i + 1}/ ${t}`).join('\n\n')
    } else if (fmt === 'linkedin-carousel' && result.slides) {
      html = result.slides.map((s, i) => `<div class="xl-slide"><div class="xl-slide-t"><span class="xl-slide-n">Slide ${i + 1}</span> &middot; ${esc(s.title)}</div>${(s.bullets || []).map(b => `<div class="xl-slide-b">${esc(b)}</div>`).join('')}</div>`).join('')
      copyText = result.slides.map((s, i) => `Slide ${i + 1}: ${s.title}\n${(s.bullets || []).map(b => '- ' + b).join('\n')}`).join('\n\n')
    } else if (fmt === 'lead-magnet-hook') {
      html = `<div class="xl-hook-headline">${esc(result.headline || '')}</div>` + (result.benefits || []).map(b => `<div class="xl-hook-benefit">${esc(b)}</div>`).join('')
      copyText = (result.headline || '') + '\n\n' + (result.benefits || []).map(b => '- ' + b).join('\n')
    } else {
      out.innerHTML = `<div class="xl-rp-err">Unexpected output format.</div>`
      return
    }
    out.innerHTML = html + `<button class="xl-copy" id="xlRpCopy">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copy</button>`
    document.getElementById('xlRpCopy').addEventListener('click', function () {
      navigator.clipboard.writeText(copyText).then(() => {
        this.classList.add('copied')
        this.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>Copied'
      })
    })
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() { renderVoiceBadge(); addHints(); buildRepurposeModal() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()

  window.XL = {
    getVoiceProfile, getVoiceProfileRaw, setVoiceProfile, clearVoiceProfile, renderVoiceBadge,
    getPosts, savePosts, upsertPost, clearPosts,
    addHints, openRepurpose, esc,
  }
})()
