import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'green' | 'red' | 'gray' | 'white'
  className?: string
}

export function Badge({ children, variant = 'blue', className }: BadgeProps) {
  const variants = {
    blue: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    green: 'bg-green-500/15 text-green-400 border border-green-500/20',
    red: 'bg-red-500/15 text-red-400 border border-red-500/20',
    gray: 'bg-white/5 text-white/50 border border-white/10',
    white: 'bg-white/10 text-white border border-white/15',
  }

  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  )
}
