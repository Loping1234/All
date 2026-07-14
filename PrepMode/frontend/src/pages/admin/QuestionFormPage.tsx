import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2 } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import {
  Button,
  Card,
  FieldError,
  Input,
  Label,
  PageHeader,
  Select,
  Textarea,
} from '@/components/common/ui'
import { DIFFICULTIES, EXAM_MODES } from '@/types'
import clsx from 'clsx'

const questionSchema = z
  .object({
    questionText: z.string().min(10, 'Question must be at least 10 characters'),
    options: z
      .array(z.object({ value: z.string().min(1, 'Option cannot be empty') }))
      .length(4),
    correctIndex: z.number().min(0).max(3),
    explanation: z.string().min(10, 'Explanation must be at least 10 characters'),
    difficulty: z.enum(DIFFICULTIES),
    examModeTags: z.array(z.enum(EXAM_MODES)).min(1, 'Pick at least one exam mode'),
    subjectTags: z.string(),
    topicTags: z.string(),
  })
  .refine((data) => new Set(data.options.map((o) => o.value.trim())).size === 4, {
    message: 'Options must be distinct',
    path: ['options'],
  })

type QuestionFormValues = z.infer<typeof questionSchema>

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export default function QuestionFormPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionText: '',
      options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }],
      correctIndex: 0,
      explanation: '',
      difficulty: 'Medium',
      examModeTags: ['All'],
      subjectTags: '',
      topicTags: '',
    },
  })

  const watched = watch()

  async function save(values: QuestionFormValues, status: 'draft' | 'published') {
    setServerError(null)
    setSaved(false)
    const options = values.options.map((o) => o.value.trim())
    try {
      await adminApi.createQuestion({
        questionText: values.questionText,
        options,
        correctAnswer: options[values.correctIndex],
        explanation: values.explanation,
        difficulty: values.difficulty,
        examModeTags: values.examModeTags,
        subjectTags: parseTags(values.subjectTags),
        topicTags: parseTags(values.topicTags),
        status,
      })
      setSaved(true)
      if (status === 'published') {
        reset()
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader
        title="Add Quiz Question"
        description="Create an original practice question. Learners see the answer and explanation only after submitting a quiz."
      />

      <form onSubmit={handleSubmit((values) => save(values, 'draft'))} className="grid gap-6 lg:grid-cols-3" noValidate>
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <div>
              <Label htmlFor="questionText">Question text</Label>
              <Textarea
                id="questionText"
                rows={3}
                placeholder="Write a self-contained question stem…"
                {...register('questionText')}
              />
              <FieldError message={errors.questionText?.message} />
            </div>

            <div>
              <Label>Options (select the correct answer)</Label>
              <Controller
                control={control}
                name="correctIndex"
                render={({ field }) => (
                  <div className="space-y-2.5" role="radiogroup" aria-label="Options with correct answer selection">
                    {[0, 1, 2, 3].map((index) => (
                      <div
                        key={index}
                        className={clsx(
                          'flex items-center gap-3 rounded-xl border px-3 py-2 transition-colors',
                          field.value === index ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200'
                        )}
                      >
                        <input
                          type="radio"
                          name="correct-option"
                          checked={field.value === index}
                          onChange={() => field.onChange(index)}
                          aria-label={`Mark option ${String.fromCharCode(65 + index)} correct`}
                          className="h-4 w-4 accent-emerald-600"
                        />
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                          {String.fromCharCode(65 + index)}
                        </span>
                        <Input
                          placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          className="border-0 shadow-none focus:ring-0"
                          {...register(`options.${index}.value` as const)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              />
              {errors.options && (
                <FieldError
                  message={
                    errors.options.message ??
                    errors.options.root?.message ??
                    (Array.isArray(errors.options)
                      ? errors.options.find((o) => o?.value?.message)?.value?.message
                      : undefined)
                  }
                />
              )}
            </div>

            <div>
              <Label htmlFor="explanation">Explanation (shown after submission)</Label>
              <Textarea
                id="explanation"
                rows={3}
                placeholder="Teach why the correct answer is right…"
                {...register('explanation')}
              />
              <FieldError message={errors.explanation?.message} />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">Classification</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="q-difficulty">Difficulty</Label>
                <Select id="q-difficulty" className="w-full" {...register('difficulty')}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="q-subject">Subject tags</Label>
                <Input id="q-subject" placeholder="Vocabulary" {...register('subjectTags')} />
              </div>
              <div>
                <Label htmlFor="q-topic">Topic tags</Label>
                <Input id="q-topic" placeholder="Synonyms" {...register('topicTags')} />
              </div>
            </div>
            <div>
              <Label>Exam modes</Label>
              <Controller
                control={control}
                name="examModeTags"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {EXAM_MODES.map((mode) => {
                      const selected = field.value.includes(mode)
                      return (
                        <button
                          type="button"
                          key={mode}
                          onClick={() =>
                            field.onChange(selected ? field.value.filter((m) => m !== mode) : [...field.value, mode])
                          }
                          aria-pressed={selected}
                          className={clsx(
                            'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                            selected
                              ? 'bg-primary-600 text-white'
                              : 'border border-gray-200 bg-white text-gray-600 hover:bg-primary-50'
                          )}
                        >
                          {mode}
                        </button>
                      )
                    })}
                  </div>
                )}
              />
              <FieldError message={errors.examModeTags?.message} />
            </div>
          </Card>
        </div>

        {/* Preview + actions */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="mb-3 font-semibold text-gray-900">Learner preview</h2>
            <p className="whitespace-pre-line text-sm font-medium text-gray-900">
              {watched.questionText || 'Your question will appear here…'}
            </p>
            <div className="mt-3 space-y-2">
              {watched.options?.map((option, index) => (
                <div key={index} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {option.value || `Option ${String.fromCharCode(65 + index)}`}
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-400">
              The correct answer and explanation are hidden from learners until they submit.
            </p>
          </Card>

          <Card className="space-y-3 p-6">
            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {serverError}
              </p>
            )}
            {saved && (
              <p className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                <CheckCircle2 className="h-4 w-4" aria-hidden /> Question saved.
              </p>
            )}
            <Button type="submit" variant="outline" className="w-full" loading={isSubmitting}>
              Save draft
            </Button>
            <Button
              type="button"
              className="w-full"
              loading={isSubmitting}
              onClick={handleSubmit((values) => save(values, 'published'))}
            >
              Publish question
            </Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate('/admin')}>
              Back to dashboard
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
