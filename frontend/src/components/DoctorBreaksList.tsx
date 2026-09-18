import { Coffee } from 'lucide-react'
import { formatFullDate, formatTime } from '../lib/format'
import type { DoctorBreak } from '../types'

export function DoctorBreaksList({ breaks }: { breaks: DoctorBreak[] }) {
  if (breaks.length === 0) {
    return <p className="text-sm text-ink-faint">No breaks scheduled.</p>
  }

  return (
    <ul className="space-y-1.5">
      {breaks.map((doctorBreak) => (
        <li key={doctorBreak.id} className="flex items-center gap-2 text-sm text-ink-soft">
          <Coffee className="h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span className="font-medium text-ink">{formatFullDate(doctorBreak.date)}</span>
          <span className="font-mono tabular text-ink-faint">
            {formatTime(doctorBreak.start_time)}–{formatTime(doctorBreak.end_time)}
          </span>
        </li>
      ))}
    </ul>
  )
}
