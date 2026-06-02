import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Check } from 'lucide-react'

const plans = [
  {
    name: 'Pro',
    price: '$29',
    desc: 'For creators just getting started with content.',
    features: ['50 AI posts/month', 'X platform only', 'Basic analytics', 'Smart scheduler', '7-day post history'],
    highlighted: false,
  },
  {
    name: 'Advanced',
    price: '$39',
    desc: 'The full platform for serious growth.',
    features: ['Unlimited AI posts', 'X + LinkedIn', 'Deep analytics', 'Engagement opportunities', 'Priority support', 'Custom niche training'],
    highlighted: true,
  },
  {
    name: 'Ultra',
    price: '$99',
    desc: 'For agencies and power users managing multiple accounts.',
    features: ['Everything in Advanced', '5 connected accounts', 'Team collaboration', 'White-label exports', 'Dedicated account manager', 'API access'],
    highlighted: false,
  },
]

export function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Simple, transparent pricing</h2>
          <p className="text-lg text-white/40 max-w-lg mx-auto">Start free, upgrade when you need more. Cancel anytime.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`rounded-3xl p-8 relative ${plan.highlighted
                ? 'bg-accent/10 border border-accent/40 blue-glow'
                : 'card-x card-gloss'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>
              )}
              <div className="mb-6">
                <div className="text-sm font-semibold text-white/50 mb-1">{plan.name}</div>
                <div className="text-4xl font-black text-white mb-2">{plan.price}<span className="text-lg font-normal text-white/40">/mo</span></div>
                <p className="text-sm text-white/40">{plan.desc}</p>
              </div>
              <Link href="/signup">
                <Button variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full mb-8">
                  Get Started
                </Button>
              </Link>
              <ul className="space-y-3">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-white/60">
                    <Check size={15} className={plan.highlighted ? 'text-blue-400' : 'text-white/30'} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
