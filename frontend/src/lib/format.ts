export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Formats an "HH:mm" (or "HH:mm:ss") string as "9:00 AM". */
export function formatTime(time: string): string {
  const [hourString, minuteString] = time.split(':')
  const hour = Number(hourString)
  const minute = Number(minuteString)
  const period = hour >= 12 ? 'PM' : 'AM'
  const twelveHour = hour % 12 === 0 ? 12 : hour % 12
  return `${twelveHour}:${minute.toString().padStart(2, '0')} ${period}`
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parses a "YYYY-MM-DD" string as a local date (avoids UTC-shift bugs from `new Date(string)`). */
export function parseDateInputValue(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatFullDate(value: string): string {
  return parseDateInputValue(value).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

export function isSameDate(a: string, b: string): boolean {
  return a === b
}

type SlotLike = { start_time: string }

const PERIODS = [
  { label: 'Morning', from: 0, to: 12 },
  { label: 'Afternoon', from: 12, to: 17 },
  { label: 'Evening', from: 17, to: 24 },
] as const

export function groupSlotsByPeriod<T extends SlotLike>(slots: T[]): { label: string; slots: T[] }[] {
  return PERIODS.map((period) => ({
    label: period.label,
    slots: slots.filter((slot) => {
      const hour = Number(slot.start_time.split(':')[0])
      return hour >= period.from && hour < period.to
    }),
  })).filter((group) => group.slots.length > 0)
}
