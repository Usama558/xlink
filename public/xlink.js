/* ══════════════════════════════════════════════════════════════════════════
   XLink shared module — voice profile, voice input, speak hints,
   post tracking storage, and the repurpose modal. Used on every page.
   Exposes window.XL
═══════════════════════════════════════════════════════════════════════════ */
(function () {
  const VOICE_KEY = 'xlink_voice_profile'
  const POSTS_KEY = 'xlink_posts'
  const POS_KEY = 'xlink_positioning'
  const IDEAS_SEEN_KEY = 'xlink_ideas_seen'

  // ─── Injected CSS (keeps page files clean, consistent black/white design) ──
  const css = `
  .xl-voice-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#86efac;background:rgba(34,197,94,0.1);border:1px solid rgba(34,197,94,0.25);border-radius:99px;padding:4px 11px}
  .xl-voice-dot{width:6px;height:6px;border-radius:50%;background:#22c55e;box-shadow:0 0 7px #22c55e}
  .xl-voice-reset{font-size:12px;font-weight:600;color:var(--t3);text-decoration:none;margin-left:8px;transition:color .15s}
  .xl-voice-reset:hover{color:var(--ink)}
  .xl-voice-link{font-size:13px;font-weight:600;color:var(--t2);text-decoration:none}
  .xl-voice-link:hover{color:var(--ink)}

  .xl-speak-hint{display:inline-flex;align-items:center;gap:6px;margin-top:8px;font-size:11px;font-weight:600;color:var(--accent-l);background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.28);border-radius:99px;padding:4px 11px;width:fit-content;max-width:100%}
  .xl-speak-hint svg{flex-shrink:0}
  .xl-speak-hint kbd{font-family:inherit;font-weight:800;background:rgba(37,99,235,0.22);border-radius:5px;padding:1px 5px}
  html[data-theme="light"] .xl-speak-hint{color:#1d4ed8}

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

  /* light theme — flips the ink + surfaces; accent stays */
  html[data-theme="light"]{--bg:#f4f6f9;--bg-rgb:244,246,249;--s1:#ffffff;--s2:#eceff3;--ink:#0e0f16;--ink-rgb:14,15,22}
  html[data-theme="light"] body{background:var(--bg)}
  html[data-theme="light"] .xl-voice-badge{color:#15803d}
  .xl-pos-badge{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:#93c5fd;background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.25);border-radius:99px;padding:4px 11px;margin-left:8px}
  html[data-theme="light"] .xl-pos-badge{color:#1d4ed8}
  .xl-new-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;margin-left:5px;vertical-align:middle;box-shadow:0 0 6px rgba(239,68,68,.7)}
  html[data-theme="light"] .xl-voice-link{color:#1d4ed8}
  .xl-theme-toggle{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(var(--ink-rgb),0.05);border:1px solid var(--b2);color:var(--t2);cursor:pointer;transition:all .15s;flex-shrink:0;padding:0}
  .xl-theme-toggle:hover{color:var(--t1);border-color:var(--b3)}

  /* mobile nav: hamburger + slide-down menu */
  .xl-hamburger{display:none;align-items:center;justify-content:center;width:34px;height:34px;border-radius:10px;background:rgba(var(--ink-rgb),0.05);border:1px solid var(--b2);color:var(--t1);cursor:pointer;padding:0;flex-shrink:0}
  .xl-mobile-menu{display:none;position:fixed;top:62px;left:0;right:0;z-index:190;background:var(--s1);border-bottom:1px solid var(--b2);padding:10px 16px;flex-direction:column;gap:3px;box-shadow:0 24px 50px rgba(0,0,0,.45)}
  .xl-mobile-menu.open{display:flex}
  .xl-mobile-menu a{padding:12px 12px;border-radius:10px;font-size:15px;font-weight:600;color:var(--t1);text-decoration:none}
  .xl-mobile-menu a.cta{background:var(--accent);color:#fff;text-align:center;margin-top:4px}
  .xl-mobile-menu a:not(.cta):active,.xl-mobile-menu a:not(.cta):hover{background:rgba(var(--ink-rgb),0.06)}
  .xl-mobile-menu .locked-item{padding:12px;font-size:15px;font-weight:600;color:var(--t4);opacity:.6}
  @media(max-width:760px){
    nav{padding:0 16px !important}
    .xl-hamburger{display:inline-flex}
    nav .nav-link,nav .nav-cta,nav .nav-magnet,nav #voiceBadgeSlot{display:none !important}
  }
  @media(max-width:420px){
    .nav-wordmark{display:none}
  }
  `
  const style = document.createElement('style')
  style.textContent = css
  document.head.appendChild(style)

  // ─── Theme (dark default / light) ─────────────────────────────────────────
  const THEME_KEY = 'xlink_theme'
  function applyTheme(t) {
    if (t === 'light') document.documentElement.setAttribute('data-theme', 'light')
    else document.documentElement.removeAttribute('data-theme')
  }
  function currentTheme() { return document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark' }
  function setTheme(t) { try { localStorage.setItem(THEME_KEY, t) } catch (e) {} applyTheme(t); updateThemeIcon() }
  function toggleTheme() { setTheme(currentTheme() === 'light' ? 'dark' : 'light') }
  // apply stored theme immediately (the head script handles the very first paint)
  try { applyTheme(localStorage.getItem(THEME_KEY)) } catch (e) {}

  const SUN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4"/></svg>'
  const MOON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
  function updateThemeIcon() { const b = document.getElementById('xlThemeToggle'); if (b) b.innerHTML = currentTheme() === 'light' ? MOON : SUN }
  function mountThemeToggle() {
    if (document.getElementById('xlThemeToggle')) return
    const btn = document.createElement('button')
    btn.id = 'xlThemeToggle'
    btn.className = 'xl-theme-toggle'
    btn.title = 'Toggle light and dark mode'
    btn.setAttribute('aria-label', 'Toggle light and dark mode')
    btn.addEventListener('click', toggleTheme)
    const slot = document.getElementById('voiceBadgeSlot')
    if (slot && slot.parentNode) slot.parentNode.insertBefore(btn, slot)
    else { const nav = document.querySelector('nav'); if (nav) nav.appendChild(btn) }
    updateThemeIcon()
  }

  // ─── Mobile hamburger menu (keeps every page reachable on phones) ──────────
  function mountMobileMenu() {
    if (document.getElementById('xlBurger')) return
    const toggle = document.getElementById('xlThemeToggle')
    const container = toggle ? toggle.parentNode : (document.querySelector('nav .nav-right') || document.querySelector('nav'))
    if (!container) return

    const burger = document.createElement('button')
    burger.id = 'xlBurger'
    burger.className = 'xl-hamburger'
    burger.setAttribute('aria-label', 'Open menu')
    burger.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M3 6h18M3 12h18M3 18h18"/></svg>'
    container.appendChild(burger)

    const menu = document.createElement('div')
    menu.id = 'xlMobileMenu'
    menu.className = 'xl-mobile-menu'
    menu.innerHTML =
      '<a href="/">Home</a>' +
      '<a href="/voice">Set Up Voice</a>' +
      '<a href="/ideas">Daily Ideas</a>' +
      '<a href="/results">Your Posts</a>' +
      '<span class="locked-item">Lead Magnet — coming soon</span>' +
      '<a href="/#app" class="cta">Start Creating</a>'
    document.body.appendChild(menu)

    burger.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open') })
    menu.addEventListener('click', e => e.stopPropagation())
    document.addEventListener('click', () => menu.classList.remove('open'))
  }

  // ─── Voice profile helpers ────────────────────────────────────────────────
  function getVoiceProfile() { try { return JSON.parse(localStorage.getItem(VOICE_KEY) || 'null') } catch (e) { return null } }
  function getVoiceProfileRaw() { const v = localStorage.getItem(VOICE_KEY); return v && v !== 'null' ? v : null }
  function setVoiceProfile(p) { localStorage.setItem(VOICE_KEY, JSON.stringify(p)); renderVoiceBadge() }
  function clearVoiceProfile() { localStorage.removeItem(VOICE_KEY); renderVoiceBadge() }

  function renderVoiceBadge() {
    const slot = document.getElementById('voiceBadgeSlot')
    if (!slot) return
    let html = ''
    if (getVoiceProfile()) {
      html += `<span class="xl-voice-badge"><span class="xl-voice-dot"></span>Voice Active</span><a href="#" class="xl-voice-reset" id="xlVoiceReset">Reset Voice</a>`
    } else {
      html += `<a href="/voice" class="xl-voice-link">Set up voice</a>`
    }
    if (getPositioning()) {
      html += `<span class="xl-pos-badge"><span class="xl-voice-dot" style="background:#60a5fa;box-shadow:0 0 7px #60a5fa"></span>Positioning</span><a href="/#app" class="xl-voice-reset">Edit</a>`
    }
    slot.innerHTML = html
    const r = document.getElementById('xlVoiceReset')
    if (r) r.addEventListener('click', e => { e.preventDefault(); if (confirm('Reset your voice profile?')) clearVoiceProfile() })
  }

  // ─── Positioning ──────────────────────────────────────────────────────────
  function getPositioning() { try { return JSON.parse(localStorage.getItem(POS_KEY) || 'null') } catch (e) { return null } }
  function setPositioning(p) { localStorage.setItem(POS_KEY, JSON.stringify(p)); renderVoiceBadge() }
  function clearPositioning() { localStorage.removeItem(POS_KEY); renderVoiceBadge() }

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

  // ─── Email-based profile sync (silent, never blocks the user) ─────────────
  const EMAIL_KEY = 'xlink_current_email'
  function getEmail() { try { return localStorage.getItem(EMAIL_KEY) || '' } catch (e) { return '' } }
  function setEmail(e) { try { if (e) localStorage.setItem(EMAIL_KEY, e) } catch (err) {} }

  async function fetchProfile(email) {
    if (!email) return null
    try {
      const r = await fetch('/api/profile?email=' + encodeURIComponent(email))
      const d = await r.json()
      return d && d.exists ? d : null
    } catch (e) { return null }
  }
  async function fetchProfilePosts(email) {
    if (!email) return []
    try {
      const r = await fetch('/api/profile/posts?email=' + encodeURIComponent(email))
      const d = await r.json()
      return (d && Array.isArray(d.posts)) ? d.posts : []
    } catch (e) { return [] }
  }
  async function saveProfile(payload) {
    const email = payload && payload.email ? payload.email : getEmail()
    if (!email) return
    try {
      await fetch('/api/profile', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.assign({ email }, payload)),
      })
    } catch (e) { /* silent */ }
  }
  async function saveVoiceToAccount(voiceProfile) {
    const email = getEmail()
    if (!email) return
    await saveProfile({ email, voiceProfile: typeof voiceProfile === 'string' ? voiceProfile : JSON.stringify(voiceProfile) })
  }
  async function syncPost(post) {
    const email = getEmail()
    if (!email || !post) return
    try {
      await fetch('/api/profile/posts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, post }),
      })
    } catch (e) { /* silent */ }
  }
  function deletePostLocal(id) {
    savePosts(getPosts().filter(p => p.id !== id))
  }
  async function deletePost(id) {
    deletePostLocal(id)
    const email = getEmail()
    if (!email) return
    try {
      await fetch('/api/profile/posts/delete', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, id }),
      })
    } catch (e) { /* silent */ }
  }

  // ─── Speak hints under text fields ────────────────────────────────────────
  function addHints() {
    document.querySelectorAll('textarea, input').forEach(el => {
      if (!isTextField(el)) return
      if (el.hasAttribute('data-no-hint') || el.dataset.xlHinted) return
      el.dataset.xlHinted = '1'
      const hint = document.createElement('div')
      hint.className = 'xl-speak-hint'
      hint.innerHTML = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4"/></svg>Hold <kbd>&#8997; Option</kbd> and speak to write'
      el.insertAdjacentElement('afterend', hint)
    })
  }

  // ─── Voice input (Feature 2) ──────────────────────────────────────────────
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition
  let recognition = null
  if (SR) {
    recognition = new SR()
    recognition.continuous = true       // keep listening while Option is held
    recognition.interimResults = true   // show words live as they are spoken
    recognition.lang = 'en-US'
    recognition.maxAlternatives = 1
  }
  const HOLD_MS = 350                    // short, deliberate hold so it feels instant
  let holdTimer = null
  let isRecording = false               // a session is active (key held)
  let activeField = null
  let pillEl = null
  let baseValue = ''                    // field text when the session started
  let finalText = ''                    // committed transcript this session

  function isTextField(el) {
    if (!el || !el.tagName) return false
    if (el.tagName === 'TEXTAREA') return true
    if (el.isContentEditable) return true
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase()
      // text-like inputs only — never email/number/password/checkbox
      return t === 'text' || t === 'search' || t === '' || t === 'url' || t === 'tel'
    }
    return false
  }

  function writeField(interim) {
    if (!activeField) return
    const add = (finalText + interim).replace(/\s+/g, ' ').trim()
    activeField.value = baseValue + (baseValue && add ? ' ' : '') + add
    activeField.dispatchEvent(new Event('input', { bubbles: true }))
    // follow the latest words as they are written
    try {
      const end = activeField.value.length
      activeField.selectionStart = activeField.selectionEnd = end
      activeField.scrollTop = activeField.scrollHeight   // textarea: scroll to newest line
      activeField.scrollLeft = activeField.scrollWidth   // input: keep caret in view
    } catch (e) {}
  }
  function startSession() {
    if (!SR) { showTip(activeField); return }
    isRecording = true
    baseValue = activeField.value || ''
    finalText = ''
    showListening(activeField)
    try { recognition.start() } catch (err) {}
  }

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
    if (e.key === 'Alt' && !isRecording && !holdTimer && isTextField(document.activeElement)) {
      e.preventDefault()
      activeField = document.activeElement
      holdTimer = setTimeout(() => { holdTimer = null; startSession() }, HOLD_MS)
    }
  })
  document.addEventListener('keyup', e => {
    if (e.key === 'Alt') {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null }
      if (isRecording) {
        isRecording = false              // user released -> end session
        try { recognition.stop() } catch (err) {}
        showProcessingThenHide()
      }
    }
  })
  if (recognition) {
    recognition.onresult = e => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]
        if (r.isFinal) finalText += ' ' + r[0].transcript
        else interim += ' ' + r[0].transcript
      }
      writeField(interim)
    }
    recognition.onerror = ev => {
      // 'no-speech' / transient errors: ignore and let onend handle restart
      if (ev && (ev.error === 'not-allowed' || ev.error === 'service-not-allowed')) {
        isRecording = false
        const f = activeField
        hidePill()
        if (f) { const p = makePill(); p.className = 'xl-pill tip'; p.innerHTML = 'Allow microphone access to use voice'; positionPill(f); setTimeout(hidePill, 2600) }
      }
    }
    recognition.onend = () => {
      // browsers auto-stop on a pause; if the user is still holding, keep going
      if (isRecording) { try { recognition.start() } catch (err) {} }
    }
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

  // ─── "New" ideas badge on the nav link ────────────────────────────────────
  function markIdeasSeen(genAt) { try { localStorage.setItem(IDEAS_SEEN_KEY, genAt || new Date().toISOString()) } catch (e) {} }
  async function checkIdeasBadge() {
    const link = document.getElementById('navIdeas')
    if (!link) return
    try {
      const r = await fetch('/api/ideas/daily'); const d = await r.json()
      if (!d || !d.generatedAt) return
      const seen = localStorage.getItem(IDEAS_SEEN_KEY)
      const fresh = (Date.now() - Date.parse(d.generatedAt)) < 24 * 60 * 60 * 1000
      const unseen = !seen || Date.parse(d.generatedAt) > Date.parse(seen)
      if (fresh && unseen && !link.querySelector('.xl-new-dot')) {
        link.insertAdjacentHTML('beforeend', '<span class="xl-new-dot" title="New ideas"></span>')
      }
    } catch (e) {}
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() { mountThemeToggle(); mountMobileMenu(); renderVoiceBadge(); addHints(); buildRepurposeModal(); checkIdeasBadge() }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()

  window.XL = {
    getVoiceProfile, getVoiceProfileRaw, setVoiceProfile, clearVoiceProfile, renderVoiceBadge,
    getPosts, savePosts, upsertPost, clearPosts,
    addHints, openRepurpose, esc,
    setTheme, toggleTheme, currentTheme,
    getEmail, setEmail, fetchProfile, fetchProfilePosts, saveProfile, saveVoiceToAccount, syncPost, deletePost,
    getPositioning, setPositioning, clearPositioning, markIdeasSeen,
  }
})()
