import { useEffect, useState } from 'react'
import { CalendarX2, RefreshCcw } from 'lucide-react'
import { toast } from 'sonner'
import client from '../../api/client'
import { extractErrorMessage } from '../../api/errors'
import { Badge } from '../../components/ui/Badge'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineLoader } from '../../components/ui/PageLoader'
import { formatTime, parseDateInputValue, toDateInputValue, WEEKDAYS_SHORT } from '../../lib/format'
import type { Appointment } from '../../types'

function AppointmentTicket({
  appointment,
  onRequestCancel,
}: {
  appointment: Appointment
  onRequestCancel: (appointment: Appointment) => void
}) {
  const date = parseDateInputValue(appointment.appointment_date)
  const isBooked = appointment.status === 'booked'

  return (
    <li className="ticket">
      <div className="ticket-seam flex w-24 shrink-0 flex-col items-center justify-center gap-0.5 rounded-l-14 bg-pine-950 px-3 py-5 text-paper">
        <span className="text-[11px] font-medium text-pine-100/70">{WEEKDAYS_SHORT[date.getDay()]}</span>
        <span className="font-display text-2xl font-semibold leading-none">{date.getDate()}</span>
        <span className="text-[11px] text-pine-100/70">{date.toLocaleDateString('en-US', { month: 'short' })}</span>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <p className="font-display font-semibold text-ink">{appointment.doctor.name}</p>
          <p className="text-sm text-ink-soft">{appointment.doctor.specialization}</p>
          <p className="mt-1.5 font-mono text-sm tabular text-ink-soft">
            {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
          </p>
          {isBooked && appointment.rescheduled_at && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
              <RefreshCcw className="h-3 w-3" />
              Time updated by the clinic
            </p>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Badge tone={isBooked ? 'pine' : 'neutral'}>{isBooked ? 'Booked' : 'Cancelled'}</Badge>
          {isBooked && (
            <button
              type="button"
              onClick={() => onRequestCancel(appointment)}
              className="rounded-lg border border-brick-100 px-3 py-1.5 text-sm font-medium text-brick-600 transition-colors hover:bg-brick-50"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </li>
  )
}

export function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancelling, setCancelling] = useState<Appointment | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  async function loadAppointments() {
    const response = await client.get<{ data: Appointment[] }>('/appointments')
    setAppointments(response.data.data)
  }

  useEffect(() => {
    client
      .get<{ data: Appointment[] }>('/appointments')
      .then((response) => setAppointments(response.data.data))
      .catch((requestError) => toast.error(extractErrorMessage(requestError, 'Could not load your appointments.')))
      .finally(() => setIsLoading(false))
  }, [])

  async function confirmCancel() {
    if (!cancelling) return
    setIsCancelling(true)

    try {
      await client.delete(`/appointments/${cancelling.id}`)
      await loadAppointments()
      toast.success('Appointment cancelled — the slot is open again')
      setCancelling(null)
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError, 'Could not cancel this appointment.'))
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) {
    return <InlineLoader label="Loading your appointments…" />
  }

  const today = toDateInputValue(new Date())
  const upcoming = appointments.filter((a) => a.status === 'booked' && a.appointment_date >= today)
  const history = appointments.filter((a) => !(a.status === 'booked' && a.appointment_date >= today))

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-semibold text-ink">My appointments</h1>
      <p className="mb-8 text-sm text-ink-soft">Everything you've booked, and everything you've cancelled.</p>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarX2}
          title="No appointments yet"
          description="Once you book a slot with a doctor, it will show up here as a ticket you can track or cancel."
        />
      ) : (
        <div className="space-y-10">
          <section>
            <h2 className="mb-4 font-display text-lg font-semibold text-ink">Upcoming</h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-ink-soft">Nothing booked yet — find a doctor to get started.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((appointment) => (
                  <AppointmentTicket key={appointment.id} appointment={appointment} onRequestCancel={setCancelling} />
                ))}
              </ul>
            )}
          </section>

          {history.length > 0 && (
            <section>
              <h2 className="mb-4 font-display text-lg font-semibold text-ink">History</h2>
              <ul className="space-y-3 opacity-70">
                {history.map((appointment) => (
                  <AppointmentTicket key={appointment.id} appointment={appointment} onRequestCancel={setCancelling} />
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {cancelling && (
        <ConfirmDialog
          title="Cancel this appointment?"
          description={`This will free up the ${formatTime(cancelling.start_time)} slot with ${cancelling.doctor.name} for other patients.`}
          confirmLabel="Cancel appointment"
          isConfirming={isCancelling}
          onConfirm={confirmCancel}
          onCancel={() => setCancelling(null)}
        />
      )}
    </div>
  )
}
