'use client'
import { cn } from '@/lib/utils'

interface ToggleProps {
  options: { label: string; value: string }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function Toggle({ options, value, onChange, className }: ToggleProps) {
  return (
    <div className={cn('flex bg-white/5 border border-white/10 rounded-xl p-1 gap-1', className)}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
            value === opt.value
              ? 'bg-accent text-white'
              : 'text-white/50 hover:text-white'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
