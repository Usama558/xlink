'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight, TrendingUp, BarChart2, Clock } from 'lucide-react'

function DashboardMockup() {
  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="card-x card-gloss p-4 shadow-2xl" style={{ borderRadius: 28 }}>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Impressions', value: '284K', change: '+18%', icon: TrendingUp },
            { label: 'New Followers', value: '1,420', change: '+24%', icon: BarChart2 },
            { label: 'Posts Sent', value: '38', change: '+5%', icon: Clock },
          ].map(({ label, value, change, icon: Icon }) => (
            <div key={label} className="bg-white/3 border border-white/5 rounded-2xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{label}</span>
                <Icon size={12} className="text-white/20" />
              </div>
              <div className="text-lg font-bold text-white">{value}</div>
              <div className="text-xs text-green-400 mt-0.5">{change} this week</div>
            </div>
          ))}
        </div>

        {/* Bar chart mock */}
        <div className="bg-white/3 border border-white/5 rounded-2xl p-4 mb-3">
          <div className="text-xs text-white/40 mb-3">Weekly Reach</div>
          <div className="flex items-end gap-1.5 h-16">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm transition-all" style={{
                height: `${h}%`,
                background: i === 5 ? '#2563eb' : 'rgba(37,99,235,0.25)'
              }} />
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <span key={d} className="text-xs text-white/20">{d}</span>
            ))}
          </div>
        </div>

        {/* Scheduled posts */}
        <div className="space-y-2">
          {[
            { platform: 'X', text: 'The best founders I know all share one trait: they ship before they\'re ready.', time: 'Today 9:00 AM' },
            { platform: 'LI', text: '5 LinkedIn strategies that doubled our inbound pipeline in 60 days.', time: 'Today 12:30 PM' },
            { platform: 'X', text: 'Hot take: your content strategy is wrong if engagement is your primary metric.', time: 'Tomorrow 8:00 AM' },
          ].map((post, i) => (
            <div key={i} className="flex items-start gap-3 bg-white/3 border border-white/5 rounded-xl p-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${post.platform === 'X' ? 'bg-white text-black' : 'bg-blue-600 text-white'}`}>
                {post.platform}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-white/70 truncate">{post.text}</p>
                <p className="text-xs text-white/30 mt-0.5">{post.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-20" style={{ background: 'radial-gradient(ellipse, #2563eb 0%, transparent 70%)' }} />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6 text-sm text-white/60">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
            New: LinkedIn AI Post Generator is live
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-6 tracking-tight">
            Grow and monetize your{' '}
            <span style={{ background: 'linear-gradient(135deg, #2563eb, #60a5fa, #93c5fd)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              audience, faster
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10">
            The all-in-one platform for X and LinkedIn creators. Discover viral content, write with AI, schedule smarter, and grow your following consistently.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-12">
            <Link href="/signup">
              <Button size="lg">
                Get Started Free
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button size="lg" variant="secondary">See how it works</Button>
            </Link>
          </div>

          {/* Social proof */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            {[
              { value: '9,000+', label: 'creators' },
              { value: '400K+', label: 'posts generated' },
              { value: '5B+', label: 'impressions driven' },
            ].map(({ value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="font-bold text-white">{value}</span>
                <span className="text-white/40">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
