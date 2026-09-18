import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Search, Stethoscope } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import client from '../../api/client'
import { extractErrorMessage } from '../../api/errors'
import { EmptyState } from '../../components/ui/EmptyState'
import { InlineLoader } from '../../components/ui/PageLoader'
import type { Doctor } from '../../types'

function initials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    client
      .get<{ data: Doctor[] }>('/doctors')
      .then((response) => setDoctors(response.data.data))
      .catch((requestError) => toast.error(extractErrorMessage(requestError, 'Could not load doctors.')))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredDoctors = useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return doctors
    return doctors.filter(
      (doctor) => doctor.name.toLowerCase().includes(search) || doctor.specialization.toLowerCase().includes(search),
    )
  }, [doctors, query])

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Find a doctor</h1>
          <p className="mt-1 text-sm text-ink-soft">Pick a specialist and see their next open slot.</p>
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or specialty"
            className="w-full rounded-lg border border-line-strong bg-white py-2.5 pl-9 pr-3 text-sm placeholder:text-ink-faint focus:border-pine-700 focus:outline-none focus:ring-2 focus:ring-pine-700/15"
          />
        </div>
      </div>

      {isLoading ? (
        <InlineLoader label="Loading doctors…" />
      ) : doctors.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No doctors are available yet"
          description="Check back soon — the clinic is still setting up its schedule."
        />
      ) : filteredDoctors.length === 0 ? (
        <EmptyState icon={Search} title="No matches" description={`Nobody on staff matches "${query}". Try a different search.`} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDoctors.map((doctor) => (
            <Link
              key={doctor.id}
              to={`/doctors/${doctor.id}`}
              className="group flex items-start gap-4 rounded-2xl border border-line bg-white p-5 transition-colors hover:border-pine-700/40 hover:shadow-sm"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pine-100 font-display text-sm font-semibold text-pine-800">
                {initials(doctor.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink">{doctor.name}</p>
                <p className="text-sm text-ink-soft">{doctor.specialization}</p>
                <p className="mt-3 flex items-center gap-1 text-sm font-medium text-pine-800">
                  View availability
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
