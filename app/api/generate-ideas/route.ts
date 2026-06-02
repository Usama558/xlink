import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { niche, platform } = await req.json()

    const system = `You are a viral content strategist. Generate exactly 10 viral post ideas for the given niche and platform. Return ONLY a JSON array, no markdown, no explanation:
[{ "format": "Hot Take", "text": "full ready post text", "reason": "one sentence why this drives engagement" }]
Format types to rotate through: Hot Take, Contrarian, Story Thread Opener, Tactical How-To, Mindset Shift, Listicle Hook, Personal Confession, Insight Drop, Question Hook, Prediction.
For X: punchy, 1-4 lines, no hashtags. For LinkedIn: slightly longer, professional tone, can have line breaks.`

    const result = await callClaude(system, `Niche: ${niche}\nPlatform: ${platform}`)
    const ideas = JSON.parse(result)
    return NextResponse.json({ ideas })
  } catch {
    return NextResponse.json({ error: 'Failed to generate ideas' }, { status: 500 })
  }
}
