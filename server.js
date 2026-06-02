const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000

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

  const trendBlock = trends
    .map((t, i) => `${i + 1}. [${t.source}] ${t.title}${t.score ? ` (${t.score} upvotes)` : ''}`)
    .join('\n')

  const topic = (filters.topic && filters.topic.trim()) || filters.niche

  const refBlock = filters.referencePosts && filters.referencePosts.trim()
    ? `\nREFERENCE POSTS — the user pasted these as style targets. Study their sentence length, paragraph structure, hook style, line breaks, and overall rhythm. Mirror that exact structure and energy in your output, while keeping the content fully original and on the topic. Do not copy their words, names, or specifics:
"""
${filters.referencePosts.trim().slice(0, 4000)}
"""
`
    : ''

  return {
    system: `You are a world-class social media ghostwriter. You write posts that spread.

${platformInstructions[filters.platform] || platformInstructions['x-post']}
${outputInstruction}

CENTRAL TOPIC — every post must be about this. The trending items are only angles, hooks, and supporting material. Never drift off this topic:
"${topic}"

FILTERS TO APPLY:
- Tone: ${filters.tone}
- POV: ${filters.pov}
- Hook type: ${filters.hookType}
- Post goal: ${filters.postGoal}
- Target audience: ${filters.targetAudience}
- CTA: ${filters.cta}
- Writing style: ${filters.writingStyle}
${filters.contrarianBelief ? `- Contrarian belief to embed: "${filters.contrarianBelief}"` : ''}
${filters.personalResult ? `- Personal result to include: "${filters.personalResult}"` : ''}
${refBlock}
VIRAL FRAMEWORK — hit all 6 in every post:
1. STIMULATED: first line triggers curiosity or emotion. No warm-up.
2. CAPTIVATED: middle builds tension or contrast. Never lose momentum.
3. ANTICIPATION: signal early that something the reader needs is coming.
4. VALIDATION: make the reader feel seen. Confirm a belief they hold but rarely hear out loud.
5. AFFECTION: be human, be specific. Show a real person wrote this.
6. REVELATION: close with an insight that feels surprising then immediately obvious.

${GLOBAL_WRITING_RULES}${voiceLine(voiceProfile)}

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown fences. No extra text before or after.
Each element must have exactly these keys:
{
  "format": "one of: Hot Take / Contrarian / Story / Tactical / Mindset Shift / Listicle Hook / Personal Confession / Insight Drop / Question Hook / Prediction",
  "text": "the complete post text, ready to publish",
  "source_title": "the exact trending topic title this post is based on",
  "frameworks": ["array of framework names this post hits from: STIMULATED CAPTIVATED ANTICIPATION VALIDATION AFFECTION REVELATION"],
  "reason": "one sentence on why this specific angle drives engagement"
}`,

    user: `Write about this topic: "${topic}"
Niche context: ${filters.niche}
Platform: ${filters.platform}
Generate exactly ${filters.count} post(s).

Use these trending items as fresh angles, hooks, or supporting context. Tie each one back to the topic above:
${trendBlock}

Spread the posts across different angles and formats. Every post must clearly be about the topic, not just the trending item.`,
  }
}

// ─── POST /api/generate ───────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { filters, trends, voiceProfile } = req.body

  if (!filters || !trends?.length) {
    return res.status(400).json({ error: 'Missing filters or trends' })
  }

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const { system, user } = buildPrompt(filters, trends, voiceProfile)
  console.log(`[generate] niche="${filters.niche}" platform=${filters.platform} count=${filters.count} trends=${trends.length}`)

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

// ─── Clean URLs for the extra pages ───────────────────────────────────────────
app.get('/voice',   (_req, res) => res.sendFile(path.join(__dirname, 'public', 'voice.html')))
app.get('/results', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'results.html')))

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, keySet: !!process.env.ANTHROPIC_API_KEY, sheetHook: !!process.env.GOOGLE_SHEET_WEBHOOK_URL, node: process.version }))

app.listen(PORT, () => console.log(`XLink running on port ${PORT}`))
