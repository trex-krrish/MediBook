import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { extractErrorMessage } from '../api/errors'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { AuthSplitPanel } from '../components/AuthSplitPanel'
import { useAuth } from '../context/auth-context'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin/doctors' : '/doctors'} replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSubmitting(true)

    try {
      const loggedInUser = await login(email, password)
      toast.success(`Welcome back, ${loggedInUser.name.split(' ')[0]}`)
      navigate(loggedInUser.role === 'admin' ? '/admin/doctors' : '/doctors')
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Invalid email or password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitPanel
      headline="Care, on your schedule."
      subhead="Book with your doctor in minutes — no phone tag, no waiting on hold."
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Enter your details to reach your appointments.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <TextField
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {isSubmitting ? 'Logging in…' : 'Log in'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        New patient?{' '}
        <Link to="/register" className="font-medium text-pine-800 hover:underline">
          Create an account
        </Link>
      </p>
      <p className="mt-4 rounded-lg bg-pine-50 px-3 py-2 text-xs text-pine-800">
        Admin demo login: admin@example.com / password
      </p>
    </AuthSplitPanel>
  )
}
