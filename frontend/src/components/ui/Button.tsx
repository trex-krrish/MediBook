import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'ghost'
type Size = 'sm' | 'md'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-pine-800 text-white hover:bg-pine-900 disabled:bg-pine-800/50',
  secondary: 'border border-line-strong bg-white text-ink hover:border-pine-700 hover:text-pine-800 disabled:opacity-50',
  danger: 'border border-brick-100 bg-white text-brick-600 hover:bg-brick-50 disabled:opacity-50',
  dangerSolid: 'bg-brick-600 text-white hover:bg-brick-700 disabled:bg-brick-600/50',
  ghost: 'text-ink-soft hover:bg-black/5 disabled:opacity-50',
}

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2.5 text-sm',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

export function Button({ variant = 'primary', size = 'md', isLoading, className, children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  )
}
