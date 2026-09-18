import { useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import client from '../api/client'
import { extractErrorMessage } from '../api/errors'
import { Button } from './ui/Button'
import { formatTime, WEEKDAYS } from '../lib/format'
import type { Doctor, DoctorAvailability } from '../types'

function DayPeriods({
  day,
  label,
  doctorId,
  periods,
  onChanged,
}: {
  day: number
  label: string
  doctorId: number
  periods: DoctorAvailability[]
  onChanged: () => Promise<void>
}) {
  const [isAdding, setIsAdding] = useState(false)
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [isSaving, setIsSaving] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  async function addPeriod(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)

    try {
      await client.post(`/admin/doctors/${doctorId}/availabilities`, {
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
      })
      await onChanged()
      toast.success(`${label} period added`)
      setIsAdding(false)
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Could not add that period.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function removePeriod(period: DoctorAvailability) {
    setRemovingId(period.id)

    try {
      await client.delete(`/admin/doctors/${doctorId}/availabilities/${period.id}`)
      await onChanged()
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError, 'Could not remove that period.'))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="flex flex-wrap items-start gap-3 px-4 py-3">
      <span className="w-28 shrink-0 pt-1.5 text-sm font-medium text-ink">{label}</span>

      <div className="flex flex-1 flex-wrap items-center gap-2">
        {periods.map((period) => (
          <span
            key={period.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1.5 font-mono text-xs tabular text-pine-800"
          >
            {formatTime(period.start_time)}–{formatTime(period.end_time)}
            <button
              type="button"
              onClick={() => removePeriod(period)}
              disabled={removingId === period.id}
              aria-label={`Remove ${label} ${period.start_time} to ${period.end_time}`}
              className="text-pine-800/50 transition-colors hover:text-brick-600 disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {isAdding ? (
          <form onSubmit={addPeriod} className="flex items-center gap-1.5">
            <input
              type="time"
              required
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 font-mono text-sm tabular focus:border-pine-700 focus:outline-none"
            />
            <span className="text-ink-faint">to</span>
            <input
              type="time"
              required
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
              className="rounded-lg border border-line-strong bg-white px-2.5 py-1.5 font-mono text-sm tabular focus:border-pine-700 focus:outline-none"
            />
            <Button type="submit" size="sm" isLoading={isSaving}>
              Add
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setIsAdding(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-1.5 text-sm text-ink-faint hover:border-pine-700/40 hover:text-pine-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add period
          </button>
        )}
      </div>
    </div>
  )
}

export function DoctorAvailabilityEditor({ doctor, onSaved }: { doctor: Doctor; onSaved: () => Promise<void> }) {
  function periodsForDay(day: number): DoctorAvailability[] {
    return (doctor.availabilities ?? [])
      .filter((availability) => availability.day_of_week === day)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  }

  return (
    <div>
      <p className="mb-4 text-sm text-ink-soft">
        Add one or more periods per day — for example a morning and afternoon block split by a lunch break.
      </p>
      <div className="divide-y divide-line rounded-xl border border-line bg-paper/60">
        {WEEKDAYS.map((label, day) => (
          <DayPeriods key={day} day={day} label={label} doctorId={doctor.id} periods={periodsForDay(day)} onChanged={onSaved} />
        ))}
      </div>
    </div>
  )
}
