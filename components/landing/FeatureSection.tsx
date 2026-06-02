import { Badge } from '@/components/ui/Badge'

function XViralFeedMock() {
  const posts = [
    { handle: '@levelsio', text: 'Building in public is the best marketing strategy ever invented. Transparency converts.', likes: '4.2K', reposts: '891' },
    { handle: '@naval', text: 'Specific knowledge is knowledge that you cannot be trained for. It comes through your authentic obsessions.', likes: '8.7K', reposts: '2.1K' },
    { handle: '@shl', text: 'The fastest path to PMF is talking to 100 customers before writing a line of code.', likes: '3.1K', reposts: '604' },
  ]
  return (
    <div className="space-y-3">
      {posts.map((p, i) => (
        <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <div className="text-sm font-semibold text-white mb-1.5">{p.handle}</div>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{p.text}</p>
          <div className="flex items-center gap-4 text-xs text-white/30">
            <span>{p.likes} likes</span>
            <span>{p.reposts} reposts</span>
            <button className="ml-auto text-xs bg-accent/20 text-accent-light border border-accent/20 rounded-lg px-3 py-1 hover:bg-accent/30 transition-colors">Use Template</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function AIGeneratorMock() {
  return (
    <div className="space-y-3">
      <div className="bg-white/5 border border-white/8 rounded-xl p-3">
        <div className="text-xs text-white/30 mb-1">Topic</div>
        <div className="text-sm text-white">Why most SaaS founders fail in year two</div>
      </div>
      <div className="bg-white/5 border border-white/8 rounded-xl p-3">
        <div className="text-xs text-white/30 mb-2">Format</div>
        <div className="flex gap-2">
          {['Hot Take', 'Contrarian', 'Story'].map((f, i) => (
            <span key={f} className={`text-xs px-2.5 py-1 rounded-lg border ${i === 0 ? 'bg-accent/20 border-accent/30 text-accent-light' : 'bg-white/5 border-white/10 text-white/40'}`}>{f}</span>
          ))}
        </div>
      </div>
      <div className="bg-white/5 border border-accent/20 rounded-xl p-4">
        <div className="text-xs text-accent-light mb-2">Generated Post</div>
        <p className="text-sm text-white/80 leading-relaxed">
          Most SaaS founders die in year two. Not from competition. From success. You hit $1M ARR, hire a team, add process — and accidentally kill the scrappiness that got you there.
        </p>
      </div>
    </div>
  )
}

function LinkedInFeedMock() {
  const posts = [
    { name: 'Sarah Chen', role: 'Head of Growth', text: 'I spent 6 months testing 47 different LinkedIn content formats. Here\'s what actually moved the needle for B2B lead gen:', likes: '1.8K' },
    { name: 'Marcus Wright', role: 'Founder', text: 'We went from 0 to $2M ARR without any paid ads. Our entire GTM was LinkedIn content. Thread:', likes: '3.2K' },
  ]
  return (
    <div className="space-y-3">
      {posts.map((p, i) => (
        <div key={i} className="card-blue p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-xs font-bold text-blue-300">{p.name[0]}</div>
            <div>
              <div className="text-sm font-semibold text-white">{p.name}</div>
              <div className="text-xs text-white/40">{p.role}</div>
            </div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed mb-3">{p.text}</p>
          <div className="text-xs text-blue-400">{p.likes} reactions</div>
        </div>
      ))}
    </div>
  )
}

function EngageMock() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Alex Rivera', handle: '@alexrivera', text: 'What\'s your take on the future of B2B SaaS pricing?', likes: 847 },
        { name: 'Kim Park', handle: '@kimpark_vc', text: 'Thread on why most early-stage founders undervalue distribution...', likes: 1204 },
      ].map((item, i) => (
        <div key={i} className="card-blue p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">{item.name} <span className="text-white/30 font-normal">{item.handle}</span></div>
              <p className="text-sm text-white/60 mt-1 leading-relaxed">{item.text}</p>
              <div className="text-xs text-blue-400 mt-2">{item.likes} likes</div>
            </div>
            <button className="flex-shrink-0 text-xs bg-accent text-white rounded-lg px-3 py-1.5 hover:bg-blue-700 transition-colors">Reply with AI</button>
          </div>
        </div>
      ))}
    </div>
  )
}

export function XSection() {
  return (
    <section id="discover" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge variant="white" className="mb-4">X Platform</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Dominate X with less effort</h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">Find what works, write with AI, and publish at the perfect moment.</p>
        </div>

        {/* Feature blocks */}
        <div className="space-y-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Discover</div>
              <h3 className="text-3xl font-black text-white mb-4">Daily Viral Feed</h3>
              <p className="text-white/50 leading-relaxed mb-6">Every morning, XLink surfaces the top-performing posts in your niche from the last 24 hours. Learn the patterns, steal the formats, adapt with AI.</p>
              <ul className="space-y-3">
                {['Filtered by your exact niche', 'Format breakdown for every post', 'One-click template adaptation'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-x card-gloss p-6">
              <XViralFeedMock />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="card-x card-gloss p-6 order-2 md:order-1">
              <AIGeneratorMock />
            </div>
            <div className="order-1 md:order-2">
              <div className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-3">Create</div>
              <h3 className="text-3xl font-black text-white mb-4">AI Post Generator</h3>
              <p className="text-white/50 leading-relaxed mb-6">Go from topic to publish-ready post in seconds. Choose your format, set your tone, and let Claude write content that sounds like you.</p>
              <ul className="space-y-3">
                {['10 viral formats to choose from', 'Tone calibration (casual to contrarian)', 'Character count optimized for X'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 3-col feature cards */}
        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { title: 'Smart Scheduler', desc: 'Schedule posts at optimal times for maximum reach based on your audience\'s activity patterns.' },
            { title: 'Automations', desc: 'Auto-reply to comments, DM new followers, and engage with mentions on autopilot.' },
            { title: 'Deep Analytics', desc: 'Track every metric that matters: impressions, follower growth, engagement rate, top posts.' },
          ].map(card => (
            <div key={card.title} className="card-x card-gloss p-6">
              <h4 className="text-lg font-bold text-white mb-3">{card.title}</h4>
              <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function LinkedInSection() {
  return (
    <section id="linkedin" className="py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(37,99,235,0.06) 0%, transparent 70%)' }} />
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <Badge variant="blue" className="mb-4">LinkedIn</Badge>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Turn LinkedIn into a lead machine</h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto">Professional content that drives inbound, builds authority, and converts connections into customers.</p>
        </div>

        <div className="space-y-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Discover</div>
              <h3 className="text-3xl font-black text-white mb-4">LinkedIn Viral Feed</h3>
              <p className="text-white/50 leading-relaxed mb-6">Surface the highest-performing LinkedIn posts in your industry every day. Understand what resonates with professional audiences and replicate it.</p>
              <ul className="space-y-3">
                {['Industry-specific filtering', 'Engagement rate breakdown', 'AI-powered content adaptation'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-blue p-6">
              <LinkedInFeedMock />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="card-blue p-6 order-2 md:order-1">
              <EngageMock />
            </div>
            <div className="order-1 md:order-2">
              <div className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3">Engage</div>
              <h3 className="text-3xl font-black text-white mb-4">Engagement Opportunities</h3>
              <p className="text-white/50 leading-relaxed mb-6">Never run out of things to engage with. XLink surfaces trending posts where your comment could get thousands of views.</p>
              <ul className="space-y-3">
                {['Trending posts in your niche', 'AI-generated thoughtful replies', 'Tracked engagement history'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mt-20">
          {[
            { title: 'AI Post Writer', desc: 'Generate professional LinkedIn content that builds authority and drives inbound leads from your ideal customers.' },
            { title: 'Smart Scheduling', desc: 'Post when your audience is most active. Our scheduling algorithm optimizes for maximum professional reach.' },
            { title: 'LinkedIn Analytics', desc: 'Track impressions, profile views, connection growth, and lead attribution all in one dashboard.' },
          ].map(card => (
            <div key={card.title} className="card-blue p-6">
              <h4 className="text-lg font-bold text-white mb-3">{card.title}</h4>
              <p className="text-sm text-white/50 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
