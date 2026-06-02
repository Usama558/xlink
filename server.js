const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

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

function getSubreddits(niche) {
  const key = Object.keys(SUBREDDIT_MAP).find(k => k.toLowerCase() === niche.toLowerCase())
  return key ? SUBREDDIT_MAP[key] : ['Entrepreneur', 'smallbusiness']
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
function buildPrompt(filters, trends) {
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

  return {
    system: `You are a world-class social media ghostwriter. You write posts that spread.

${platformInstructions[filters.platform] || platformInstructions['x-post']}
${outputInstruction}

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

VIRAL FRAMEWORK — hit all 6 in every post:
1. STIMULATED: first line triggers curiosity or emotion. No warm-up.
2. CAPTIVATED: middle builds tension or contrast. Never lose momentum.
3. ANTICIPATION: signal early that something the reader needs is coming.
4. VALIDATION: make the reader feel seen. Confirm a belief they hold but rarely hear out loud.
5. AFFECTION: be human, be specific. Show a real person wrote this.
6. REVELATION: close with an insight that feels surprising then immediately obvious.

WRITING RULES — no exceptions:
- No contractions: no I've, I'd, I'll, I'm, we've, they've, you've, it's, that's, don't, won't, can't, isn't, wasn't, didn't, couldn't
- No em dashes or double hyphens
- No filler: ban "in today's world", "it is important to note", "as we know", "the truth is", "let me be clear", "at the end of the day", "game changer", "leverage"
- Short sentences. One idea per line. White space is structure.
- Direct operator voice. No hedging. No softening. No corporate speak.

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

    user: `Niche: ${filters.niche}
Platform: ${filters.platform}
Generate exactly ${filters.count} post(s).

Base each post on one of these trending topics:
${trendBlock}

Distribute across different topics and formats. Do not reuse the same topic for multiple posts if avoidable.`,
  }
}

// ─── POST /api/generate ───────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { filters, trends } = req.body

  if (!filters || !trends?.length) {
    return res.status(400).json({ error: 'Missing filters or trends' })
  }

  let client
  try { client = getClient() }
  catch (e) { return res.status(500).json({ error: e.message }) }

  const { system, user } = buildPrompt(filters, trends)
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

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, keySet: !!process.env.ANTHROPIC_API_KEY, node: process.version }))

app.listen(PORT, () => console.log(`XLink running on port ${PORT}`))
