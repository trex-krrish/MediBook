import { useEffect, useState } from 'react'
import { CalendarClock, Clock } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import client from '../../api/client'
import { extractErrorMessage } from '../../api/errors'
import { Button } from '../../components/ui/Button'
import { DateStrip } from '../../components/DateStrip'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineLoader } from '../../components/ui/PageLoader'
import { cn } from '../../lib/cn'
import { formatFullDate, formatTime, groupSlotsByPeriod, toDateInputValue } from '../../lib/format'
import type { Doctor, Slot } from '../../types'

const BOOKING_WINDOW_DAYS = 14

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function DoctorDetailPage() {
  const { doctorId } = useParams<{ doctorId: string }>()
  const navigate = useNavigate()

  const [today] = useState(() => toDateInputValue(new Date()))
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [date, setDate] = useState(today)
  const [slots, setSlots] = useState<Slot[]>([])
  const [isLoadingSlots, setIsLoadingSlots] = useState(true)
  const [bookingSlot, setBookingSlot] = useState<string | null>(null)

  function requestSlots(targetDate: string) {
    setIsLoadingSlots(true)
    client
      .get<{ slots: Slot[] }>(`/doctors/${doctorId}/slots`, { params: { date: targetDate } })
      .then((response) => setSlots(response.data.slots))
      .catch((requestError: unknown) => {
        setSlots([])
        toast.error(extractErrorMessage(requestError, 'Could not load slots for that date.'))
      })
      .finally(() => setIsLoadingSlots(false))
  }

  useEffect(() => {
    client
      .get<{ data: Doctor }>(`/doctors/${doctorId}`)
      .then((response) => setDoctor(response.data.data))
      .catch((requestError) => toast.error(extractErrorMessage(requestError, 'Could not load this doctor.')))

    client
      .get<{ slots: Slot[] }>(`/doctors/${doctorId}/slots`, { params: { date: today } })
      .then((response) => setSlots(response.data.slots))
      .catch((requestError: unknown) => {
        setSlots([])
        toast.error(extractErrorMessage(requestError, 'Could not load slots for that date.'))
      })
      .finally(() => setIsLoadingSlots(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorId])

  function handleDateChange(newDate: string) {
    setDate(newDate)
    requestSlots(newDate)
  }

  async function bookSlot(slot: Slot) {
    setBookingSlot(slot.start_time)

    try {
      await client.post('/appointments', {
        doctor_id: Number(doctorId),
        appointment_date: date,
        start_time: slot.start_time,
      })
      toast.success(`Booked ${formatTime(slot.start_time)} on ${formatFullDate(date)}`)
      setSlots((previous) => previous.filter((existing) => existing.start_time !== slot.start_time))
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Could not book that slot.'))
    } finally {
      setBookingSlot(null)
    }
  }

  if (!doctor) {
    return <InlineLoader label="Loading doctor…" />
  }

  const groups = groupSlotsByPeriod(slots)

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-pine-100 font-display text-lg font-semibold text-pine-800">
          {initials(doctor.name)}
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">{doctor.name}</h1>
          <p className="text-sm text-ink-soft">{doctor.specialization}</p>
        </div>
      </div>

      <div className="mb-8">
        <p className="mb-2 text-sm font-medium text-ink-soft">Choose a date</p>
        <DateStrip windowDays={BOOKING_WINDOW_DAYS} selectedDate={date} onSelect={handleDateChange} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-6">
        <p className="mb-5 font-display text-lg font-semibold text-ink">{formatFullDate(date)}</p>

        {isLoadingSlots ? (
          <InlineLoader label="Loading slots…" />
        ) : slots.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No open slots on this date"
            description="This doctor isn't scheduled, or every slot is already booked. Try another day."
          />
        ) : (
          <div className="space-y-6">
            {groups.map((group) => (
              <div key={group.label}>
                <p className="mb-3 font-display text-sm font-semibold text-pine-800">{group.label}</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {group.slots.map((slot) => (
                    <button
                      key={slot.start_time}
                      type="button"
                      onClick={() => bookSlot(slot)}
                      disabled={bookingSlot === slot.start_time}
                      className={cn(
                        'rounded-lg border border-pine-800/15 bg-pine-50 px-3 py-2.5 font-mono text-sm font-medium text-pine-800 tabular transition-colors',
                        'hover:border-amber-600/50 hover:bg-amber-50 hover:text-amber-700',
                        'disabled:cursor-wait disabled:opacity-60',
                      )}
                    >
                      {bookingSlot === slot.start_time ? 'Booking…' : formatTime(slot.start_time)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="secondary" onClick={() => navigate('/appointments')} className="mt-8">
        <CalendarClock className="h-4 w-4" />
        View my appointments
      </Button>
    </div>
  )
}
