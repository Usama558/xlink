'use client'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-[62px] flex items-center border-b border-white/5 backdrop-blur-xl bg-[#08080c]/80">
      <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          XLink
        </Link>
        <div className="hidden md:flex items-center gap-8">
          <Link href="#discover" className="text-sm text-white/60 hover:text-white transition-colors">Discover</Link>
          <Link href="#linkedin" className="text-sm text-white/60 hover:text-white transition-colors">LinkedIn</Link>
          <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">Get Started Free</Button>
          </Link>
        </div>
      </div>
    </nav>
  )
}
