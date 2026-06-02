'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Sparkles, Copy, RefreshCw } from 'lucide-react'
import type { PostIdea, Platform } from '@/types'

const niches = ['SaaS', 'Marketing', 'Founders', 'Finance', 'Ecommerce', 'Fitness', 'AI & Tech', 'Creators', 'Crypto', 'Agency Owners', 'Mindset', 'Real Estate']

const formatBadgeMap: Record<string, 'blue' | 'green' | 'red' | 'gray' | 'white'> = {
  'Hot Take': 'red',
  'Contrarian': 'red',
  'Story Thread Opener': 'blue',
  'Tactical How-To': 'green',
  'Mindset Shift': 'gray',
  'Listicle Hook': 'blue',
  'Personal Confession': 'gray',
  'Insight Drop': 'green',
  'Question Hook': 'white',
  'Prediction': 'blue',
}

export default function DiscoverPage() {
  const [platform, setPlatform] = useState<Platform>('x')
  const [selectedNiche, setSelectedNiche] = useState('SaaS')
  const [customNiche, setCustomNiche] = useState('')
  const [ideas, setIdeas] = useState<PostIdea[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  const generate = async () => {
    setLoading(true)
    const niche = customNiche || selectedNiche
    const res = await fetch('/api/generate-ideas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ niche, platform }),
    })
    const data = await res.json()
    setIdeas(data.ideas || [])
    setLoading(false)
  }

  const copyText = (text: string, i: number) => {
    navigator.clipboard.writeText(text)
    setCopied(i)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Discover</h1>
        <p className="text-sm text-white/40">Generate viral post ideas tailored to your niche.</p>
      </div>

      <div className="card-x card-gloss p-6 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
          <h3 className="text-sm font-semibold text-white">Select your niche</h3>
          <Toggle
            options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
            value={platform}
            onChange={(v) => setPlatform(v as Platform)}
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {niches.map(n => (
            <button
              key={n}
              onClick={() => { setSelectedNiche(n); setCustomNiche('') }}
              className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                selectedNiche === n && !customNiche
                  ? 'bg-accent border-accent text-white'
                  : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <input
            value={customNiche}
            onChange={e => setCustomNiche(e.target.value)}
            placeholder="Or type your own niche..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-accent"
          />
          <Button onClick={generate} disabled={loading}>
            <Sparkles size={16} />
            {loading ? 'Generating...' : 'Generate Ideas'}
          </Button>
        </div>
      </div>

      {ideas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-white/40">{ideas.length} ideas generated for <span className="text-white">{customNiche || selectedNiche}</span></p>
            <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
              <RefreshCw size={14} />
              Regenerate
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {ideas.map((idea, i) => (
              <div key={i} className={`p-5 rounded-3xl relative ${platform === 'linkedin' ? 'card-blue' : 'card-x card-gloss'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <Badge variant={formatBadgeMap[idea.format] || 'gray'}>{idea.format}</Badge>
                  <button
                    onClick={() => copyText(idea.text, i)}
                    className="text-white/30 hover:text-white transition-colors p-1"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <p className="text-sm text-white/80 leading-relaxed mb-4 whitespace-pre-wrap">{idea.text}</p>
                <p className="text-xs text-white/30 border-t border-white/5 pt-3">{idea.reason}</p>
                {copied === i && (
                  <div className="absolute bottom-4 right-4 text-xs text-green-400">Copied!</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {ideas.length === 0 && !loading && (
        <div className="text-center py-20 text-white/20">
          <Sparkles size={40} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">Select a niche and generate ideas to get started.</p>
        </div>
      )}
    </div>
  )
}
