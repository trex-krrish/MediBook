import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/auth-context'
import { PageLoader } from './ui/PageLoader'
import type { UserRole } from '../types'

export function ProtectedRoute({ role }: { role: UserRole }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== role) {
    return <Navigate to={user.role === 'admin' ? '/admin/doctors' : '/doctors'} replace />
  }

  return <Outlet />
}
