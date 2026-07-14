import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2 } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import {
  Badge,
  Button,
  Card,
  FieldError,
  Input,
  Label,
  LoadingState,
  PageHeader,
  Select,
  Textarea,
} from '@/components/common/ui'
import {
  CATEGORIES,
  CONTENT_TYPES,
  DIFFICULTIES,
  EXAM_MODES,
  READING_LEVELS,
  RECENCY_TAGS,
  SOURCE_TYPES,
  type Category,
} from '@/types'
import clsx from 'clsx'

const contentSchema = z.object({
  title: z.string().min(8, 'Title must be at least 8 characters').max(160),
  summary: z.string().min(20, 'Summary must be at least 20 characters').max(400),
  body: z.string().min(100, 'Body must be at least 100 characters'),
  category: z.enum(CATEGORIES),
  contentType: z.enum(CONTENT_TYPES),
  difficulty: z.enum(DIFFICULTIES),
  readingLevel: z.enum(READING_LEVELS),
  recencyTag: z.enum(RECENCY_TAGS),
  examModeTags: z.array(z.enum(EXAM_MODES)).min(1, 'Pick at least one exam mode'),
  subjectTags: z.string(),
  topicTags: z.string().min(1, 'Add at least one topic tag'),
  sourceName: z.string(),
  sourceType: z.string(),
  sourceUrl: z.string().url('Enter a valid URL').or(z.literal('')),
})

type ContentFormValues = z.infer<typeof contentSchema>

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

const checklist = [
  'Content is original and reviewed',
  'Facts and figures are accurate',
  'Free from spelling and grammar errors',
  'Relevant tags and modes selected',
  'Aligned with PrepMode content policy',
]

export default function ContentFormPage({ presetCategory }: { presetCategory?: Category }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [serverError, setServerError] = useState<string | null>(null)
  const [savedAs, setSavedAs] = useState<string | null>(null)

  const existingQuery = useQuery({
    queryKey: ['admin', 'content-detail', id],
    queryFn: () => adminApi.getContent(id!),
    enabled: isEdit,
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContentFormValues>({
    resolver: zodResolver(contentSchema),
    defaultValues: {
      title: '',
      summary: '',
      body: '',
      category: presetCategory ?? 'English',
      contentType: presetCategory === 'Current Affairs' ? 'Brief' : presetCategory === 'Editorials' ? 'Editorial Analysis' : 'Article',
      difficulty: 'Medium',
      readingLevel: 'Intermediate',
      recencyTag: presetCategory === 'Current Affairs' ? 'Daily' : 'Evergreen',
      examModeTags: ['All'],
      subjectTags: presetCategory ?? '',
      topicTags: '',
      sourceName: '',
      sourceType: '',
      sourceUrl: '',
    },
  })

  useEffect(() => {
    const item = existingQuery.data
    if (item) {
      reset({
        title: item.title,
        summary: item.summary,
        body: item.body,
        category: item.category,
        contentType: item.contentType,
        difficulty: item.difficulty,
        readingLevel: item.readingLevel,
        recencyTag: item.recencyTag,
        examModeTags: item.examModeTags,
        subjectTags: item.subjectTags.join(', '),
        topicTags: item.topicTags.join(', '),
        sourceName: item.sourceMetadata?.sourceName ?? '',
        sourceType: item.sourceMetadata?.sourceType ?? '',
        sourceUrl: item.sourceMetadata?.sourceUrl ?? '',
      })
    }
  }, [existingQuery.data, reset])

  async function save(values: ContentFormValues, status: 'draft' | 'published') {
    setServerError(null)
    setSavedAs(null)
    const payload = {
      title: values.title,
      summary: values.summary,
      body: values.body,
      category: values.category,
      contentType: values.contentType,
      difficulty: values.difficulty,
      readingLevel: values.readingLevel,
      recencyTag: values.recencyTag,
      examModeTags: values.examModeTags,
      subjectTags: parseTags(values.subjectTags),
      topicTags: parseTags(values.topicTags),
      status,
      sourceMetadata:
        values.sourceName || values.sourceUrl
          ? {
              sourceName: values.sourceName || undefined,
              sourceType: values.sourceType || undefined,
              sourceUrl: values.sourceUrl || undefined,
            }
          : undefined,
    }
    try {
      if (isEdit) {
        await adminApi.updateContent(id!, payload)
        if (status === 'published') await adminApi.publishContent(id!)
        setSavedAs(status)
      } else {
        await adminApi.createContent(payload)
        navigate('/admin/content')
      }
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  if (isEdit && existingQuery.isLoading) return <LoadingState label="Loading content…" />

  const pageTitle = isEdit
    ? 'Edit Content'
    : presetCategory === 'Current Affairs'
      ? 'Add Current Affairs'
      : presetCategory === 'Editorials'
        ? 'Add Editorial'
        : 'Add Content'

  return (
    <div>
      <PageHeader
        title={pageTitle}
        description="Create original, high-quality educational content for PrepMode learners."
      />

      <form
        onSubmit={handleSubmit((values) => save(values, 'draft'))}
        className="grid gap-6 lg:grid-cols-3"
        noValidate
      >
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Write a clear, engaging title…" {...register('title')} />
              <FieldError message={errors.title?.message} />
            </div>
            <div>
              <Label htmlFor="summary">Summary</Label>
              <Textarea
                id="summary"
                rows={2}
                placeholder="Write a concise overview of the content. This will be shown on list cards and previews."
                {...register('summary')}
              />
              <FieldError message={errors.summary?.message} />
            </div>
            <div>
              <Label htmlFor="body">Body</Label>
              <Textarea
                id="body"
                rows={14}
                placeholder="Write or paste your educational content here. Use blank lines to separate paragraphs."
                {...register('body')}
              />
              <FieldError message={errors.body?.message} />
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">Classification</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select id="category" className="w-full" {...register('category')}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="contentType">Content type</Label>
                <Select id="contentType" className="w-full" {...register('contentType')}>
                  {CONTENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="difficulty">Difficulty</Label>
                <Select id="difficulty" className="w-full" {...register('difficulty')}>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="readingLevel">Reading level</Label>
                <Select id="readingLevel" className="w-full" {...register('readingLevel')}>
                  {READING_LEVELS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="recencyTag">Recency</Label>
                <Select id="recencyTag" className="w-full" {...register('recencyTag')}>
                  {RECENCY_TAGS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
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
                            field.onChange(
                              selected ? field.value.filter((m) => m !== mode) : [...field.value, mode]
                            )
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="subjectTags">Subject tags (comma separated)</Label>
                <Input id="subjectTags" placeholder="English, Verbal Ability" {...register('subjectTags')} />
              </div>
              <div>
                <Label htmlFor="topicTags">Topic tags (comma separated)</Label>
                <Input id="topicTags" placeholder="Reading Comprehension, Inference" {...register('topicTags')} />
                <FieldError message={errors.topicTags?.message} />
              </div>
            </div>
          </Card>

          <Card className="space-y-4 p-6">
            <h2 className="font-semibold text-gray-900">Source metadata (optional)</h2>
            <p className="text-sm text-gray-500">
              Record the reference that informed this original content. Provenance only — never paste source text.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="sourceName">Source name</Label>
                <Input id="sourceName" placeholder="e.g. RBI reference page" {...register('sourceName')} />
              </div>
              <div>
                <Label htmlFor="sourceType">Source type</Label>
                <Select id="sourceType" className="w-full" {...register('sourceType')}>
                  <option value="">Select type…</option>
                  {SOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replaceAll('_', ' ')}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="sourceUrl">Source URL</Label>
                <Input id="sourceUrl" type="url" placeholder="https://…" {...register('sourceUrl')} />
                <FieldError message={errors.sourceUrl?.message} />
              </div>
            </div>
          </Card>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900">Content policy</h2>
            <ul className="mt-3 space-y-2">
              {[
                'All content must be original and educational',
                'Accurate, exam-relevant, and verified',
                'Free from plagiarism',
                'Reviewed before it reaches learners',
              ].map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900">Publish checklist</h2>
            <ul className="mt-3 space-y-2">
              {checklist.map((rule) => (
                <li key={rule} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" aria-hidden />
                  {rule}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3 p-6">
            {serverError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {serverError}
              </p>
            )}
            {savedAs && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700" role="status">
                Saved{savedAs === 'published' ? ' and published' : ' as draft'}.
              </p>
            )}
            {isEdit && existingQuery.data && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                Current status: <Badge tone="indigo">{existingQuery.data.status}</Badge>
              </div>
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
              {isEdit ? 'Save & publish' : 'Publish'}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  )
}
