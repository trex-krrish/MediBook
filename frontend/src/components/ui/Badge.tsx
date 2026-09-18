import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'pine' | 'amber' | 'brick' | 'neutral'

const TONE_CLASSES: Record<Tone, string> = {
  pine: 'bg-pine-100 text-pine-800',
  amber: 'bg-amber-100 text-amber-700',
  brick: 'bg-brick-100 text-brick-700',
  neutral: 'bg-black/5 text-ink-soft',
}

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium', TONE_CLASSES[tone], className)}>
      {children}
    </span>
  )
}
