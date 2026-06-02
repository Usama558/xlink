import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden border border-accent/20 p-16 text-center" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.25) 0%, #0d0d16 60%)' }}>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">
            Your audience is not going to grow itself
          </h2>
          <p className="text-lg text-white/40 max-w-xl mx-auto mb-10">
            9,000+ creators are already using XLink to write better content, post more consistently, and grow faster. Start free today.
          </p>
          <Link href="/signup">
            <Button size="lg">
              Start for free
              <ArrowRight size={18} />
            </Button>
          </Link>
          <p className="text-sm text-white/30 mt-4">No credit card required. Cancel anytime.</p>
        </div>
      </div>
    </section>
  )
}
