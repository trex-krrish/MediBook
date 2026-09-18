import type { ReactNode } from 'react'
import { CalendarClock } from 'lucide-react'

export function AuthSplitPanel({
  headline,
  subhead,
  children,
}: {
  headline: string
  subhead: string
  children: ReactNode
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-pine-950 px-12 py-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine-800">
            <CalendarClock className="h-4.5 w-4.5" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">MediBook</span>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl font-medium leading-[1.15] tracking-tight">{headline}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-pine-100/80">{subhead}</p>
        </div>

        <p className="relative z-10 text-xs text-pine-100/50">A simple way to book, track, and manage appointments.</p>

        <ClockMotif />
      </div>

      <div className="flex items-center justify-center bg-paper px-6 py-16">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}

function ClockMotif() {
  const ticks = Array.from({ length: 12 })

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 400 400"
      className="pointer-events-none absolute -bottom-24 -right-24 h-[420px] w-[420px] opacity-90"
    >
      <circle cx="200" cy="200" r="150" fill="none" stroke="#F4F6F1" strokeOpacity="0.08" strokeWidth="1" />
      <circle cx="200" cy="200" r="112" fill="none" stroke="#F4F6F1" strokeOpacity="0.14" strokeWidth="1" />
      {ticks.map((_, index) => {
        const angle = (index / 12) * Math.PI * 2
        const x1 = 200 + Math.sin(angle) * 150
        const y1 = 200 - Math.cos(angle) * 150
        const x2 = 200 + Math.sin(angle) * 142
        const y2 = 200 - Math.cos(angle) * 142
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#F4F6F1" strokeOpacity="0.25" strokeWidth="2" />
      })}
      <line x1="200" y1="200" x2="200" y2="108" stroke="#DDA545" strokeWidth="3" strokeLinecap="round" />
      <line x1="200" y1="200" x2="256" y2="200" stroke="#F4F6F1" strokeOpacity="0.6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="200" cy="200" r="5" fill="#DDA545" />
    </svg>
  )
}
