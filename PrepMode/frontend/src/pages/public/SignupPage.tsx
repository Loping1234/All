import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Card, FieldError, Input, Label, Select } from '@/components/common/ui'
import { useAuth } from '@/hooks/useAuth'
import { getApiErrorMessage } from '@/api/apiClient'
import { EXAM_MODES } from '@/types'

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  defaultExamMode: z.enum(EXAM_MODES),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { defaultExamMode: 'All' },
  })

  async function onSubmit(values: SignupForm) {
    setServerError(null)
    try {
      await signup(values.name, values.email, values.password, values.defaultExamMode)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
      <div className="hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-500 p-10 text-white lg:block">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary-200">Welcome to PrepMode</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight">
          Your exam preparation, <br /> smarter and focused.
        </h1>
        <p className="mt-3 max-w-sm text-primary-100">
          Join aspirants who study English, GK, current affairs, and editorials in one calm workspace.
        </p>
        <ul className="mt-10 space-y-4 text-sm text-primary-50">
          <li>• Exam-mode feeds for CAT, UPSC, SSC, Banking, CLAT, CUET, MBA, and Defence Exams</li>
          <li>• Original reading material reviewed before publication</li>
          <li>• Practice questions with explanations after you submit</li>
          <li>• Bookmarks, saved questions, and one revision queue</li>
        </ul>
      </div>

      <Card className="mx-auto w-full max-w-md p-8">
        <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
        <p className="mt-1 text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary-600 hover:text-primary-700">
            Log in
          </Link>
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
          <div>
            <Label htmlFor="name">Full name</Label>
            <Input id="name" autoComplete="name" placeholder="Aarav Sharma" {...register('name')} />
            <FieldError message={errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register('email')} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register('password')}
            />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <Label htmlFor="defaultExamMode">Choose your exam mode</Label>
            <Select id="defaultExamMode" className="w-full" {...register('defaultExamMode')}>
              {EXAM_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </Select>
            <p className="mt-1 text-xs text-gray-400">You can change this anytime from the mode switcher.</p>
          </div>

          {serverError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {serverError}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" loading={isSubmitting}>
            Create account
          </Button>
        </form>
      </Card>
    </div>
  )
}
