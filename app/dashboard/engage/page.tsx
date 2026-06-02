'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Wand2, Send, X } from 'lucide-react'
import type { Platform } from '@/types'

const opportunities = {
  x: [
    { id: '1', avatar: 'L', name: 'Lenny Rachitsky', handle: '@lennysan', snippet: 'What\'s the single most impactful thing you\'ve done to improve your product\'s retention?', likes: 2840 },
    { id: '2', avatar: 'J', name: 'Jason Lemkin', handle: '@jasonlk', snippet: 'Why does almost every SaaS company plateau at $1M ARR? Hot take inside.', likes: 1920 },
    { id: '3', avatar: 'A', name: 'Arvid Kahl', handle: '@arvidkahl', snippet: 'Building in public is not about transparency. It\'s about accountability. Here\'s the difference:', likes: 984 },
    { id: '4', avatar: 'S', name: 'Sahil Lavingia', handle: '@shl', snippet: 'The fastest path to PMF is 100 customer conversations before a single line of code.', likes: 3201 },
  ],
  linkedin: [
    { id: '5', avatar: 'M', name: 'Matt Bragstad', handle: 'VP Growth at Scale', snippet: 'I tested 47 LinkedIn content formats in 6 months. Here\'s what actually generates pipeline:', likes: 1850 },
    { id: '6', avatar: 'N', name: 'Nicole Osborne', handle: 'B2B Social Strategist', snippet: 'Your LinkedIn profile is a landing page, not a resume. Here\'s how to treat it that way:', likes: 2410 },
    { id: '7', avatar: 'R', name: 'Ross Simmonds', handle: 'Founder at Foundation', snippet: 'Distribution > Content. Every single time. But almost nobody builds it first.', likes: 1340 },
  ],
}

export default function EngagePage() {
  const [platform, setPlatform] = useState<Platform>('x')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [activeId, setActiveId] = useState<string | null>(null)

  const items = opportunities[platform]

  const generateReply = async (id: string, snippet: string) => {
    setLoading(prev => ({ ...prev, [id]: true }))
    setActiveId(id)
    const res = await fetch('/api/generate-reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original_post: snippet, platform }),
    })
    const data = await res.json()
    setReplies(prev => ({ ...prev, [id]: data.reply || '' }))
    setLoading(prev => ({ ...prev, [id]: false }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Engage</h1>
          <p className="text-sm text-white/40">Thoughtful replies to trending posts in your niche.</p>
        </div>
        <Toggle
          options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
          value={platform}
          onChange={(v) => { setPlatform(v as Platform); setActiveId(null) }}
        />
      </div>

      <div className="space-y-4">
        {items.map(item => (
          <div key={item.id} className={`rounded-3xl p-5 ${platform === 'linkedin' ? 'card-blue' : 'card-x card-gloss'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${platform === 'linkedin' ? 'bg-blue-600/30 border border-blue-500/30 text-blue-300' : 'bg-white/10 border border-white/10 text-white'}`}>
                {item.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <span className="text-sm text-white/30 ml-2">{item.handle}</span>
                  </div>
                  <span className="text-xs text-white/30">{item.likes.toLocaleString()} likes</span>
                </div>
                <p className="text-sm text-white/60 mt-1.5 leading-relaxed">{item.snippet}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => generateReply(item.id, item.snippet)}
                    disabled={loading[item.id]}
                  >
                    <Wand2 size={13} />
                    {loading[item.id] ? 'Writing...' : 'Reply with AI'}
                  </Button>
                  {activeId === item.id && replies[item.id] && (
                    <button onClick={() => { setActiveId(null); setReplies(p => ({ ...p, [item.id]: '' })) }} className="p-1.5 text-white/30 hover:text-white transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {activeId === item.id && replies[item.id] && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <textarea
                  value={replies[item.id]}
                  onChange={e => setReplies(prev => ({ ...prev, [item.id]: e.target.value }))}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-accent resize-none mb-3"
                />
                <div className="flex gap-2">
                  <Button size="sm">
                    <Send size={13} />
                    Send Reply
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>Discard</Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
