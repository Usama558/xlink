'use client'
import { useState } from 'react'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, Activity, Send } from 'lucide-react'
import { formatNumber } from '@/lib/utils'

const followerData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  followers: 4200 + Math.floor(Math.random() * 80 + i * 28),
}))

const topPosts = [
  { text: 'The best founders I know all share one trait: they ship before they\'re ready.', impressions: 48200, likes: 2840, replies: 312, rate: '5.9%' },
  { text: 'Hot take: your content strategy is wrong if engagement is your primary metric.', impressions: 36100, likes: 1920, replies: 248, rate: '5.3%' },
  { text: 'Most SaaS companies plateau at $1M ARR for one reason. It\'s not what you think.', impressions: 29800, likes: 1540, replies: 189, rate: '5.1%' },
  { text: '5 LinkedIn strategies that doubled our inbound pipeline in 60 days.', impressions: 24500, likes: 1280, replies: 156, rate: '4.8%' },
  { text: 'I spent 6 months building the wrong product. Here\'s what I learned:', impressions: 19200, likes: 980, replies: 134, rate: '4.4%' },
]

const impressionData = topPosts.map((p, i) => ({
  name: `Post ${i + 1}`,
  impressions: p.impressions,
}))

export default function AnalyticsPage() {
  const [platform, setPlatform] = useState('x')

  const stats = [
    { label: 'Total Impressions', value: 284100, change: '+18%', icon: TrendingUp, positive: true },
    { label: 'Followers Gained', value: 1420, change: '+24%', icon: Users, positive: true },
    { label: 'Engagement Rate', value: '4.7%', change: '+0.8%', icon: Activity, positive: true },
    { label: 'Posts Published', value: 38, change: '+5', icon: Send, positive: true },
  ]

  const tooltipStyle = { background: '#13131a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-white mb-1">Analytics</h1>
          <p className="text-sm text-white/40">Track your growth and content performance.</p>
        </div>
        <Toggle
          options={[{ label: 'X', value: 'x' }, { label: 'LinkedIn', value: 'linkedin' }]}
          value={platform}
          onChange={setPlatform}
        />
      </div>

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
            <Badge variant={positive ? 'green' : 'red'}>{change} this month</Badge>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card-x card-gloss p-6">
          <h3 className="text-sm font-semibold text-white mb-6">Follower Growth (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={followerData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} interval={6} />
              <YAxis hide domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNumber(v), 'Followers']} />
              <Line type="monotone" dataKey="followers" stroke="#2563eb" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card-x card-gloss p-6">
          <h3 className="text-sm font-semibold text-white mb-6">Impressions per Post</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={impressionData} barSize={28}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [formatNumber(v), 'Impressions']} />
              <Bar dataKey="impressions" fill="#2563eb" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card-x card-gloss p-6">
        <h3 className="text-sm font-semibold text-white mb-5">Top Posts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-xs text-white/30 font-medium pb-3 pr-4">Post</th>
                <th className="text-right text-xs text-white/30 font-medium pb-3 px-4">Impressions</th>
                <th className="text-right text-xs text-white/30 font-medium pb-3 px-4">Likes</th>
                <th className="text-right text-xs text-white/30 font-medium pb-3 px-4">Replies</th>
                <th className="text-right text-xs text-white/30 font-medium pb-3">Eng. Rate</th>
              </tr>
            </thead>
            <tbody>
              {topPosts.map((post, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0">
                  <td className="py-3 pr-4 max-w-xs">
                    <p className="text-white/60 truncate text-xs">{post.text}</p>
                  </td>
                  <td className="py-3 px-4 text-right text-white/50 tabular-nums">{formatNumber(post.impressions)}</td>
                  <td className="py-3 px-4 text-right text-white/50 tabular-nums">{formatNumber(post.likes)}</td>
                  <td className="py-3 px-4 text-right text-white/50 tabular-nums">{post.replies}</td>
                  <td className="py-3 text-right">
                    <Badge variant="green">{post.rate}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
