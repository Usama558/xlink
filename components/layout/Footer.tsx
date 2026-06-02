import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#08080c] py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <div className="text-xl font-bold text-white mb-3">XLink</div>
            <p className="text-sm text-white/40 leading-relaxed">
              The growth platform for X and LinkedIn creators who are serious about building an audience.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Product</div>
            <ul className="space-y-2.5">
              {['Discover', 'AI Writer', 'Scheduler', 'Analytics', 'Engage'].map(item => (
                <li key={item}><Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Company</div>
            <ul className="space-y-2.5">
              {['About', 'Blog', 'Careers', 'Press', 'Contact'].map(item => (
                <li key={item}><Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-white/70 mb-4 uppercase tracking-wider">Legal</div>
            <ul className="space-y-2.5">
              {['Privacy Policy', 'Terms of Service', 'Cookie Policy', 'GDPR'].map(item => (
                <li key={item}><Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">{item}</Link></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">2024 XLink. All rights reserved.</p>
          <p className="text-sm text-white/30">Built for creators who mean business.</p>
        </div>
      </div>
    </footer>
  )
}
