import { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm text-white/70 font-medium">{label}</label>}
      <input
        id={id}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all',
          className
        )}
        {...props}
      />
    </div>
  )
}

export function Textarea({ label, className, id, ...props }: { label?: string; id?: string; className?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={id} className="text-sm text-white/70 font-medium">{label}</label>}
      <textarea
        id={id}
        className={cn(
          'w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all resize-none',
          className
        )}
        {...props}
      />
    </div>
  )
}
