'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Wand2, Copy, Calendar, RefreshCw } from 'lucide-react'
import type { Platform, Tone } from '@/types'

const tones: { label: string; value: Tone }[] = [
  { label: 'Casual', value: 'casual' },
  { label: 'Professional', value: 'professional' },
  { label: 'Contrarian', value: 'contrarian' },
  { label: 'Inspirational', value: 'inspirational' },
]

const savedDrafts = [
  { platform: 'X', text: 'Most people optimize for the wrong metric. Here\'s what actually matters...', format: 'Hook', created: '2 hours ago' },
  { platform: 'LinkedIn', text: 'I spent 3 years building the wrong product. Here\'s what I learned about talking to customers before writing code.', format: 'Story', created: 'Yesterday' },
  { platform: 'X', text: 'The founder who raises the most money rarely builds the best company.', format: 'Hot Take', created: '2 days ago' },
]

export default function CreatePage() {
  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<Platform>('x')
  const [tone, setTone] = useState<Tone>('casual')
  const [generatedPost, setGeneratedPost] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  const charLimit = platform === 'x' ? 280 : 3000

  const generate = async () => {
    if (!topic.trim()) return
    setLoading(true)
    const res = await fetch('/api/write-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, platform, tone }),
    })
    const data = await res.json()
    setGeneratedPost(data.post || '')
    setLoading(false)
  }

  const copy = () => {
    navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-1">Create</h1>
        <p className="text-sm text-white/40">Write high-quality posts with AI in seconds.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="card-x card-gloss p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Write a post</h3>

            <div className="space-y-4">
              <Textarea
                label="Topic or prompt"
                placeholder="e.g. Why most SaaS founders fail in year two..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                rows={4}
              />

              <div>
                <label className="text-sm text-white/70 font-medium block mb-2">Platform</label>
                <Toggle
                  options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
                  value={platform}
                  onChange={(v) => setPlatform(v as Platform)}
                />
              </div>

              <div>
                <label className="text-sm text-white/70 font-medium block mb-2">Tone</label>
                <div className="flex flex-wrap gap-2">
                  {tones.map(t => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all border ${
                        tone === t.value
                          ? 'bg-accent border-accent text-white'
                          : 'border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={generate} disabled={loading || !topic.trim()} className="w-full">
                <Wand2 size={16} />
                {loading ? 'Writing...' : 'Write Post'}
              </Button>
            </div>
          </div>

          {/* Saved drafts */}
          <div className="card-x card-gloss p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Saved Drafts</h3>
            <div className="space-y-3">
              {savedDrafts.map((draft, i) => (
                <div key={i} className="p-3 bg-white/3 border border-white/5 rounded-xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${draft.platform === 'X' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                      {draft.platform === 'X' ? 'X' : 'in'}
                    </div>
                    <Badge variant="gray">{draft.format}</Badge>
                    <span className="text-xs text-white/20 ml-auto">{draft.created}</span>
                  </div>
                  <p className="text-xs text-white/50 truncate">{draft.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="card-x card-gloss p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Generated Post</h3>
            {generatedPost && (
              <span className={`text-xs ${generatedPost.length > charLimit ? 'text-red-400' : 'text-white/30'}`}>
                {generatedPost.length} / {charLimit}
              </span>
            )}
          </div>

          {generatedPost ? (
            <div>
              <Textarea
                value={generatedPost}
                onChange={e => setGeneratedPost(e.target.value)}
                rows={12}
                className="mb-4"
              />
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" onClick={copy}>
                  <Copy size={14} />
                  {copied ? 'Copied!' : 'Copy'}
                </Button>
                <Button variant="secondary" size="sm">
                  <Calendar size={14} />
                  Schedule
                </Button>
                <Button variant="ghost" size="sm" onClick={generate} disabled={loading}>
                  <RefreshCw size={14} />
                  Regenerate
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Wand2 size={36} className="text-white/10 mb-3" />
              <p className="text-sm text-white/20">Your generated post will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
