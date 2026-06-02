import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { original_post, platform } = await req.json()

    const system = `You are a smart engagement strategist. Write a short, thoughtful reply to the given post that adds genuine value, shows expertise, and is likely to get likes and spark conversation.
For X: 1-2 sentences max, punchy.
For LinkedIn: 2-4 sentences, professional, adds a unique perspective.
Return ONLY the reply text, no explanation.`

    const reply = await callClaude(system, `Original post: ${original_post}\nPlatform: ${platform}`)
    return NextResponse.json({ reply: reply.trim() })
  } catch {
    return NextResponse.json({ error: 'Failed to generate reply' }, { status: 500 })
  }
}
