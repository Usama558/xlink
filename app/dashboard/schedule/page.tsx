'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { Plus, Edit2, Trash2, Calendar } from 'lucide-react'
import { Textarea } from '@/components/ui/Input'
import { format, startOfWeek, addDays } from 'date-fns'
import type { Platform } from '@/types'

const seedPosts = [
  { id: '1', platform: 'x' as Platform, content: 'The best founders I know all share one trait: they ship before they\'re ready.', scheduled_at: new Date(Date.now() + 3600000 * 3).toISOString(), status: 'scheduled' },
  { id: '2', platform: 'linkedin' as Platform, content: '5 LinkedIn strategies that doubled our inbound pipeline in 60 days. Here\'s the full breakdown:', scheduled_at: new Date(Date.now() + 3600000 * 6).toISOString(), status: 'scheduled' },
  { id: '3', platform: 'x' as Platform, content: 'Hot take: your content strategy is wrong if engagement is your primary metric.', scheduled_at: new Date(Date.now() + 3600000 * 24).toISOString(), status: 'scheduled' },
  { id: '4', platform: 'linkedin' as Platform, content: 'What separates $1M ARR founders from $10M ARR founders? One counterintuitive answer.', scheduled_at: new Date(Date.now() + 3600000 * 30).toISOString(), status: 'scheduled' },
]

function WeekCalendar({ posts }: { posts: typeof seedPosts }) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  return (
    <div className="card-x card-gloss p-6 mb-6">
      <h3 className="text-sm font-semibold text-white mb-5">This Week</h3>
      <div className="grid grid-cols-7 gap-2">
        {days.map(day => {
          const dayPosts = posts.filter(p => {
            const d = new Date(p.scheduled_at)
            return d.toDateString() === day.toDateString()
          })
          const isToday = day.toDateString() === today.toDateString()
          return (
            <div key={day.toISOString()} className={`rounded-2xl p-3 border ${isToday ? 'border-accent/40 bg-accent/5' : 'border-white/5 bg-white/2'}`}>
              <div className={`text-xs font-medium mb-1 ${isToday ? 'text-accent-light' : 'text-white/30'}`}>
                {format(day, 'EEE')}
              </div>
              <div className={`text-lg font-black mb-2 ${isToday ? 'text-white' : 'text-white/40'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayPosts.map(p => (
                  <div key={p.id} className={`h-1.5 rounded-full ${p.platform === 'x' ? 'bg-white/40' : 'bg-blue-500/70'}`} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function SchedulePage() {
  const [posts, setPosts] = useState(seedPosts)
  const [modalOpen, setModalOpen] = useState(false)
  const [newPost, setNewPost] = useState({ platform: 'x' as Platform, content: '', scheduled_at: '' })

  const deletePost = (id: string) => setPosts(prev => prev.filter(p => p.id !== id))

  const addPost = () => {
    if (!newPost.content.trim() || !newPost.scheduled_at) return
    setPosts(prev => [...prev, { id: Date.now().toString(), ...newPost, status: 'scheduled' }])
    setNewPost({ platform: 'x', content: '', scheduled_at: '' })
    setModalOpen(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Schedule</h1>
          <p className="text-sm text-white/40">Plan and manage your content calendar.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          New Post
        </Button>
      </div>

      <WeekCalendar posts={posts} />

      <div className="card-x card-gloss p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Scheduled Posts</h3>
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="flex items-start gap-4 p-4 bg-white/3 border border-white/5 rounded-2xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${post.platform === 'x' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                {post.platform === 'x' ? 'X' : 'in'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 mb-1 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">
                    <Calendar size={10} className="inline mr-1" />
                    {format(new Date(post.scheduled_at), 'MMM d, h:mm a')}
                  </span>
                  <Badge variant="gray">{post.status}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button className="p-2 text-white/30 hover:text-white transition-colors rounded-lg hover:bg-white/5">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deletePost(post.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/5">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Schedule New Post">
        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/70 font-medium block mb-2">Platform</label>
            <Toggle
              options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
              value={newPost.platform}
              onChange={(v) => setNewPost(p => ({ ...p, platform: v as Platform }))}
            />
          </div>
          <Textarea
            label="Post content"
            placeholder="Write your post..."
            value={newPost.content}
            onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
            rows={6}
          />
          <div>
            <label className="text-sm text-white/70 font-medium block mb-1.5">Schedule date & time</label>
            <input
              type="datetime-local"
              value={newPost.scheduled_at}
              onChange={e => setNewPost(p => ({ ...p, scheduled_at: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={addPost} className="flex-1">Schedule Post</Button>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
