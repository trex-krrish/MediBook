import { CalendarClock, LogOut, Stethoscope, UsersRound } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/auth-context'

const linkClasses = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? 'bg-pine-800 text-white' : 'text-ink-soft hover:bg-pine-800/10 hover:text-pine-900'
  }`

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Layout() {
  const { user, logout } = useAuth()

  async function handleLogout() {
    await logout()
    toast.success('Signed out')
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-6">
          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pine-800 text-paper">
                <CalendarClock className="h-4.5 w-4.5" />
              </span>
              <span className="font-display text-lg font-semibold tracking-tight text-ink">MediBook</span>
            </div>
            {user && (
              <div className="flex items-center gap-3 sm:hidden">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-display text-xs font-semibold text-amber-700">
                  {initials(user.name)}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="flex items-center gap-1.5 rounded-lg border border-line-strong p-2 text-ink-soft transition-colors hover:border-brick-600/40 hover:text-brick-600"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {user && (
            <nav className="scrollbar-slim -mx-1 flex gap-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
              {user.role === 'admin' && (
                <NavLink to="/admin/doctors" className={linkClasses}>
                  <UsersRound className="h-4 w-4" />
                  Doctors
                </NavLink>
              )}
              {user.role === 'patient' && (
                <>
                  <NavLink to="/doctors" className={linkClasses} end>
                    <Stethoscope className="h-4 w-4" />
                    Find a doctor
                  </NavLink>
                  <NavLink to="/appointments" className={linkClasses}>
                    <CalendarClock className="h-4 w-4" />
                    My appointments
                  </NavLink>
                </>
              )}
            </nav>
          )}

          {user && (
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 font-display text-xs font-semibold text-amber-700">
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-ink">{user.name}</p>
                  <p className="text-xs capitalize text-ink-faint">{user.role}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg border border-line-strong px-3 py-2 text-sm font-medium text-ink-soft transition-colors hover:border-brick-600/40 hover:text-brick-600"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <Outlet />
      </main>
    </div>
  )
}
