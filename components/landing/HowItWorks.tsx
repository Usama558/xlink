export function HowItWorks() {
  const steps = [
    { number: '01', title: 'Connect your accounts', desc: 'Link your X and LinkedIn profiles in one click.' },
    { number: '02', title: 'Discover what works', desc: 'Browse viral content in your niche every day.' },
    { number: '03', title: 'Write with AI', desc: 'Turn ideas into polished posts in seconds.' },
    { number: '04', title: 'Schedule and grow', desc: 'Publish at peak times and watch your audience compound.' },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">How it works</h2>
          <p className="text-lg text-white/40 max-w-md mx-auto">From zero to consistent audience growth in four steps.</p>
        </div>

        <div className="relative">
          <div className="hidden md:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="grid md:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mb-6 relative z-10">
                  <span className="text-2xl font-black text-accent-light">{step.number}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
