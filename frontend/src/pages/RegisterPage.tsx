import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { extractErrorMessage } from '../api/errors'
import { AuthSplitPanel } from '../components/AuthSplitPanel'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useAuth } from '../context/auth-context'

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
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
      await register(name, email, password)
      toast.success('Account created — welcome to MediBook')
      navigate('/doctors')
    } catch (submitError) {
      toast.error(extractErrorMessage(submitError, 'Could not create your account.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitPanel
      headline="Your first appointment is a few taps away."
      subhead="Create a patient account to browse doctors, see open slots, and book on the spot."
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-ink-soft">Takes less than a minute.</p>

      <form onSubmit={handleSubmit} className="mt-7 space-y-4">
        <TextField
          label="Full name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" isLoading={isSubmitting} className="w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-pine-800 hover:underline">
          Log in
        </Link>
      </p>
    </AuthSplitPanel>
  )
}
