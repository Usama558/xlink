const express = require('express')
const Anthropic = require('@anthropic-ai/sdk')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Viral framework system prompt ───────────────────────────────────────────
function buildSystemPrompt(platform, outputType) {
  const platformRules =
    platform === 'x'
      ? 'Platform: X (Twitter). Max 280 characters per post. Punchy. Zero hashtags. One post = one idea.'
      : 'Platform: LinkedIn. 150 to 300 words per post. Professional authority voice. Line breaks between ideas. Zero hashtags.'

  const outputRules =
    outputType === 'hook'
      ? 'OUTPUT TYPE: Hook only. Return just the opening line — the single sentence that stops the scroll. No body. No continuation.'
      : 'OUTPUT TYPE: Full post. Return the complete post from opening line to closing insight.'

  return `You are a world-class social media ghostwriter. You write posts that spread because they make people feel something.

${platformRules}
${outputRules}

VIRAL FRAMEWORK — every post must deliver all 6 in sequence:
1. STIMULATED — the first line triggers curiosity or a strong emotion. No warm-up. Hit immediately.
2. CAPTIVATED — the middle builds tension or contrast that keeps the reader moving. Never let momentum drop.
3. ANTICIPATION — plant a signal early that something the reader needs to know is coming.
4. VALIDATION — make the reader feel seen. Confirm a belief they hold but rarely hear said out loud.
5. AFFECTION — be human. Be specific. Show a real person wrote this, not a content machine.
6. REVELATION — close with an insight that feels surprising at first and completely obvious a second later.

WRITING RULES — enforce without exception:
- Never use contractions: no I've, I'd, I'll, I'm, we've, they've, you've, it's, that's, don't, won't, can't, isn't, wasn't
- Never use em dashes or double hyphens
- No filler: ban "in today's world", "it is important to note", "as we know", "the truth is", "let me be clear", "at the end of the day"
- Short sentences. One idea per line. White space is structure.
- Direct operator voice. No hedging. No softening.
- Write as if every word costs money. Cut everything that does not earn its place.

OUTPUT FORMAT:
Return ONLY a valid JSON array. No markdown fences. No explanation. No extra text.
Each element: { "format": "format type", "text": "the post text", "reason": "one sentence on why this drives engagement" }

Format types to rotate through: Hot Take, Contrarian, Story, Tactical, Mindset Shift, Listicle Hook, Personal Confession, Insight Drop, Question Hook, Prediction, Case Study, Pattern Interrupt`
}

// ─── Generate route ───────────────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  const { niche, platform, count, outputType } = req.body

  if (!niche || !platform || !count || !outputType) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set on the server.' })
  }

  const systemPrompt = buildSystemPrompt(platform, outputType)
  const userMessage = `Niche: ${niche}
Platform: ${platform}
Generate exactly ${count} post(s).`

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].text.trim()
    const posts = JSON.parse(raw)
    res.json({ posts })
  } catch (err) {
    console.error('Generation error:', err)
    res.status(500).json({ error: 'Failed to generate posts. Check server logs.' })
  }
})

app.listen(PORT, () => {
  console.log(`XLink running on http://localhost:${PORT}`)
})
