const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

const app = express()
const PORT = process.env.PORT || 3000

app.set('trust proxy', 1) // Railway terminates TLS; trust x-forwarded-* for req.ip / req.secure
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Clean URL for the lead magnet page
app.get('/lead-magnet', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'lead-magnet.html')))

// ─── Startup diagnostics ──────────────────────────────────────────────────────
console.log('--- XLink startup ---')
console.log('Node version :', process.version)
console.log('PORT         :', PORT)
console.log('API key set  :', !!process.env.ANTHROPIC_API_KEY)

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  return new Anthropic({ apiKey: key })
}

// ─── Global writing rules + voice profile injection (every content call) ──────
const GLOBAL_WRITING_RULES = `STRICT WRITING RULES — follow these without exception:
- Never use contractions: no I've, I'd, I'll, I'm, we've, they've, you've, don't, won't, can't, isn't, aren't, wasn't, weren't, hasn't, haven't, hadn't, wouldn't, couldn't, shouldn't
- Never use em dashes — or double hyphens --
- Never use filler phrases: in today's world, it is important to note, as we all know, at the end of the day, needless to say
- Write in short sentences. One idea per line.
- Direct, punchy, operator voice.
- No academic or corporate language.`

function voiceLine(voiceProfile) {
  if (!voiceProfile) return ''
  let json = typeof voiceProfile === 'string' ? voiceProfile : JSON.stringify(voiceProfile)
  json = json.trim().slice(0, 2200)
  if (!json || json === 'null') return ''
  return `\n\nAlso mirror this exact voice profile: ${json}`
}

// Clean a model response that may be wrapped in markdown fences
function stripFences(raw) {
  return raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()
}

// ─── Niche → subreddit mapping ────────────────────────────────────────────────
const SUBREDDIT_MAP = {
  // Business
  'Agency':             ['agency', 'Entrepreneur'],
  'Consulting':         ['consulting', 'Entrepreneur'],
  'Freelancing':        ['freelance', 'freelancing'],
  'SaaS':               ['SaaS', 'startups'],
  'Startup':            ['startups', 'Entrepreneur'],
  'E-commerce':         ['ecommerce', 'shopify'],
  'Dropshipping':       ['dropship', 'dropshipping'],
  'Amazon FBA':         ['FulfillmentByAmazon', 'AmazonSeller'],
  'Real Estate':        ['realestate', 'REI'],
  'Investing':          ['investing', 'SecurityAnalysis'],
  'Crypto':             ['CryptoCurrency', 'ethereum'],
  'Stock Market':       ['stocks', 'investing'],
  'Personal Finance':   ['personalfinance', 'financialindependence'],
  'Insurance':          ['Insurance', 'Entrepreneur'],
  'Accounting':         ['Accounting', 'personalfinance'],
  'B2B Sales':          ['sales', 'b2b'],
  'Venture Capital':    ['venturecapital', 'startups'],
  'Side Hustles':       ['sidehustle', 'Entrepreneur'],
  'Monetization':       ['Entrepreneur', 'startups'],
  'Private Equity':     ['investing', 'finance'],
  // Marketing
  'SEO':                ['SEO', 'bigseo'],
  'Paid Ads':           ['PPC', 'advertising'],
  'Email Marketing':    ['emailmarketing', 'digital_marketing'],
  'Social Media':       ['socialmedia', 'digital_marketing'],
  'Content Marketing':  ['content_marketing', 'marketing'],
  'Copywriting':        ['copywriting', 'marketing'],
  'Branding':           ['branding', 'marketing'],
  'PR':                 ['PublicRelations', 'marketing'],
  'Influencer Marketing': ['influencermarketing', 'marketing'],
  'Affiliate Marketing':  ['affiliatemarketing', 'Affiliatemarketing'],
  'Video Marketing':    ['videomarketing', 'NewTubers'],
  'TikTok Growth':      ['Tiktokhelp', 'socialmedia'],
  'LinkedIn Growth':    ['linkedin', 'LinkedInAds'],
  'Community Building': ['communitymanagement', 'Entrepreneur'],
  'Conversion Optimization': ['CRO', 'marketing'],
  // Health & Fitness
  'Weight Loss':        ['loseit', 'WeightLossAdvice'],
  'Bodybuilding':       ['bodybuilding', 'gainit'],
  'Nutrition':          ['nutrition', 'EatCheapAndHealthy'],
  'Yoga':               ['yoga', 'flexibility'],
  'Mental Health':      ['mentalhealth', 'anxiety'],
  'Meditation':         ['meditation', 'mindfulness'],
  'Running':            ['running', 'AdvancedRunning'],
  'CrossFit':           ['crossfit', 'fitness'],
  'Biohacking':         ['biohacking', 'Nootropics'],
  'Longevity':          ['longevity', 'biohacking'],
  'Sleep Optimization': ['sleep', 'insomnia'],
  'Fasting':            ['intermittentfasting', 'fasting'],
  'Cycling':            ['cycling', 'bicycling'],
  'Martial Arts':       ['martialarts', 'BJJ'],
  'Flexibility':        ['flexibility', 'yoga'],
  // Creator Economy
  'YouTube':            ['NewTubers', 'youtubers'],
  'Podcasting':         ['podcasting', 'podcast'],
  'Newsletter':         ['newsletters', 'Entrepreneur'],
  'Blogging':           ['Blogging', 'juststart'],
  'Twitch Streaming':   ['Twitch', 'TwitchStreaming'],
  'Photography':        ['photography', 'AskPhotography'],
  'Videography':        ['videography', 'filmmakers'],
  'Graphic Design':     ['graphic_design', 'design'],
  'UI/UX':              ['UXDesign', 'userexperience'],
  'Substack':           ['Newsletters', 'writing'],
  'Course Creation':    ['onlinecourses', 'Entrepreneur'],
  'Personal Branding':  ['personalbranding', 'marketing'],
  'Ghostwriting':       ['Ghostwriting', 'writing'],
  'Notion Templates':   ['Notion', 'productivity'],
  // Career
  'Job Hunting':        ['jobs', 'jobsearch'],
  'Remote Work':        ['remotework', 'digitalnomad'],
  'Productivity':       ['productivity', 'getdisciplined'],
  'Leadership':         ['leadership', 'management'],
  'Management':         ['management', 'humanresources'],
  'Public Speaking':    ['PublicSpeaking', 'Toastmasters'],
  'Personal Development': ['selfimprovement', 'personaldev'],
  'Career Coaching':    ['careerguidance', 'jobs'],
  'Networking':         ['networking', 'Entrepreneur'],
  'Resume Writing':     ['resumes', 'jobs'],
  'Executive Coaching': ['leadership', 'Entrepreneur'],
  'Negotiation':        ['negotiation', 'sales'],
  // Education
  'Online Courses':     ['onlinecourses', 'Entrepreneur'],
  'Tutoring':           ['tutoring', 'Teachers'],
  'Parenting':          ['Parenting', 'beyondthebump'],
  'Homeschooling':      ['homeschool', 'homeschooling'],
  'Language Learning':  ['languagelearning', 'learnspanish'],
  'E-Learning':         ['elearning', 'edtech'],
  'EdTech':             ['edtech', 'education'],
  'Study Skills':       ['studytips', 'GetStudying'],
  // Lifestyle
  'Travel':             ['travel', 'solotravel'],
  'Fashion':            ['femalefashionadvice', 'malefashionadvice'],
  'Food & Cooking':     ['Cooking', 'recipes'],
  'Relationships':      ['relationship_advice', 'relationships'],
  'Dating':             ['dating_advice', 'dating'],
  'Minimalism':         ['minimalism', 'minimalists'],
  'Sustainability':     ['sustainability', 'ZeroWaste'],
  'Luxury Lifestyle':   ['fatFIRE', 'financialindependence'],
  'Spirituality':       ['spirituality', 'meditation'],
  // Tech
  'AI Tools':           ['artificial', 'ChatGPT'],
  'No-Code':            ['nocode', 'webdev'],
  'Web Development':    ['webdev', 'learnprogramming'],
  'Cybersecurity':      ['cybersecurity', 'netsec'],
  'Blockchain':         ['ethereum', 'CryptoCurrency'],
  'Gaming':             ['gaming', 'gamedev'],
  'Data Science':       ['datascience', 'learnmachinelearning'],
  'DevOps':             ['devops', 'sysadmin'],
  'SaaS Tools':         ['SaaS', 'software'],
  'Automation':         ['automation', 'nocode'],
  'Prompt Engineering': ['PromptEngineering', 'ChatGPT'],
  'AR/VR':              ['virtualreality', 'augmentedreality'],
  'Mobile Development': ['androiddev', 'iOSProgramming'],
  'Cloud Computing':    ['aws', 'devops'],
  // Niche Professions
  'Law':                ['law', 'legaladvice'],
  'Medicine':           ['medicine', 'medicalschool'],
  'Dentistry':          ['Dentistry', 'DentalSchool'],
  'Architecture':       ['architecture', 'urbanplanning'],
  'Interior Design':    ['InteriorDesign', 'malelivingspace'],
  'Wedding':            ['weddingplanning', 'wedding'],
  'Pets':               ['pets', 'dogs'],
  'Cars & Automotive':  ['cars', 'Cartalk'],
  'Sports Coaching':    ['sportscience', 'Coaching'],
  'Finance Coaching':   ['personalfinance', 'financialindependence'],
  'Therapy & Counseling': ['therapy', 'mentalhealth'],
  'Chiropractic':       ['Chiropractic', 'physicaltherapy'],
  'Veterinary':         ['veterinary', 'vet'],
}

// Keyword-based fallback so the 200+ niche labels resolve to relevant subreddits
const KEYWORD_SUBS = [
  [/real estate|rental|house flip|reit|commercial real/i, ['realestate','realestateinvesting']],
  [/crypto|bitcoin|defi|nft|web3|blockchain/i,            ['CryptoCurrency','ethereum']],
  [/stock|index fund|day trad|option|invest|angel|venture|private equity|wealth|family office/i, ['investing','stocks']],
  [/personal finance|budget|debt|fire|financial independ|retirement|financial plan/i, ['personalfinance','financialindependence']],
  [/tax|account|bookkeep|cfo/i,                           ['Accounting','tax']],
  [/insurance/i,                                          ['Insurance','personalfinance']],
  [/seo/i,                                                ['SEO','bigseo']],
  [/\bads\b|ppc|facebook ad|google ad|tiktok ad/i,        ['PPC','advertising']],
  [/email|sms market/i,                                   ['emailmarketing','marketing']],
  [/copywrit|direct response/i,                           ['copywriting','marketing']],
  [/funnel|landing page|conversion|cro|growth hack|viral market/i, ['marketing','Entrepreneur']],
  [/influencer|affiliate|partnership market|community market|event market|\bpr\b/i, ['marketing','Entrepreneur']],
  [/newsletter|substack/i,                                ['Newsletters','writing']],
  [/linkedin/i,                                           ['linkedin','marketing']],
  [/twitter|x \(twitter\)|x growth/i,                     ['Twitter','socialmedia']],
  [/instagram/i,                                          ['Instagram','socialmedia']],
  [/tiktok/i,                                             ['Tiktokhelp','socialmedia']],
  [/youtub/i,                                             ['NewTubers','youtubers']],
  [/podcast/i,                                            ['podcasting','podcast']],
  [/weight loss|fat loss/i,                               ['loseit','fitness']],
  [/muscle|bodybuild|powerlift|olympic lift|calisthenic|functional fitness|athletic|sports perform/i, ['bodybuilding','fitness']],
  [/crossfit/i,                                           ['crossfit','fitness']],
  [/run|marathon|triathlon/i,                             ['running','fitness']],
  [/cycl/i,                                               ['cycling','bicycling']],
  [/swim/i,                                               ['Swimming','fitness']],
  [/yoga|pilates|stretch|mobility|flexib/i,               ['yoga','flexibility']],
  [/nutrition|meal plan|macro|keto|carnivore|vegan|fasting|gut health|diet/i, ['nutrition','EatCheapAndHealthy']],
  [/hormone|longevity|biohack/i,                          ['Biohackers','longevity']],
  [/sleep/i,                                              ['sleep','GetMotivated']],
  [/mental health|anxiety|depress|therapy|mindful|meditat|breathwork|stress/i, ['mentalhealth','meditation']],
  [/photograph/i,                                         ['photography','AskPhotography']],
  [/videograph|filmmak|documentar|motion graphic|animation|\beditor\b/i, ['Filmmakers','editors']],
  [/design|ui\/ux|illustrat|comic/i,                      ['Design','graphic_design']],
  [/game develop/i,                                       ['gamedev','IndieDev']],
  [/indie hack|app develop|no-code|nocode|low-code|prompt engineer|ai tools|ai develop|automation/i, ['SaaS','indiehackers']],
  [/ghostwrit|speechwrit|author|publish|blog|journal|\bwriter\b/i, ['writing','Blogging']],
  [/job|resume|interview|\bcareer\b|recruit|talent|executive search/i, ['jobs','careerguidance']],
  [/leadership|management|consult|strategy|organizational|team build|operations|process improv|six sigma/i, ['leadership','consulting']],
  [/remote work|digital nomad|work life/i,                ['remotework','digitalnomad']],
  [/productiv|time management|project management|agile|scrum/i, ['productivity','projectmanagement']],
  [/supply chain|logistic/i,                              ['supplychain','logistics']],
  [/software|frontend|backend|full stack|mobile develop|\bios\b|android|devops|cloud|\baws\b|data scien|machine learning|cybersecur|robotic|\biot\b|hardware|ar\/vr/i, ['programming','webdev']],
  [/education|tutor|test prep|language learn|homeschool|college admiss|\bmba\b|law school|medical school|certificat|curriculum|instructional|edtech|learning|skill develop|corporate train/i, ['education','Teachers']],
  [/travel|van life|expat|nomad/i,                        ['travel','solotravel']],
  [/minimalism|sustainab|zero waste/i,                    ['minimalism','ZeroWaste']],
  [/fashion|streetwear|beauty|skincare|haircare|sneaker|watches|luxury good/i, ['femalefashionadvice','malefashionadvice']],
  [/food|cook|bak|wine|coffee/i,                          ['Cooking','recipes']],
  [/relationship|dating|marriage|divorce/i,               ['relationship_advice','dating_advice']],
  [/parent|fatherhood|motherhood/i,                       ['Parenting','daddit']],
  [/stoic|philosoph|spiritual|religion|astrolog/i,        ['Stoicism','philosophy']],
  [/self-improv|self improv/i,                            ['selfimprovement','getdisciplined']],
  [/true crime/i,                                         ['TrueCrime','UnresolvedMysteries']],
  [/football|soccer|basketball|tennis|golf|motorsport|esports|chess|sport/i, ['sports','sportsbook']],
  [/\bcars?\b|motorcycle/i,                               ['cars','motorcycles']],
  [/\bpets?\b|\bdogs?\b|horse/i,                           ['pets','dogs']],
  [/agency|freelanc|startup|saas|ecommerce|e-commerce|dropship|amazon fba|print on demand|wholesale|business|\bsales\b|franchise|restaurant|retail|course creat|membership|mastermind|community|info product|productized/i, ['Entrepreneur','smallbusiness']],
]

function getSubreddits(niche) {
  const exact = Object.keys(SUBREDDIT_MAP).find(k => k.toLowerCase() === niche.toLowerCase())
  if (exact) return SUBREDDIT_MAP[exact]
  for (const [re, subs] of KEYWORD_SUBS) {
    if (re.test(niche)) return subs
  }
  return ['Entrepreneur', 'smallbusiness']
}

// ─── Trend fetchers ───────────────────────────────────────────────────────────

async function fetchReddit(subreddits, timeWindow) {
  const t = timeWindow === '24h' ? 'day' : 'week'
  const results = []

  for (const sub of subreddits.slice(0, 2)) {
    try {
      const url = `https://www.reddit.com/r/${sub}/top.json?t=${t}&limit=8`
      const res = await fetch(url, {
        headers: { 'User-Agent': 'XLink/2.0 (content research tool)' },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const posts = data?.data?.children || []
      for (const child of posts) {
        const d = child.data
        if (!d.title || d.stickied) continue
        results.push({
          title:  d.title,
          score:  d.score || 0,
          source: `Reddit r/${sub}`,
          type:   'reddit',
        })
      }
    } catch (e) {
      console.warn(`[reddit] r/${sub} failed:`, e.message)
    }
  }
  return results
}

async function fetchHackerNews(niche, timeWindow) {
  try {
    const cutoff = Math.floor(Date.now() / 1000) - (timeWindow === '24h' ? 86400 : 604800)
    const query  = encodeURIComponent(niche)
    const url    = `https://hn.algolia.com/api/v1/search?query=${query}&tags=story&numericFilters=created_at_i>${cutoff}&hitsPerPage=8`
    const res    = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits || [])
      .filter(h => h.title)
      .map(h => ({
        title:  h.title,
        score:  h.points || 0,
        source: 'Hacker News',
        type:   'hackernews',
      }))
  } catch (e) {
    console.warn('[hn] fetch failed:', e.message)
    return []
  }
}

async function fetchGoogleNews(niche) {
  try {
    const q   = encodeURIComponent(niche)
    const url = `https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) return []
    const xml = await res.text()
    return parseRSSItems(xml, 'Google News')
  } catch (e) {
    console.warn('[news] Google RSS failed:', e.message)
    return []
  }
}

function parseRSSItems(xml, sourceName) {
  const out = []
  const blocks = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
  for (const m of blocks.slice(0, 6)) {
    const block = m[1]
    const titleRaw = block.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>|<title>([\s\S]*?)<\/title>/)
    if (!titleRaw) continue
    const title = (titleRaw[1] || titleRaw[2] || '')
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    if (!title || title.length < 10) continue
    out.push({ title, score: null, source: sourceName, type: 'news' })
  }
  return out
}

// ══════════════════════════════════════════════════════════════════════════
// DEEP TREND RESEARCH (last 15 days, keyword-driven, multi-source)
// ══════════════════════════════════════════════════════════════════════════
const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000

// Reddit keyword search (last month, then filtered to 15 days)
async function redditSearchRecent(query) {
  try {
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&t=month&limit=25`
    const res = await fetch(url, { headers: { 'User-Agent': 'XLink/3.0 research' }, signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.children || []).filter(c => c.data && c.data.title && !c.data.stickied).map(c => ({
      title: c.data.title,
      score: c.data.score || 0,
      source: 'Reddit r/' + (c.data.subreddit || '?'),
      ts: (c.data.created_utc || 0) * 1000,
    }))
  } catch (e) { return [] }
}
// Hacker News keyword search within last 15 days
async function hnSearchRecent(query) {
  try {
    const cutoff = Math.floor((Date.now() - FIFTEEN_DAYS_MS) / 1000)
    const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${cutoff}&hitsPerPage=20`
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.hits || []).filter(h => h.title).map(h => ({
      title: h.title, score: h.points || 0, source: 'Hacker News', ts: (h.created_at_i || 0) * 1000,
    }))
  } catch (e) { return [] }
}
// Google News keyword search (RSS, with pubDate)
async function googleNewsRecent(query) {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}%20when:15d&hl=en-US&gl=US&ceid=US:en`
    const res = await fetch(url, { signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const xml = await res.text()
    const out = []
    for (const m of [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 12)) {
      const block = m[1]
      const tm = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
      const dm = block.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
      if (!tm) continue
      const title = tm[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      if (!title || title.length < 8) continue
      out.push({ title, score: null, source: 'Google News', ts: dm ? Date.parse(dm[1]) : 0 })
    }
    return out
  } catch (e) { return [] }
}

// POST /api/research — deep multi-source research over the last 15 days
app.post('/api/research', async (req, res) => {
  const { niche, keywords, details } = req.body || {}
  const kws = (Array.isArray(keywords) ? keywords : String(keywords || '').split(','))
    .map(k => String(k).trim()).filter(Boolean).slice(0, 5)
  if (!niche && !kws.length) return res.status(400).json({ error: 'Provide a niche or at least one keyword' })

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const queries = [...new Set([...kws, niche].filter(Boolean))]
  const now = Date.now()

  // Fan out across every query × every source
  const tasks = []
  for (const q of queries) {
    tasks.push(redditSearchRecent(q))
    tasks.push(hnSearchRecent(q))
    tasks.push(googleNewsRecent(q))
  }
  const settled = await Promise.allSettled(tasks)
  let items = []
  settled.forEach(s => { if (s.status === 'fulfilled' && Array.isArray(s.value)) items.push(...s.value) })

  // keep only last 15 days (when a timestamp exists), dedupe, rank
  items = items.filter(it => !it.ts || (now - it.ts) <= FIFTEEN_DAYS_MS)
  const seen = new Set(), uniq = []
  for (const it of items.sort((a, b) => (b.score || 0) - (a.score || 0))) {
    const key = it.title.toLowerCase().replace(/\W+/g, ' ').trim().slice(0, 70)
    if (!key || seen.has(key)) continue
    seen.add(key); uniq.push(it)
  }
  const corpus = uniq.slice(0, 60)
  console.log(`[research] niche="${niche}" kws=[${kws.join(', ')}] gathered=${items.length} unique=${uniq.length}`)

  if (!corpus.length) {
    return res.json({ trends: [], scanned: 0, note: 'No recent public data found for these keywords in the last 15 days.' })
  }

  const system = `You are a sharp trend research analyst. You are given raw public data items (titles + sources) collected from Reddit, Hacker News, and Google News over the LAST 15 DAYS for a niche and a set of keywords. Identify the most significant REAL, current trends.

Rules:
- Base every trend strictly on the provided items. Do not invent facts, numbers, or companies.
- Each trend must be concrete: who/what happened.
- Write the implication for the niche audience.

Return ONLY valid JSON, no markdown:
{ "trends": [ { "title": "short trend headline", "summary": "2 to 3 sentences on what is actually happening, with specifics", "why_it_matters": "one sentence implication for the niche audience", "sources": ["short source labels"] } ] }
Provide 6 to 10 distinct trends, most significant first.`

  const user = `Niche: ${niche || 'general'}
Keywords: ${kws.join(', ') || 'none'}
${details ? 'Extra direction: ' + details + '\n' : ''}Raw items collected (title — source):
${corpus.map((it, i) => `${i + 1}. ${it.title} — ${it.source}`).join('\n')}`

  try {
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 3200, system, messages: [{ role: 'user', content: user }] })
    const cleaned = stripFences(msg.content[0].text.trim())
    let parsed
    try { parsed = JSON.parse(cleaned) } catch (e) { return res.status(500).json({ error: 'Research synthesis returned invalid JSON' }) }
    const trends = Array.isArray(parsed) ? parsed : (parsed.trends || [])
    res.json({ trends, scanned: corpus.length })
  } catch (err) {
    console.error('[research] API error:', err.message)
    res.status(500).json({ error: 'API error: ' + (err.message || 'unknown') })
  }
})

// ─── POST /api/trends ─────────────────────────────────────────────────────────
app.post('/api/trends', async (req, res) => {
  const { niche, trendWindow } = req.body
  if (!niche || !trendWindow) return res.status(400).json({ error: 'Missing niche or trendWindow' })

  console.log(`[trends] niche="${niche}" window=${trendWindow}`)

  const subreddits = getSubreddits(niche)
  const [redditItems, hnItems, newsItems] = await Promise.all([
    fetchReddit(subreddits, trendWindow),
    fetchHackerNews(niche, trendWindow),
    fetchGoogleNews(niche),
  ])

  const all = [...redditItems, ...hnItems, ...newsItems]

  // Deduplicate by normalised title prefix
  const seen = new Set()
  const unique = []
  for (const item of all.sort((a, b) => (b.score || 0) - (a.score || 0))) {
    const key = item.title.toLowerCase().replace(/\W+/g, ' ').trim().slice(0, 60)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(item)
  }

  const trends = unique.slice(0, 12)
  console.log(`[trends] returning ${trends.length} items (reddit:${redditItems.length} hn:${hnItems.length} news:${newsItems.length})`)
  res.json({ trends })
})

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(filters, trends, voiceProfile) {
  const platformInstructions = {
    'x-post':   'Platform: X (Twitter) single post. Max 280 characters. Zero hashtags. One punchy idea.',
    'x-thread': 'Platform: X (Twitter) thread. 5 to 8 numbered tweets. First tweet is the hook. Last tweet has the CTA. Each tweet under 280 characters.',
    'linkedin': 'Platform: LinkedIn post. 150 to 300 words. Professional authority voice. Single line breaks between ideas. Zero hashtags.',
  }

  const outputInstruction = filters.outputType === 'hook'
    ? 'OUTPUT TYPE: Hook only. Return only the single opening line. Nothing else.'
    : 'OUTPUT TYPE: Full post. Complete from opening hook to closing CTA.'

  const refBlock = filters.referencePosts && filters.referencePosts.trim()
    ? `\nREFERENCE POSTS — the user pasted these as style targets. Study their sentence length, paragraph structure, hook style, line breaks, and overall rhythm. Mirror that exact structure and energy in your output, while keeping the content fully original. Do not copy their words, names, or specifics:
"""
${filters.referencePosts.trim().slice(0, 4000)}
"""
`
    : ''

  const filtersBlock = `FILTERS TO APPLY:
- Tone: ${filters.tone}
- POV: ${filters.pov}
- Hook type: ${filters.hookType}
- Post goal: ${filters.postGoal}
- Target audience: ${filters.targetAudience}
- CTA: ${filters.cta}
- Writing style: ${filters.writingStyle}
${filters.contrarianBelief ? `- Contrarian belief to embed: "${filters.contrarianBelief}"` : ''}
${filters.personalResult ? `- Personal result to include: "${filters.personalResult}"` : ''}`

  const framework = `VIRAL FRAMEWORK — hit all 6 in every post:
1. STIMULATED: first line triggers curiosity or emotion. No warm-up.
2. CAPTIVATED: middle builds tension or contrast. Never lose momentum.
3. ANTICIPATION: signal early that something the reader needs is coming.
4. VALIDATION: make the reader feel seen. Confirm a belief they hold but rarely hear out loud.
5. AFFECTION: be human, be specific. Show a real person wrote this.
6. REVELATION: close with an insight that feels surprising then immediately obvious.`

  const isTrends = filters.mode === 'trends' && Array.isArray(trends) && trends.length

  if (isTrends) {
    const trendBlock = trends.map((t, i) =>
      `${i + 1}. ${t.title}\n   What is happening: ${t.summary || ''}\n   Why it matters: ${t.why_it_matters || ''}`
    ).join('\n\n')

    return {
      system: `You are a world-class social media ghostwriter who writes timely posts about REAL, current trends.

${platformInstructions[filters.platform] || platformInstructions['x-post']}
${outputInstruction}

CRITICAL — TREND-GROUNDED POSTS:
Every post must be about ONE of the specific researched trends below. Lead with the concrete development (name the company, product, event, or number from the trend). Then deliver the implication for ${filters.niche} readers: this happened, here is what it means, here is what to do. Never write generic advice that could have been posted any day. No fabricated facts beyond the research provided.

${filtersBlock}
${refBlock}
${framework}

${GLOBAL_WRITING_RULES}${voiceLine(voiceProfile)}

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown fences. No extra text.
Each element: {
  "format": "one of: Hot Take / Contrarian / Story / Tactical / Insight Drop / Prediction / Question Hook",
  "text": "the complete post, grounded in the specific trend",
  "source_title": "the exact trend title this post is about",
  "frameworks": ["framework names hit: STIMULATED CAPTIVATED ANTICIPATION VALIDATION AFFECTION REVELATION"],
  "reason": "one sentence on why this angle lands"
}`,
      user: `Niche: ${filters.niche}
Generate exactly ${filters.count} post(s). Each post must be grounded in ONE of these researched trends from the last 15 days:

${trendBlock}

Spread posts across different trends. Reference the actual development in each post. This is trend commentary, not generic content.`,
    }
  }

  // ── "Create your own content" mode — topic-driven ──
  const topic = (filters.topic && filters.topic.trim()) || filters.niche
  return {
    system: `You are a world-class social media ghostwriter. You write posts that spread.

${platformInstructions[filters.platform] || platformInstructions['x-post']}
${outputInstruction}

CENTRAL TOPIC — every post must be about this. Never drift off it:
"${topic}"

${filtersBlock}
${refBlock}
${framework}

${GLOBAL_WRITING_RULES}${voiceLine(voiceProfile)}

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown fences. No extra text.
Each element: {
  "format": "one of: Hot Take / Contrarian / Story / Tactical / Mindset Shift / Listicle Hook / Personal Confession / Insight Drop / Question Hook / Prediction",
  "text": "the complete post text, ready to publish",
  "frameworks": ["framework names hit: STIMULATED CAPTIVATED ANTICIPATION VALIDATION AFFECTION REVELATION"],
  "reason": "one sentence on why this angle drives engagement"
}`,
    user: `Write about this topic: "${topic}"
Niche: ${filters.niche}
Generate exactly ${filters.count} post(s). Vary the angles and formats. Every post must clearly be about the topic.`,
  }
}

// ─── POST /api/generate ───────────────────────────────────────────────────────
// ─── New positioning-based generation prompt ──────────────────────────────────
function buildGenPrompt(o) {
  const platformMap = {
    'x-post':   'X Post — one punchy single post under 280 characters.',
    'x-thread': 'X Thread — 5 to 8 short tweets, each under 280 characters, first tweet is the hook.',
    'linkedin': 'LinkedIn — longer narrative allowed, punchy short paragraphs, line breaks between ideas, zero hashtags.',
  }
  const platLabel = { 'x-post': 'X Post', 'x-thread': 'X Thread', 'linkedin': 'LinkedIn' }[o.platform] || 'X Post'
  const p = o.positioning || {}
  const voice = o.voiceProfile ? (typeof o.voiceProfile === 'string' ? o.voiceProfile : JSON.stringify(o.voiceProfile)) : 'direct, punchy, short sentences'
  const outputRule = o.output === 'hook' ? 'Hook only mode: return only the first 1 to 2 lines, nothing else.' : 'Full post: complete from hook to close.'
  const ctaRule = (!o.cta || o.cta === 'No CTA') ? 'No CTA.' : `End with this call to action intent: ${o.cta}.`

  const system = `You are a world-class ghostwriter for ${p.what || 'a creator'}.

WHO THIS IS FOR: ${p.who || 'their audience'}
THEIR AUTHORITY: ${p.result || 'the real results they deliver'}
THEIR WORLDVIEW: ${p.belief || 'a strong, specific point of view'}
VOICE PROFILE: ${voice}

PLATFORM: ${platLabel}
${platformMap[o.platform] || platformMap['x-post']}
TONE: ${o.tone || 'Contrarian'}
FORMAT: ${o.output === 'hook' ? 'Hook only' : 'Full post'}
CTA: ${o.cta || 'No CTA'}

TASK: Write ${o.count} post(s) that take a strong, specific stance on the trend/topic below, from the worldview above. Each post must feel like it was written by a real person with a real opinion, not a content tool. ${ctaRule} ${outputRule}

VIRAL FRAMEWORK — weave all 6 into every post:
- STIMULATED: first line triggers curiosity or a strong reaction
- CAPTIVATED: middle creates tension or contrast that keeps reading
- ANTICIPATION: reader feels something important is coming
- VALIDATION: reader feels seen and understood
- AFFECTION: warmth or realness toward the writer
- REVELATION: final insight feels surprising yet obvious

${GLOBAL_WRITING_RULES}

Return ONLY valid JSON, no markdown, no backticks:
{ "posts": [ { "id": "uuid", "text": "full post text", "platform": "${platLabel}", "tone": "${o.tone || 'Contrarian'}", "source_preview": "first 60 chars of the trend input", "hook": "first line only" } ] }`

  const user = `THE TREND/TOPIC TO REACT TO:
"""
${String(o.input || '').slice(0, 4000)}
"""

Write exactly ${o.count} post(s) now.`
  return { system, user }
}

app.post('/api/generate', async (req, res) => {
  const b = req.body || {}
  const input = (b.input || '').trim()
  if (!input) return res.status(400).json({ error: 'Provide a trend or topic to react to' })
  const count = [1, 2, 3, 5].includes(Number(b.count)) ? Number(b.count) : 3

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const { system, user } = buildGenPrompt({
    input, platform: b.platform || 'x-post', tone: b.tone || 'Contrarian', cta: b.cta || 'No CTA',
    count, output: b.output || 'full', positioning: b.positioning || null, voiceProfile: b.voiceProfile || null,
  })
  console.log(`[generate] platform=${b.platform} tone=${b.tone} count=${count} input="${input.slice(0, 40)}"`)

  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 4096,
      system,
      messages:   [{ role: 'user', content: user }],
    })

    const raw = message.content[0].text.trim()
    console.log('[generate] raw length:', raw.length)

    // Strip markdown fences if present
    const cleaned = raw
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let posts
    try {
      const parsed = JSON.parse(cleaned)
      posts = Array.isArray(parsed) ? parsed : parsed.posts || parsed.ideas || Object.values(parsed)[0]
      if (!Array.isArray(posts)) throw new Error('not an array')
    } catch (e) {
      console.error('[generate] parse error:', e.message)
      console.error('[generate] cleaned output:\n', cleaned.slice(0, 600))
      return res.status(500).json({ error: 'Model returned invalid JSON: ' + e.message })
    }

    console.log('[generate] success, posts:', posts.length)
    res.json({ posts })

  } catch (err) {
    console.error('[generate] API error:', err.message)
    if (err.status)  console.error('  status:', err.status)
    if (err.error)   console.error('  body:', JSON.stringify(err.error))
    res.status(500).json({ error: 'API error: ' + (err.message || 'unknown') })
  }
})

// ─── Lead magnet: weekly rate limit (server-enforced, keyed by user id) ───────
const MAGNET_USAGE_FILE = path.join(__dirname, 'magnet_usage.json')
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function readMagnetUsage() {
  try { return JSON.parse(fs.readFileSync(MAGNET_USAGE_FILE, 'utf8')) } catch (e) { return {} }
}
function writeMagnetUsage(obj) {
  try { fs.writeFileSync(MAGNET_USAGE_FILE, JSON.stringify(obj)) } catch (e) { console.warn('[magnet] usage write failed:', e.message) }
}
function magnetStatus(uid) {
  const usage = readMagnetUsage()
  const last = usage[uid] || 0
  const allowed = !last || (Date.now() - last) >= WEEK_MS
  return { allowed, nextAvailable: allowed ? 0 : last + WEEK_MS }
}

function buildMagnetPrompt({ topic, audience, type, platform, byline, voiceProfile }) {
  const platformLine = platform === 'linkedin'
    ? 'The promo post is for LinkedIn: 150 to 250 words, professional authority voice, line breaks between ideas, zero hashtags.'
    : 'The promo post is for X (Twitter): under 280 characters, punchy, zero hashtags.'

  return {
    system: `You are an expert lead magnet creator. You build complete, genuinely valuable resources that creators give away to grow their audience. The output must stand on its own as a polished, publish-ready document.

Lead magnet type: ${type || 'Guide'}
Audience: ${audience || 'people in this space'}
Author byline: ${byline || 'the author'}
${platformLine}

CRITICAL — NO THIRD-PARTY BRANDING:
Do not include any platform name, tool name, watermark, "generated by", or "powered by" line anywhere. This is the author's own resource. The only name that may appear is the author byline provided above.

${GLOBAL_WRITING_RULES}${voiceLine(voiceProfile)}

OUTPUT FORMAT — return ONLY valid JSON, no markdown fences, no extra text:
{
  "title": "punchy cover title for the resource",
  "subtitle": "one line selling the outcome the reader gets",
  "tagline": "very short cover kicker, 2 to 4 words, all relevant",
  "intro": "2 to 3 short sentences framing the problem and the promise",
  "sections": [
    { "heading": "section title", "items": ["actionable point", "actionable point", "actionable point"] }
  ],
  "key_takeaways": ["one-line takeaway", "one-line takeaway", "one-line takeaway"],
  "cta": "a closing line that encourages the reader to act or follow the author, with no platform name",
  "promo_post": "a ready-to-publish post announcing this lead magnet, using a strong hook"
}
Provide 4 to 6 sections, each with 3 to 6 items. Provide 3 to 5 key takeaways.`,

    user: `Topic for the lead magnet: "${topic}"
Type: ${type || 'Guide'}
Audience: ${audience || 'general'}
Promo platform: ${platform || 'x'}
Create the complete lead magnet now.`,
  }
}

// ─── GET /api/lead-magnet/status — how long until the user can create again ───
app.get('/api/lead-magnet/status', (req, res) => {
  const uid = req.query.uid || ''
  if (!uid) return res.json({ allowed: true, nextAvailable: 0 })
  res.json(magnetStatus(uid))
})

// ─── POST /api/lead-magnet — generate a full lead magnet (1 per week) ─────────
app.post('/api/lead-magnet', async (req, res) => {
  const { uid, topic, audience, type, platform, byline, email, voiceProfile } = req.body || {}

  if (!uid)            return res.status(400).json({ error: 'Missing user id' })
  if (!topic || !topic.trim()) return res.status(400).json({ error: 'Topic is required' })

  const status = magnetStatus(uid)
  if (!status.allowed) {
    return res.status(429).json({ error: 'You can create one lead magnet per week.', nextAvailable: status.nextAvailable })
  }

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const { system, user } = buildMagnetPrompt({ topic, audience, type, platform, byline, voiceProfile })
  console.log(`[magnet] uid=${uid.slice(0,8)} topic="${topic}" type=${type}`)

  try {
    const message = await client.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 3500,
      system,
      messages:   [{ role: 'user', content: user }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim()

    let magnet
    try { magnet = JSON.parse(cleaned) }
    catch (e) {
      console.error('[magnet] parse error:', e.message, '\n', cleaned.slice(0, 400))
      return res.status(500).json({ error: 'Model returned invalid JSON: ' + e.message })
    }

    // Record usage ONLY on success
    const usage = readMagnetUsage()
    usage[uid] = Date.now()
    writeMagnetUsage(usage)

    // Track the user
    const rec = {
      timestamp: new Date().toISOString(),
      name: byline || '', email: email || '', linkedin: '', twitter: '',
      startingOut: '', niche: audience || '', topic: '[Lead Magnet] ' + topic,
    }
    try { fs.appendFileSync(path.join(__dirname, 'leads.jsonl'), JSON.stringify(rec) + '\n') } catch (e) {}
    const hook = process.env.GOOGLE_SHEET_WEBHOOK_URL
    if (hook) {
      try { await fetch(hook, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(rec), signal: AbortSignal.timeout(8000) }) }
      catch (e) { console.warn('[magnet] sheet forward failed:', e.message) }
    }

    res.json({ magnet, nextAvailable: Date.now() + WEEK_MS })

  } catch (err) {
    console.error('[magnet] API error:', err.message)
    res.status(500).json({ error: 'API error: ' + (err.message || 'unknown') })
  }
})

// ─── POST /api/lead — capture user contact → Google Sheet ─────────────────────
app.post('/api/lead', async (req, res) => {
  const { name, email, linkedin, twitter, startingOut, niche, topic } = req.body || {}

  // Require at least one contact channel
  if (!email && !linkedin && !twitter) {
    return res.status(400).json({ error: 'At least one contact (email, LinkedIn, or X) is required' })
  }

  const lead = {
    timestamp:   new Date().toISOString(),
    name:        name     || '',
    email:       email    || '',
    linkedin:    linkedin || '',
    twitter:     twitter  || '',
    startingOut: startingOut ? 'yes' : 'no',
    niche:       niche    || '',
    topic:       topic    || '',
  }

  // Local fallback (ephemeral on Railway, but useful in dev / before redeploy)
  try {
    fs.appendFileSync(path.join(__dirname, 'leads.jsonl'), JSON.stringify(lead) + '\n')
  } catch (e) {
    console.warn('[lead] local append failed:', e.message)
  }

  // Forward to Google Sheet via Apps Script web app webhook
  const hook = process.env.GOOGLE_SHEET_WEBHOOK_URL
  if (hook) {
    try {
      await fetch(hook, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(lead),
        signal:  AbortSignal.timeout(8000),
      })
      console.log('[lead] forwarded to sheet:', lead.name || lead.email || lead.linkedin || lead.twitter)
    } catch (e) {
      console.warn('[lead] sheet forward failed:', e.message)
    }
  } else {
    console.warn('[lead] GOOGLE_SHEET_WEBHOOK_URL not set — saved locally only')
  }

  res.json({ ok: true })
})

// ─── POST /api/voice — analyze pasted posts into a voice profile ──────────────
app.post('/api/voice', async (req, res) => {
  const { posts } = req.body || {}
  if (!posts || !posts.trim()) return res.status(400).json({ error: 'Paste at least one post to analyze' })

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const system = `Analyze these posts and extract a voice profile. Return ONLY valid JSON with no markdown or backticks:
{
  avg_sentence_length: 'short' or 'medium' or 'long',
  hook_styles: ['list of hook types detected'],
  vocabulary_level: 'simple' or 'technical' or 'mixed',
  tone_markers: ['words or phrases they use often'],
  forbidden_phrases: ['words or phrases they never use'],
  paragraph_style: 'single line' or 'short blocks' or 'longer paragraphs',
  personality: ['3 adjectives describing their writing voice'],
  sample_hooks: ['3 example hooks written in their exact style']
}`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      system,
      messages: [{ role: 'user', content: String(posts).slice(0, 8000) }],
    })
    const cleaned = stripFences(message.content[0].text.trim())
    let profile
    try { profile = JSON.parse(cleaned) }
    catch (e) {
      console.error('[voice] parse error:', e.message, '\n', cleaned.slice(0, 400))
      return res.status(500).json({ error: 'Model returned invalid JSON: ' + e.message })
    }
    console.log('[voice] profile built:', (profile.personality || []).join(', '))
    res.json({ profile })
  } catch (err) {
    console.error('[voice] API error:', err.message)
    res.status(500).json({ error: 'API error: ' + (err.message || 'unknown') })
  }
})

// ─── Repurpose prompt builder ─────────────────────────────────────────────────
function buildRepurposePrompt(post, format, voiceProfile) {
  const base = `You are a world-class social media ghostwriter repurposing an existing post into a new format. Keep the core message, sharpen it for the new format, and keep it fully original.

ORIGINAL POST:
"""
${String(post).slice(0, 3000)}
"""

${GLOBAL_WRITING_RULES}${voiceLine(voiceProfile)}
`

  if (format === 'x-thread') {
    return {
      system: base + `
Repurpose the original post into an X (Twitter) thread of 5 to 7 tweets.
Tweet 1 is the hook. The final tweet has a clear call to action.
Each tweet must be under 280 characters.

Return ONLY valid JSON, no markdown fences:
{ "format": "x-thread", "tweets": ["tweet 1", "tweet 2", "tweet 3", "tweet 4", "tweet 5"] }`,
      user: 'Repurpose the original post into the thread now.',
    }
  }
  if (format === 'linkedin-carousel') {
    return {
      system: base + `
Repurpose the original post into a LinkedIn carousel outline of exactly 6 slides.
Each slide has a short punchy title and exactly 3 bullet points.
Slide 1 is the hook slide. Slide 6 is the call to action slide.

Return ONLY valid JSON, no markdown fences:
{ "format": "linkedin-carousel", "slides": [ { "title": "slide title", "bullets": ["b1", "b2", "b3"] } ] }`,
      user: 'Repurpose the original post into the 6 slide carousel now.',
    }
  }
  // lead-magnet-hook
  return {
    system: base + `
Repurpose the original post into a lead magnet hook.
Produce one large headline and exactly 3 bullet benefit lines that sell the resource.

Return ONLY valid JSON, no markdown fences:
{ "format": "lead-magnet-hook", "headline": "the big headline", "benefits": ["benefit 1", "benefit 2", "benefit 3"] }`,
    user: 'Repurpose the original post into the lead magnet hook now.',
  }
}

// ─── POST /api/repurpose — turn a post into a thread / carousel / hook ────────
app.post('/api/repurpose', async (req, res) => {
  const { post, format, voiceProfile } = req.body || {}
  if (!post || !format) return res.status(400).json({ error: 'Missing post or format' })

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const { system, user } = buildRepurposePrompt(post, format, voiceProfile)
  console.log(`[repurpose] format=${format}`)

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system,
      messages: [{ role: 'user', content: user }],
    })
    const cleaned = stripFences(message.content[0].text.trim())
    let result
    try { result = JSON.parse(cleaned) }
    catch (e) {
      console.error('[repurpose] parse error:', e.message, '\n', cleaned.slice(0, 400))
      return res.status(500).json({ error: 'Model returned invalid JSON: ' + e.message })
    }
    res.json({ result })
  } catch (err) {
    console.error('[repurpose] API error:', err.message)
    res.status(500).json({ error: 'API error: ' + (err.message || 'unknown') })
  }
})

// ─── Email-based profile store (file-based, hashed email as key) ──────────────
const PROFILES_DIR = path.join(__dirname, 'profiles')
try { fs.mkdirSync(PROFILES_DIR, { recursive: true }) } catch (e) {}

function hashEmail(email) {
  return crypto.createHash('sha256').update(String(email).trim().toLowerCase()).digest('hex')
}
function profilePath(email) { return path.join(PROFILES_DIR, hashEmail(email) + '.json') }
function readProfile(email) {
  try { return JSON.parse(fs.readFileSync(profilePath(email), 'utf8')) } catch (e) { return null }
}
function writeProfile(email, profile) {
  try { fs.writeFileSync(profilePath(email), JSON.stringify(profile)); return true }
  catch (e) { console.warn('[profile] write failed:', e.message); return false }
}
function blankProfile(email) {
  const now = new Date().toISOString()
  return {
    emailHash: hashEmail(email),
    voiceProfile: null,
    positioning: null,
    lastSettings: { tone: '', platform: '', cta: '', postCount: 3, outputType: 'full' },
    posts: [],
    createdAt: now,
    updatedAt: now,
  }
}

// GET /api/profile?email= → full profile or { exists:false }
app.get('/api/profile', (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ exists: false })
  const profile = readProfile(email)
  if (!profile) return res.json({ exists: false })
  res.json(Object.assign({ exists: true }, profile))
})

// POST /api/profile → upsert voice profile + last settings
app.post('/api/profile', (req, res) => {
  const b = req.body || {}
  if (!b.email) return res.status(400).json({ saved: false, error: 'Missing email' })

  const profile = readProfile(b.email) || blankProfile(b.email)
  if (!profile.lastSettings) profile.lastSettings = { tone: '', platform: '', cta: '', postCount: 3, outputType: 'full' }
  if (b.voiceProfile !== undefined && b.voiceProfile !== null) {
    profile.voiceProfile = typeof b.voiceProfile === 'string'
      ? (() => { try { return JSON.parse(b.voiceProfile) } catch (e) { return b.voiceProfile } })()
      : b.voiceProfile
  }
  if (b.positioning !== undefined && b.positioning !== null) {
    profile.positioning = typeof b.positioning === 'string'
      ? (() => { try { return JSON.parse(b.positioning) } catch (e) { return b.positioning } })()
      : b.positioning
  }
  profile.lastSettings = {
    tone:       b.lastTone       ?? profile.lastSettings.tone,
    platform:   b.lastPlatform   ?? profile.lastSettings.platform,
    cta:        b.lastCTA        ?? profile.lastSettings.cta,
    postCount:  b.lastPostCount  ?? profile.lastSettings.postCount,
    outputType: b.lastOutputType ?? profile.lastSettings.outputType,
  }
  profile.updatedAt = new Date().toISOString()
  writeProfile(b.email, profile)
  res.json({ saved: true })
})

// POST /api/profile/posts → append a tracked post (cap 200)
app.post('/api/profile/posts', (req, res) => {
  const { email, post } = req.body || {}
  if (!email || !post) return res.status(400).json({ saved: false, error: 'Missing email or post' })

  const profile = readProfile(email) || blankProfile(email)
  if (!Array.isArray(profile.posts)) profile.posts = []
  // replace if same id exists (status/metric updates), else append
  const idx = post.id ? profile.posts.findIndex(p => p.id === post.id) : -1
  if (idx >= 0) profile.posts[idx] = Object.assign({}, profile.posts[idx], post)
  else profile.posts.push(post)
  if (profile.posts.length > 200) profile.posts = profile.posts.slice(-200)
  profile.updatedAt = new Date().toISOString()
  writeProfile(email, profile)
  res.json({ saved: true })
})

// GET /api/profile/posts?email= → posts array
app.get('/api/profile/posts', (req, res) => {
  const email = req.query.email
  if (!email) return res.status(400).json({ posts: [] })
  const profile = readProfile(email)
  res.json({ posts: (profile && Array.isArray(profile.posts)) ? profile.posts : [] })
})

// POST /api/profile/posts/delete → remove a post from the library
app.post('/api/profile/posts/delete', (req, res) => {
  const { email, id } = req.body || {}
  if (!email || !id) return res.status(400).json({ deleted: false })
  const profile = readProfile(email)
  if (profile && Array.isArray(profile.posts)) {
    profile.posts = profile.posts.filter(p => p.id !== id)
    profile.updatedAt = new Date().toISOString()
    writeProfile(email, profile)
  }
  res.json({ deleted: true })
})

// ══════════════════════════════════════════════════════════════════════════
// ADMIN — private dashboard
// ══════════════════════════════════════════════════════════════════════════
const ADMIN_DIR = path.join(__dirname, 'admin')
const adminSessions = new Map()            // token -> expiresAt (ms)
const ADMIN_SESSION_MS = 24 * 60 * 60 * 1000
const adminFails = new Map()               // ip -> { count, blockedUntil }
const MAX_FAILS = 5
const BLOCK_MS = 15 * 60 * 1000

function getCookie(req, name) {
  const h = req.headers.cookie || ''
  const m = h.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}
function newAdminSession() {
  const t = crypto.randomUUID()
  adminSessions.set(t, Date.now() + ADMIN_SESSION_MS)
  return t
}
function validAdminSession(req) {
  const t = getCookie(req, 'xlink_admin_session')
  if (!t) return false
  const exp = adminSessions.get(t)
  if (!exp) return false
  if (Date.now() > exp) { adminSessions.delete(t); return false }
  return true
}
function requireAdmin(req, res, next) {
  if (validAdminSession(req)) return next()
  res.status(401).json({ error: 'Unauthorized' })
}
function setSessionCookie(req, res, token, maxAge) {
  const secure = req.secure ? '; Secure' : ''
  res.setHeader('Set-Cookie', `xlink_admin_session=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`)
}

// profile aggregation helpers
function loadAllProfiles() {
  let files = []
  try { files = fs.readdirSync(PROFILES_DIR).filter(f => f.endsWith('.json')) } catch (e) {}
  const out = []
  for (const f of files) {
    try { out.push(JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, f), 'utf8'))) } catch (e) {}
  }
  return out
}
function topPlatform(posts) {
  const c = {}
  ;(posts || []).forEach(p => { if (p && p.platform) c[p.platform] = (c[p.platform] || 0) + 1 })
  let best = '', n = -1
  for (const k in c) if (c[k] > n) { n = c[k]; best = k }
  return best
}
function summarizeProfile(p) {
  const posts = Array.isArray(p.posts) ? p.posts : []
  return {
    userId:         (p.emailHash || '').slice(0, 8),
    hash:           p.emailHash || '',
    joined:         p.createdAt || '',
    lastActive:     p.updatedAt || '',
    niche:          (p.lastSettings && p.lastSettings.niche) || '',
    postsGenerated: posts.length,
    published:      posts.filter(x => x.status === 'published' || x.status === 'edited').length,
    skipped:        posts.filter(x => x.status === 'skipped').length,
    voiceProfile:   !!p.voiceProfile,
    topPlatform:    topPlatform(posts),
  }
}

// POST /api/admin/login
app.post('/api/admin/login', (req, res) => {
  const ip = req.ip || 'unknown'
  const rec = adminFails.get(ip)
  if (rec && rec.blockedUntil && rec.blockedUntil > Date.now()) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' })
  }
  const { email, password } = req.body || {}
  const AE = process.env.ADMIN_EMAIL, AP = process.env.ADMIN_PASSWORD
  if (!AE || !AP) return res.status(500).json({ error: 'Admin is not configured' })

  const ok = email && password &&
    String(email).trim().toLowerCase() === AE.trim().toLowerCase() &&
    String(password) === AP

  if (!ok) {
    const r = rec || { count: 0 }
    r.count++
    if (r.count >= MAX_FAILS) r.blockedUntil = Date.now() + BLOCK_MS
    adminFails.set(ip, r)
    return res.status(401).json({ error: 'Invalid credentials' })
  }
  adminFails.delete(ip)
  const token = newAdminSession()
  setSessionCookie(req, res, token, 86400)
  res.json({ ok: true })
})

// POST /api/admin/logout
app.post('/api/admin/logout', (req, res) => {
  const t = getCookie(req, 'xlink_admin_session')
  if (t) adminSessions.delete(t)
  setSessionCookie(req, res, '', 0)
  res.json({ ok: true })
})

// GET /api/admin/stats
app.get('/api/admin/stats', requireAdmin, (_req, res) => {
  const ps = loadAllProfiles(), now = Date.now()
  const within = (iso, ms) => { const t = Date.parse(iso); return t && (now - t) <= ms }
  const cache = readIdeasCache()
  res.json({
    totalUsers:  ps.length,
    activeToday: ps.filter(p => within(p.updatedAt, 864e5)).length,
    activeWeek:  ps.filter(p => within(p.updatedAt, 7 * 864e5)).length,
    totalPosts:  ps.reduce((s, p) => s + ((p.posts || []).length), 0),
    ideasToday:  cache && cache.ideas ? cache.ideas.length : 0,
    lastIdeasRefresh: cache ? cache.generatedAt : null,
  })
})

// GET /api/admin/users
app.get('/api/admin/users', requireAdmin, (_req, res) => {
  const users = loadAllProfiles().map(summarizeProfile)
  users.sort((a, b) => (Date.parse(b.lastActive) || 0) - (Date.parse(a.lastActive) || 0))
  res.json({ users })
})

// GET /api/admin/user?hash=
app.get('/api/admin/user', requireAdmin, (req, res) => {
  const hash = String(req.query.hash || '')
  if (!/^[a-f0-9]{64}$/.test(hash)) return res.status(400).json({ error: 'Bad hash' })
  let p = null
  try { p = JSON.parse(fs.readFileSync(path.join(PROFILES_DIR, hash + '.json'), 'utf8')) } catch (e) {}
  if (!p) return res.status(404).json({ error: 'Not found' })

  const posts = Array.isArray(p.posts) ? p.posts : []
  const published = posts.filter(x => x.status === 'published' || x.status === 'edited').length
  const skipped = posts.filter(x => x.status === 'skipped').length
  res.json({
    userId:       (p.emailHash || '').slice(0, 8),
    lastSettings: p.lastSettings || {},
    voiceProfile: p.voiceProfile || null,
    posts:        posts.slice(-10).reverse(),
    counts: { published, skipped, total: posts.length },
  })
})

// GET /api/admin/export  (CSV — table columns only, no content)
app.get('/api/admin/export', requireAdmin, (_req, res) => {
  const rows = loadAllProfiles().map(summarizeProfile)
  rows.sort((a, b) => (Date.parse(b.lastActive) || 0) - (Date.parse(a.lastActive) || 0))
  const header = ['User ID', 'Joined', 'Last Active', 'Niche', 'Posts Generated', 'Published', 'Skipped', 'Voice Profile', 'Top Platform']
  const esc = v => { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v }
  const lines = [header.join(',')]
  rows.forEach(r => lines.push([r.userId, r.joined, r.lastActive, r.niche, r.postsGenerated, r.published, r.skipped, r.voiceProfile ? 'Yes' : 'No', r.topPlatform].map(esc).join(',')))
  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', 'attachment; filename="xlink-users.csv"')
  res.send(lines.join('\n'))
})

// Admin pages (served from /admin dir, NOT public, so the gate cannot be bypassed)
app.get('/adminlogin', (_req, res) => res.sendFile(path.join(ADMIN_DIR, 'adminlogin.html')))
app.get('/admin', (req, res) => {
  if (validAdminSession(req)) return res.sendFile(path.join(ADMIN_DIR, 'admin.html'))
  res.redirect('/adminlogin')
})

// ─── Clean URLs for the extra pages ───────────────────────────────────────────
app.get('/voice',   (_req, res) => res.sendFile(path.join(__dirname, 'public', 'voice.html')))
app.get('/results', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'results.html')))

// ══════════════════════════════════════════════════════════════════════════
// DAILY IDEAS + LIVE HEADLINES
// ══════════════════════════════════════════════════════════════════════════
const DATA_DIR = path.join(__dirname, 'data')
try { fs.mkdirSync(DATA_DIR, { recursive: true }) } catch (e) {}
const DAILY_IDEAS_FILE = path.join(DATA_DIR, 'daily-ideas.json')
const DAY_MS = 24 * 60 * 60 * 1000

function readIdeasCache() {
  try { return JSON.parse(fs.readFileSync(DAILY_IDEAS_FILE, 'utf8')) } catch (e) { return null }
}
function ideasFresh(cache) {
  return cache && cache.generatedAt && (Date.now() - Date.parse(cache.generatedAt)) < DAY_MS
}

// Generic RSS fetch → [{title, source, ts, link}]
async function rssItems(url, source, limit) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'XLink/3.0' }, signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const xml = await res.text()
    const out = []
    const blocks = [...xml.matchAll(/<(?:item|entry)\b[\s\S]*?<\/(?:item|entry)>/g)]
    for (const m of blocks.slice(0, limit)) {
      const block = m[0]
      const tm = block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
      const dm = block.match(/<(?:pubDate|published|updated)>([\s\S]*?)<\//)
      const lm = block.match(/<link[^>]*href="([^"]+)"|<link>([\s\S]*?)<\/link>/)
      if (!tm) continue
      const title = tm[1].trim().replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#8217;/g, "'")
      if (!title || title.length < 8) continue
      out.push({ title, source, ts: dm ? Date.parse(dm[1]) : 0, link: lm ? (lm[1] || lm[2] || '') : '' })
    }
    return out
  } catch (e) { return [] }
}
async function redditHot(sub, limit) {
  try {
    const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=${limit}`, { headers: { 'User-Agent': 'XLink/3.0' }, signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data?.data?.children || []).filter(c => c.data && c.data.title && !c.data.stickied)
      .map(c => ({ title: c.data.title, source: 'Reddit r/' + sub, ts: (c.data.created_utc || 0) * 1000, link: 'https://reddit.com' + (c.data.permalink || '') }))
  } catch (e) { return [] }
}
async function hnTop(limit) {
  try {
    const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: AbortSignal.timeout(9000) })
    if (!res.ok) return []
    const ids = (await res.json()).slice(0, limit)
    const items = await Promise.all(ids.map(async id => {
      try { const r = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(7000) }); const d = await r.json(); return d && d.title ? { title: d.title, source: 'HackerNews', ts: (d.time || 0) * 1000, link: d.url || '' } : null } catch (e) { return null }
    }))
    return items.filter(Boolean)
  } catch (e) { return [] }
}

// Build the daily ideas (scrape → dedupe → synthesize 15 ideas)
async function generateDailyIdeas() {
  let client
  try { client = getClient() } catch (e) { console.warn('[ideas] no API key, skipping'); return null }

  const results = await Promise.allSettled([
    rssItems('https://techcrunch.com/feed/', 'TechCrunch', 10),
    rssItems('https://www.fastcompany.com/feed', 'Fast Company', 10),
    hnTop(15),
    redditHot('Entrepreneur', 10),
    redditHot('freelance', 8),
    redditHot('marketing', 8),
    redditHot('SaaS', 8),
    rssItems('https://www.producthunt.com/feed', 'Product Hunt', 8),
  ])
  let items = []
  results.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value)) items.push(...r.value) })

  // dedupe by first 40 chars
  const seen = new Set(), uniq = []
  for (const it of items) {
    const key = it.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) continue
    seen.add(key); uniq.push(it)
  }
  console.log(`[ideas] scraped ${items.length}, unique ${uniq.length}`)
  if (!uniq.length) return null

  const headlineList = uniq.slice(0, 70).map(it => `- [${it.source}] ${it.title}`).join('\n')
  const system = `You are a viral content strategist. Here are real headlines scraped from the internet today:

${headlineList}

Generate exactly 15 viral post ideas for creators, founders, freelancers, and LinkedIn/X users. Each idea must:
- Be inspired by or connected to one of the headlines above (cite the source)
- Have a clear angle that someone can post about on X or LinkedIn
- Cover a mix of these categories: Business, Marketing, Tech, Finance, Creator Economy, Health, Mindset, Productivity, Ecommerce, AI, Leadership
- Feel like a real insight or take, not generic advice

Return ONLY valid JSON, no markdown, no backticks:
{ "ideas": [ { "id": "uuid", "headline": "The viral hook, under 12 words, stops the scroll", "angle": "The specific take, 2 sentences", "why_it_works": "one sentence", "category": "one of the categories", "source_headline": "original scraped headline", "source_name": "TechCrunch | HackerNews | Reddit | Fast Company | Product Hunt", "suggested_tone": "Contrarian | Motivational | Educational | Storytelling | Provocative", "suggested_platform": "X Post | X Thread | LinkedIn" } ] }`

  try {
    const msg = await client.messages.create({ model: 'claude-sonnet-4-5', max_tokens: 4096, system, messages: [{ role: 'user', content: 'Generate the 15 ideas now.' }] })
    const cleaned = stripFences(msg.content[0].text.trim())
    const parsed = JSON.parse(cleaned)
    const ideas = (Array.isArray(parsed) ? parsed : parsed.ideas || []).map((x, i) => Object.assign({ id: 'idea_' + Date.now() + '_' + i }, x))
    const cache = { generatedAt: new Date().toISOString(), ideas }
    try { fs.writeFileSync(DAILY_IDEAS_FILE, JSON.stringify(cache)) } catch (e) {}
    console.log(`[ideas] generated ${ideas.length} ideas`)
    return cache
  } catch (e) {
    console.error('[ideas] synthesis failed:', e.message)
    return null
  }
}

let ideasGenerating = false
async function ensureDailyIdeas(force) {
  const cache = readIdeasCache()
  if (!force && ideasFresh(cache)) return cache
  if (ideasGenerating) return cache
  ideasGenerating = true
  const fresh = await generateDailyIdeas()
  ideasGenerating = false
  return fresh || cache
}

// GET /api/ideas/daily
app.get('/api/ideas/daily', async (_req, res) => {
  const cache = readIdeasCache()
  if (ideasFresh(cache)) return res.json(cache)
  const fresh = await ensureDailyIdeas(false)
  if (fresh) return res.json(fresh)
  res.json({ generatedAt: cache ? cache.generatedAt : null, ideas: cache ? cache.ideas : [], preparing: true })
})

// GET /api/headlines — live RSS for the "Live headlines" tab
app.get('/api/headlines', async (_req, res) => {
  const results = await Promise.allSettled([
    rssItems('https://techcrunch.com/feed/', 'TechCrunch', 4),
    rssItems('https://feeds.feedburner.com/morning-brew-daily-brief', 'Morning Brew', 3),
    rssItems('https://hbr.org/feed', 'HBR', 3),
    rssItems('https://www.fastcompany.com/feed', 'Fast Company', 3),
    rssItems('https://thehustle.co/feed/', 'The Hustle', 3),
    rssItems('https://www.producthunt.com/feed', 'Product Hunt', 3),
  ])
  let items = []
  results.forEach(r => { if (r.status === 'fulfilled' && Array.isArray(r.value)) items.push(...r.value) })
  const seen = new Set(), uniq = []
  for (const it of items.sort((a, b) => (b.ts || 0) - (a.ts || 0))) {
    const key = it.title.toLowerCase().slice(0, 40)
    if (seen.has(key)) continue
    seen.add(key); uniq.push(it)
  }
  res.json({ headlines: uniq.slice(0, 10) })
})

app.get('/ideas', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'ideas.html')))

// Background: keep daily ideas fresh (startup + hourly)
setTimeout(() => { ensureDailyIdeas(false).catch(() => {}) }, 3000)
setInterval(() => { ensureDailyIdeas(false).catch(() => {}) }, 60 * 60 * 1000)

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, keySet: !!process.env.ANTHROPIC_API_KEY, sheetHook: !!process.env.GOOGLE_SHEET_WEBHOOK_URL, node: process.version }))

app.listen(PORT, () => console.log(`XLink running on port ${PORT}`))
