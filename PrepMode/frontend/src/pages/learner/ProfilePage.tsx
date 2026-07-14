import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { progressApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Button, Card, FieldError, Input, Label, PageHeader, Select } from '@/components/common/ui'
import { EXAM_MODES } from '@/types'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  defaultExamMode: z.enum(EXAM_MODES),
})

type ProfileForm = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  const summaryQuery = useQuery({ queryKey: ['progress', 'summary'], queryFn: progressApi.summary })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      defaultExamMode: user?.defaultExamMode ?? 'All',
    },
  })

  async function onSubmit(values: ProfileForm) {
    setMessage(null)
    try {
      await updateProfile(values)
      setMessage({ kind: 'success', text: 'Profile updated.' })
    } catch (error) {
      setMessage({ kind: 'error', text: getApiErrorMessage(error) })
    }
  }

  const summary = summaryQuery.data

  return (
    <div>
      <PageHeader title="Profile" description="Your account details and study preferences." />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="p-6">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-xl font-bold text-primary-700">
              {(user?.name ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <h2 className="mt-3 text-lg font-semibold text-gray-900">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <div className="mt-3 flex gap-2">
              <Badge tone="indigo">Learner</Badge>
              <Badge tone="gray">Active mode: {user?.activeExamMode}</Badge>
            </div>
          </div>
          {summary && (
            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-5 text-center">
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Completed</dt>
                <dd className="mt-0.5 text-xl font-bold text-gray-900">{summary.completedContent}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-gray-400">Accuracy</dt>
                <dd className="mt-0.5 text-xl font-bold text-gray-900">{summary.overallAccuracy}%</dd>
              </div>
            </dl>
          )}
        </Card>

        {/* Edit form */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900">Edit profile</h2>
          <form className="mt-5 max-w-md space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <div>
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" {...register('name')} />
              <FieldError message={errors.name?.message} />
            </div>
            <div>
              <Label htmlFor="profile-mode">Default exam mode</Label>
              <Select id="profile-mode" className="w-full" {...register('defaultExamMode')}>
                {EXAM_MODES.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode}
                  </option>
                ))}
              </Select>
              <p className="mt-1 text-xs text-gray-400">Used as your starting mode when you log in.</p>
            </div>

            {message && (
              <p
                role="alert"
                className={
                  message.kind === 'success'
                    ? 'rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                    : 'rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700'
                }
              >
                {message.text}
              </p>
            )}

            <Button type="submit" loading={isSubmitting}>
              Save changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
