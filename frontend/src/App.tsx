import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Layout } from './components/Layout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PageLoader } from './components/ui/PageLoader'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/auth-context'
import { AdminDoctorsPage } from './pages/admin/AdminDoctorsPage'
import { LoginPage } from './pages/LoginPage'
import { AppointmentsPage } from './pages/patient/AppointmentsPage'
import { DoctorDetailPage } from './pages/patient/DoctorDetailPage'
import { DoctorsPage } from './pages/patient/DoctorsPage'
import { RegisterPage } from './pages/RegisterPage'

function HomeRedirect() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role === 'admin' ? '/admin/doctors' : '/doctors'} replace />
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" closeButton toastOptions={{ classNames: { toast: 'font-sans' } }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<Layout />}>
            <Route path="/" element={<HomeRedirect />} />

            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin/doctors" element={<AdminDoctorsPage />} />
            </Route>

            <Route element={<ProtectedRoute role="patient" />}>
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:doctorId" element={<DoctorDetailPage />} />
              <Route path="/appointments" element={<AppointmentsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
