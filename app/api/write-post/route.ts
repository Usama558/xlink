import { NextRequest, NextResponse } from 'next/server'
import { callClaude } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  try {
    const { topic, platform, tone } = await req.json()

    const system = `You are an expert social media ghostwriter. Write a single high-performing post for the given topic, platform, and tone. Return ONLY the post text, no explanation, no quotes around it.
For X: max 280 characters, punchy, no hashtags.
For LinkedIn: 150-300 words, professional, can use line breaks, no hashtags.
Tone guide — Casual: conversational, direct. Professional: authoritative, data-driven. Contrarian: challenge common beliefs. Inspirational: motivate action.`

    const post = await callClaude(system, `Topic: ${topic}\nPlatform: ${platform}\nTone: ${tone}`)
    return NextResponse.json({ post: post.trim(), character_count: post.trim().length })
  } catch {
    return NextResponse.json({ error: 'Failed to write post' }, { status: 500 })
  }
}
