'use client'
import { useState } from 'react'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Activity, Send } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

const weeklyData = [
  { day: 'Mon', impressions: 12400 },
  { day: 'Tue', impressions: 18200 },
  { day: 'Wed', impressions: 15800 },
  { day: 'Thu', impressions: 24100 },
  { day: 'Fri', impressions: 19300 },
  { day: 'Sat', impressions: 28900 },
  { day: 'Sun', impressions: 21400 },
]

const recentPosts = [
  { platform: 'X', text: 'The best founders I know all share one trait: they ship before they\'re ready.', time: 'Today 9:00 AM', impressions: 4200, status: 'published' },
  { platform: 'LinkedIn', text: '5 LinkedIn strategies that doubled our inbound pipeline in 60 days.', time: 'Today 12:30 PM', impressions: 8100, status: 'published' },
  { platform: 'X', text: 'Hot take: your content strategy is wrong if engagement is your primary metric.', time: 'Tomorrow 8:00 AM', impressions: 0, status: 'scheduled' },
  { platform: 'LinkedIn', text: 'What separates $1M ARR founders from $10M ARR founders? One counterintuitive answer.', time: 'Tomorrow 10:00 AM', impressions: 0, status: 'scheduled' },
]

const stats = [
  { label: 'Impressions', value: 284100, change: '+18%', icon: TrendingUp, positive: true },
  { label: 'New Followers', value: 1420, change: '+24%', icon: Users, positive: true },
  { label: 'Engagement Rate', value: '4.7%', change: '+0.8%', icon: Activity, positive: true },
  { label: 'Posts Sent', value: 38, change: '+5', icon: Send, positive: true },
]

export default function DashboardPage() {
  const [platform, setPlatform] = useState('x')

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-1">Your growth overview for this week.</p>
        </div>
        <Toggle
          options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
          value={platform}
          onChange={setPlatform}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, change, icon: Icon, positive }) => (
          <div key={label} className="card-x card-gloss p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40 font-medium">{label}</span>
              <Icon size={16} className="text-white/20" />
            </div>
            <div className="text-2xl font-black text-white mb-1">
              {typeof value === 'number' && value > 999 ? formatNumber(value) : value}
            </div>
            <Badge variant={positive ? 'green' : 'red'}>{change} this week</Badge>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card-x card-gloss p-6 mb-8">
        <h3 className="text-sm font-semibold text-white mb-6">Weekly Reach</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData} barSize={32}>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }}
              formatter={(v: number) => [formatNumber(v), 'Impressions']}
            />
            <Bar dataKey="impressions" fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent posts */}
      <div className="card-x card-gloss p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Recent Posts</h3>
        <div className="space-y-3">
          {recentPosts.map((post, i) => (
            <div key={i} className="flex items-start gap-4 p-4 bg-white/3 border border-white/5 rounded-2xl">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${post.platform === 'X' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                {post.platform === 'X' ? 'X' : 'in'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white/70 mb-1 truncate">{post.text}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/30">{post.time}</span>
                  {post.impressions > 0 && <span className="text-xs text-white/30">{formatNumber(post.impressions)} impressions</span>}
                </div>
              </div>
              <Badge variant={post.status === 'published' ? 'green' : 'gray'}>{post.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
