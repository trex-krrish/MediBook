import { toDateInputValue, WEEKDAYS_SHORT } from '../lib/format'
import { cn } from '../lib/cn'

export function DateStrip({
  windowDays,
  selectedDate,
  onSelect,
}: {
  windowDays: number
  selectedDate: string
  onSelect: (date: string) => void
}) {
  const today = new Date()
  const days = Array.from({ length: windowDays }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() + index)
    return date
  })

  return (
    <div className="scrollbar-slim -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
      {days.map((date) => {
        const value = toDateInputValue(date)
        const isSelected = value === selectedDate
        const isToday = value === toDateInputValue(today)

        return (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            aria-pressed={isSelected}
            className={cn(
              'flex w-16 shrink-0 flex-col items-center gap-0.5 rounded-xl border px-2 py-2.5 transition-colors',
              isSelected
                ? 'border-pine-800 bg-pine-800 text-white'
                : 'border-line-strong bg-white text-ink hover:border-pine-700/40',
            )}
          >
            <span className={cn('text-[11px] font-medium', isSelected ? 'text-pine-100' : 'text-ink-faint')}>
              {WEEKDAYS_SHORT[date.getDay()]}
            </span>
            <span className="font-display text-lg font-semibold leading-none">{date.getDate()}</span>
            {isToday && (
              <span className={cn('mt-0.5 h-1 w-1 rounded-full', isSelected ? 'bg-amber-500' : 'bg-amber-600')} />
            )}
          </button>
        )
      })}
    </div>
  )
}
