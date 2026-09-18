export type UserRole = 'admin' | 'patient'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
}

export interface DoctorAvailability {
  id: number
  doctor_id: number
  day_of_week: number
  start_time: string
  end_time: string
}

export interface DoctorBreak {
  id: number
  doctor_id: number
  date: string
  start_time: string
  end_time: string
}

export interface Doctor {
  id: number
  name: string
  specialization: string
  email: string | null
  phone: string | null
  is_active: boolean
  availabilities?: DoctorAvailability[]
  breaks?: DoctorBreak[]
}

export interface Slot {
  start_time: string
  end_time: string
}

export type AppointmentStatus = 'booked' | 'cancelled'

export interface Appointment {
  id: number
  doctor: Doctor
  appointment_date: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  cancelled_at: string | null
  rescheduled_at: string | null
  created_at: string
}
