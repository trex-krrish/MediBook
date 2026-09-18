import { useEffect, useMemo, useRef, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '../../lib/cn'
import { formatTime, generateTimeOptions, groupByPeriod } from '../../lib/format'

const OPTIONS = generateTimeOptions(15)

export function TimePicker({
  value,
  onChange,
  placeholder = 'Set time',
  className,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(value || OPTIONS[0])
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)

  const groups = useMemo(() => groupByPeriod(OPTIONS, (time) => time), [])

  useEffect(() => {
    if (!isOpen) return

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen) {
      setHighlighted(value || OPTIONS[0])
      requestAnimationFrame(() => selectedRef.current?.scrollIntoView({ block: 'center' }))
    }
  }, [isOpen, value])

  function moveHighlight(step: number) {
    const index = OPTIONS.indexOf(highlighted)
    const next = OPTIONS[Math.min(Math.max(index + step, 0), OPTIONS.length - 1)]
    setHighlighted(next)
    document.getElementById(`time-option-${next}`)?.scrollIntoView({ block: 'nearest' })
  }

  function commit(time: string) {
    onChange(time)
    setIsOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setIsOpen(true)
            moveHighlight(1)
          } else if (event.key === 'ArrowUp') {
            event.preventDefault()
            setIsOpen(true)
            moveHighlight(-1)
          } else if (event.key === 'Enter' && isOpen) {
            event.preventDefault()
            commit(highlighted)
          }
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={cn(
          'flex items-center gap-2 rounded-lg border border-line-strong bg-white px-3 py-1.5 font-mono text-sm tabular transition-colors',
          'hover:border-pine-700/40 focus:border-pine-700 focus:outline-none focus:ring-2 focus:ring-pine-700/15',
          isOpen && 'border-pine-700 ring-2 ring-pine-700/15',
        )}
      >
        <Clock className="h-3.5 w-3.5 text-pine-700/70" />
        {value ? formatTime(value) : <span className="text-ink-faint">{placeholder}</span>}
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="scrollbar-slim absolute left-0 top-[calc(100%+6px)] z-20 max-h-64 w-44 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-lg"
        >
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-1 pt-2 font-display text-xs font-semibold text-pine-800">{group.label}</p>
              {group.items.map((time) => {
                const isSelected = time === value
                const isHighlighted = time === highlighted
                return (
                  <button
                    key={time}
                    id={`time-option-${time}`}
                    ref={isSelected ? selectedRef : undefined}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onMouseEnter={() => setHighlighted(time)}
                    onClick={() => commit(time)}
                    className={cn(
                      'block w-full rounded-md px-2.5 py-1.5 text-left font-mono text-sm tabular transition-colors',
                      isSelected
                        ? 'bg-pine-800 text-white'
                        : isHighlighted
                          ? 'bg-amber-50 text-amber-700'
                          : 'text-ink-soft hover:bg-amber-50 hover:text-amber-700',
                    )}
                  >
                    {formatTime(time)}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
