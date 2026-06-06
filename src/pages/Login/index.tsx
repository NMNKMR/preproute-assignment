import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/Button'
import { TextField } from '@/components/ui/TextField'
import { useAuth } from '@/features/auth/AuthContext'
import { ApiError } from '@/api/client'
import { loginSchema } from '@/features/auth/loginSchema'
import type { LoginFormValues } from '@/features/auth/loginSchema'

export function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } } | null)?.from
    ?.pathname

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { userId: '', password: '' },
  })

  if (isAuthenticated) {
    return <Navigate to={from ?? '/dashboard'} replace />
  }

  async function onSubmit(values: LoginFormValues) {
    try {
      await login(values.userId, values.password)
      toast.success('Welcome back!')
      navigate(from ?? '/dashboard', { replace: true })
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : 'Login failed. Try again.'
      setError('password', { message })
      toast.error(message)
    }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 bg-canvas p-4 lg:grid-cols-2 lg:gap-4">
      {/* Illustration panel */}
      <div className="hidden items-center justify-center rounded-2xl bg-canvas lg:flex">
        <img
          src="/auth.png"
          alt="Illustration of a friendly test tube working at a laptop"
          className="h-auto w-full max-w-xl"
        />
      </div>

      {/* Form card */}
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-brand-100 bg-white p-8 shadow-sm sm:p-10">
          <Logo />
          <h1 className="mt-10 text-2xl font-bold text-ink">Login</h1>
          <p className="mt-2 text-sm text-muted">
            Use your company provided Login credentials
          </p>

          <form
            className="mt-8 flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <TextField
              label="User ID"
              placeholder="Enter User ID"
              autoComplete="username"
              error={errors.userId?.message}
              {...register('userId')}
            />
            <TextField
              label="Password"
              type="password"
              placeholder="Enter Password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register('password')}
            />

            <button
              type="button"
              className="-mt-1 self-start text-sm font-medium text-brand-600 hover:underline"
              onClick={() =>
                toast('Contact your administrator to reset your password.')
              }
            >
              Forgot password?
            </button>

            <Button type="submit" loading={isSubmitting} className="mt-2 w-full">
              Login
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
