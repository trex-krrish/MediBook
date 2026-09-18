import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarOff, ChevronDown, Plus, Stethoscope, UserRound } from 'lucide-react'
import { toast } from 'sonner'
import client from '../../api/client'
import { extractErrorMessage } from '../../api/errors'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { DoctorAvailabilityEditor } from '../../components/DoctorAvailabilityEditor'
import { DoctorBreaksList } from '../../components/DoctorBreaksList'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineLoader } from '../../components/ui/PageLoader'
import { Modal } from '../../components/ui/Modal'
import { TextField } from '../../components/ui/TextField'
import { cn } from '../../lib/cn'
import { toDateInputValue, WEEKDAYS_SHORT } from '../../lib/format'
import type { Appointment, Doctor } from '../../types'

function AddDoctorModal({ onClose, onAdded }: { onClose: () => void; onAdded: () => Promise<void> }) {
  const [name, setName] = useState('')
  const [specialization, setSpecialization] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      await client.post('/admin/doctors', {
        name,
        specialization,
        email: email || null,
        phone: phone || null,
      })
      await onAdded()
      toast.success(`${name} was added to the directory`)
      onClose()
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Could not add doctor.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title="Add a doctor" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Name" required value={name} onChange={(event) => setName(event.target.value)} />
        <TextField
          label="Specialization"
          required
          value={specialization}
          onChange={(event) => setSpecialization(event.target.value)}
        />
        <TextField label="Email (optional)" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <TextField label="Phone (optional)" value={phone} onChange={(event) => setPhone(event.target.value)} />
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Never mind
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add doctor'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AddBreakModal({
  doctor,
  onClose,
  onAdded,
}: {
  doctor: Doctor
  onClose: () => void
  onAdded: () => Promise<void>
}) {
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [startTime, setStartTime] = useState('12:00')
  const [endTime, setEndTime] = useState('13:00')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await client.post<{ moved_appointments: Appointment[] }>(
        `/admin/doctors/${doctor.id}/breaks`,
        { date, start_time: startTime, end_time: endTime },
      )
      await onAdded()
      const movedCount = response.data.moved_appointments.length
      toast.success(
        movedCount === 0
          ? 'Break added'
          : `Break added — ${movedCount} appointment${movedCount === 1 ? '' : 's'} moved to a new time`,
      )
      onClose()
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Could not add that break.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title={`Add a break for ${doctor.name}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <TextField label="Date" type="date" required value={date} onChange={(event) => setDate(event.target.value)} />
        <div className="flex gap-3">
          <TextField
            label="Start"
            type="time"
            required
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className="flex-1"
          />
          <TextField
            label="End"
            type="time"
            required
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className="flex-1"
          />
        </div>
        <p className="text-xs text-ink-faint">
          Any booked appointment inside this window will automatically move to the nearest open slot.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Never mind
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Adding…' : 'Add break'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AvailabilityChips({ doctor }: { doctor: Doctor }) {
  const configuredDays = new Set((doctor.availabilities ?? []).map((availability) => availability.day_of_week))

  return (
    <div className="flex gap-1">
      {WEEKDAYS_SHORT.map((label, day) => {
        const periods = (doctor.availabilities ?? [])
          .filter((availability) => availability.day_of_week === day)
          .sort((a, b) => a.start_time.localeCompare(b.start_time))
        const title =
          periods.length > 0
            ? `${label}: ${periods.map((period) => `${period.start_time}–${period.end_time}`).join(', ')}`
            : `${label}: closed`

        return (
          <span
            key={day}
            title={title}
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium',
              configuredDays.has(day)
                ? 'bg-pine-800 text-white'
                : 'border border-dashed border-line-strong text-ink-faint',
            )}
          >
            {label[0]}
          </span>
        )
      })}
    </div>
  )
}

function DoctorRow({ doctor, onChanged }: { doctor: Doctor; onChanged: () => Promise<void> }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isTogglingActive, setIsTogglingActive] = useState(false)
  const [isAddingBreak, setIsAddingBreak] = useState(false)

  async function toggleActive() {
    setIsTogglingActive(true)
    try {
      await client.patch(`/admin/doctors/${doctor.id}`, { is_active: !doctor.is_active })
      await onChanged()
      toast.success(doctor.is_active ? `${doctor.name} is now hidden from patients` : `${doctor.name} is now bookable`)
    } catch (requestError) {
      toast.error(extractErrorMessage(requestError, 'Could not update this doctor.'))
    } finally {
      setIsTogglingActive(false)
    }
  }

  return (
    <li className="rounded-2xl border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-100 text-pine-800">
            <UserRound className="h-5 w-5" />
          </span>
          <div>
            <p className="font-medium text-ink">{doctor.name}</p>
            <p className="text-sm text-ink-soft">{doctor.specialization}</p>
          </div>
        </div>

        <AvailabilityChips doctor={doctor} />

        <div className="flex flex-wrap items-center gap-3">
          <Badge tone={doctor.is_active ? 'pine' : 'neutral'}>{doctor.is_active ? 'Active' : 'Inactive'}</Badge>
          <Button variant="secondary" size="sm" onClick={toggleActive} isLoading={isTogglingActive}>
            {doctor.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setIsAddingBreak(true)}>
            <CalendarOff className="h-3.5 w-3.5" />
            Add break
          </Button>
          <button
            type="button"
            onClick={() => setIsExpanded((value) => !value)}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-medium text-pine-800 hover:bg-pine-50"
          >
            Schedule
            <ChevronDown className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6 border-t border-line px-5 py-5">
          <DoctorAvailabilityEditor doctor={doctor} onSaved={onChanged} />

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Upcoming breaks</p>
            <DoctorBreaksList breaks={doctor.breaks ?? []} />
          </div>
        </div>
      )}

      {isAddingBreak && (
        <AddBreakModal doctor={doctor} onClose={() => setIsAddingBreak(false)} onAdded={onChanged} />
      )}
    </li>
  )
}

export function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingDoctor, setIsAddingDoctor] = useState(false)

  async function loadDoctors() {
    const response = await client.get<{ data: Doctor[] }>('/admin/doctors')
    setDoctors(response.data.data)
  }

  useEffect(() => {
    client
      .get<{ data: Doctor[] }>('/admin/doctors')
      .then((response) => setDoctors(response.data.data))
      .catch((requestError) => toast.error(extractErrorMessage(requestError, 'Could not load doctors.')))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Doctors</h1>
          <p className="mt-1 text-sm text-ink-soft">Manage your staff directory, their hours, and any breaks.</p>
        </div>
        <Button onClick={() => setIsAddingDoctor(true)}>
          <Plus className="h-4 w-4" />
          Add doctor
        </Button>
      </div>

      {isLoading ? (
        <InlineLoader label="Loading doctors…" />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors yet"
          description="Add your first doctor to start building the schedule patients will book from."
        />
      ) : (
        <ul className="space-y-3">
          {doctors.map((doctor) => (
            <DoctorRow key={doctor.id} doctor={doctor} onChanged={loadDoctors} />
          ))}
        </ul>
      )}

      {isAddingDoctor && <AddDoctorModal onClose={() => setIsAddingDoctor(false)} onAdded={loadDoctors} />}
    </div>
  )
}
