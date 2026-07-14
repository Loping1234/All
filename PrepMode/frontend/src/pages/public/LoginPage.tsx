import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpenCheck, TrendingUp, Target } from 'lucide-react'
import { Button, Card, FieldError, Input, Label } from '@/components/common/ui'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/api/apiClient'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

const highlights = [
  { icon: Target, title: 'Focused practice', text: 'Exam-scoped content and original questions.' },
  { icon: TrendingUp, title: 'Real progress', text: 'Track completions and quiz accuracy honestly.' },
  { icon: BookOpenCheck, title: 'Exam ready', text: 'Build language and awareness depth daily.' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  async function onSubmit(values: LoginForm) {
    setServerError(null)
    try {
      const user = await login(values.email, values.password)
      const from = (location.state as { from?: string } | null)?.from
      navigate(user.role === 'admin' ? '/admin' : (from ?? '/dashboard'), { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
      {/* Left brand panel */}
      <div className="hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 p-10 text-white lg:block">
        <h1 className="text-3xl font-bold leading-tight">
          Welcome back to <br /> PrepMode
        </h1>
        <p className="mt-3 max-w-sm text-primary-100">
          The simpler way to study. Practice, track, and improve with confidence.
        </p>
        <div className="mt-10 space-y-5">
          {highlights.map((highlight) => (
            <div key={highlight.title} className="flex items-start gap-3">
              <span className="rounded-lg bg-white/15 p-2">
                <highlight.icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="font-semibold">{highlight.title}</p>
                <p className="text-sm text-primary-100">{highlight.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <Card className="mx-auto w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900">Log in to your account</h2>
        <p className="mt-1 text-sm text-gray-500">Enter your email and password to continue.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register('password')} />
            <FieldError message={errors.password?.message} />
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{' '}
          <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-700">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
