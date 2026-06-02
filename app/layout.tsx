import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'XLink — Grow and monetize your audience',
  description: 'The X and LinkedIn growth platform for creators and founders.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
