export function Testimonials() {
  const testimonials = [
    {
      name: 'Jordan Kim',
      role: 'SaaS Founder',
      handle: '@jordankim',
      text: 'I went from 800 to 12,000 followers on X in 4 months using XLink. The daily viral feed alone is worth 10x the price.',
      cardClass: 'card-x card-gloss',
    },
    {
      name: 'Priya Sharma',
      role: 'Growth Consultant',
      handle: '@priyasharma',
      text: 'XLink completely changed how I approach LinkedIn. My posts now consistently hit 5,000+ impressions and I\'m getting 3-4 inbound leads per week from content alone.',
      cardClass: 'card-blue',
    },
    {
      name: 'Marcus Chen',
      role: 'Creator & Educator',
      handle: '@marcuschen',
      text: 'The AI post writer is scary good. It captures my voice, knows my niche, and has cut my content creation time from 2 hours to 15 minutes per day.',
      cardClass: 'card-3d card-gloss',
    },
  ]

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Creators love XLink</h2>
          <p className="text-lg text-white/40 max-w-lg mx-auto">Join thousands of founders and creators who have made content their unfair advantage.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div key={t.name} className={`${t.cardClass} p-6`}>
              <p className="text-white/70 leading-relaxed mb-6 text-sm">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role} · {t.handle}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
