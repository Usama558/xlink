import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Hero } from '@/components/landing/Hero'
import { XSection, LinkedInSection } from '@/components/landing/FeatureSection'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { CTASection } from '@/components/landing/CTASection'

export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      {/* Social proof strip */}
      <div className="border-y border-white/5 bg-white/2 py-5">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-center gap-10 text-sm text-white/30">
          {['Used by creators at Y Combinator', 'Featured on Product Hunt', 'Trusted by 9,000+ creators', '5 billion impressions driven', 'Rated 4.9/5 stars'].map(item => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
      <XSection />
      <LinkedInSection />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <CTASection />
      <Footer />
    </main>
  )
}
