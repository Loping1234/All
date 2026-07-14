import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, EyeOff, Inbox, Pencil, Plus, Search } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, EmptyState, ErrorState, FieldError, Input, Label, LoadingState, PageHeader, Select, Textarea } from '@/components/common/ui'
import { statusTone } from '@/components/common/tones'
import { ModalShell } from '@/components/common/ModalShell'
import { SOURCE_TYPES, type SourceItem } from '@/types'

const sourceSchema = z.object({
  sourceName: z.string().min(2, 'Source name is required'),
  sourceType: z.enum(SOURCE_TYPES),
  sourceUrl: z.string().url('Enter a valid URL'),
  title: z.string().min(4, 'Title is required'),
  sourceDate: z.string(),
  feedExcerpt: z.string().max(300, 'Keep the excerpt under 300 characters'),
  internalMemo: z.string().max(1000),
})

type SourceFormValues = z.infer<typeof sourceSchema>

function AddSourceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SourceFormValues>({
    resolver: zodResolver(sourceSchema),
    defaultValues: {
      sourceName: '',
      sourceType: 'official_reference',
      sourceUrl: '',
      title: '',
      sourceDate: '',
      feedExcerpt: '',
      internalMemo: '',
    },
  })

  async function onSubmit(values: SourceFormValues) {
    setServerError(null)
    try {
      await adminApi.createSourceItem({
        sourceName: values.sourceName,
        sourceType: values.sourceType,
        sourceUrl: values.sourceUrl,
        title: values.title,
        sourceDate: values.sourceDate || undefined,
        feedType: 'manual',
        feedExcerpt: values.feedExcerpt || undefined,
        internalMemo: values.internalMemo || undefined,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] })
      reset()
      onClose()
    } catch (error) {
      setServerError(getApiErrorMessage(error))
    }
  }

  return (
    <ModalShell open={open} onClose={onClose} title="Add manual source" wide>
      <p className="mb-4 text-sm text-gray-500">
        Record provenance metadata only — PrepMode never stores third-party article bodies. Duplicate URLs are
        rejected automatically.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="src-name">Source name</Label>
            <Input id="src-name" placeholder="e.g. Press Information Bureau" {...register('sourceName')} />
            <FieldError message={errors.sourceName?.message} />
          </div>
          <div>
            <Label htmlFor="src-type">Source type</Label>
            <Select id="src-type" className="w-full" {...register('sourceType')}>
              {SOURCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="src-url">Source URL</Label>
          <Input id="src-url" type="url" placeholder="https://…" {...register('sourceUrl')} />
          <FieldError message={errors.sourceUrl?.message} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="src-title">Title</Label>
            <Input id="src-title" placeholder="Short descriptive title" {...register('title')} />
            <FieldError message={errors.title?.message} />
          </div>
          <div>
            <Label htmlFor="src-date">Source date</Label>
            <Input id="src-date" type="date" {...register('sourceDate')} />
          </div>
        </div>
        <div>
          <Label htmlFor="src-excerpt">Feed excerpt (optional, metadata-grade only)</Label>
          <Textarea id="src-excerpt" rows={2} {...register('feedExcerpt')} />
          <FieldError message={errors.feedExcerpt?.message} />
        </div>
        <div>
          <Label htmlFor="src-memo">Internal memo (optional)</Label>
          <Textarea id="src-memo" rows={2} placeholder="Why this source matters, what to write from it…" {...register('internalMemo')} />
        </div>
        {serverError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {serverError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Add source
          </Button>
        </div>
      </form>
    </ModalShell>
  )
}

function MemoModal({ item, onClose }: { item: SourceItem | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [memo, setMemo] = useState('')
  const [error, setError] = useState<string | null>(null)

  const saveMutation = useMutation({
    mutationFn: () => adminApi.updateSourceMemo(item!.id, memo),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] })
      onClose()
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  })

  return (
    <ModalShell open={!!item} onClose={onClose} title="Internal memo">
      {item && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-900">{item.title}</p>
          <Textarea
            rows={4}
            defaultValue={item.internalMemo}
            onChange={(event) => setMemo(event.target.value)}
            onFocus={(event) => {
              if (!memo) setMemo(event.target.value)
            }}
            placeholder="Add working memo for the editorial team…"
            aria-label="Internal memo"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => saveMutation.mutate()} loading={saveMutation.isPending}>
              Save memo
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}

export default function SourceInboxPage() {
  const queryClient = useQueryClient()
  const [processingStatus, setProcessingStatus] = useState('')
  const [sourceType, setSourceType] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [memoItem, setMemoItem] = useState<SourceItem | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      processingStatus: processingStatus || undefined,
      sourceType: sourceType || undefined,
      search: search || undefined,
      page,
      pageSize: 15,
    }),
    [processingStatus, sourceType, search, page]
  )

  const listQuery = useQuery({
    queryKey: ['admin', 'sources', params],
    queryFn: () => adminApi.listSourceItems(params),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['admin', 'sources'] })

  const selectMutation = useMutation({
    mutationFn: adminApi.selectSourceItem,
    onSuccess: invalidate,
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })
  const ignoreMutation = useMutation({
    mutationFn: adminApi.ignoreSourceItem,
    onSuccess: invalidate,
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })

  const items = listQuery.data?.items ?? []
  const meta = listQuery.data?.meta
  const counts = meta?.statusCounts

  return (
    <div>
      <PageHeader
        title="Source Inbox"
        description="Provenance metadata from configured references. Review, select, and add to your content pipeline. Metadata only — never article bodies."
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Add manual source
          </Button>
        }
      />

      {counts && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(
            [
              ['Total', (counts.new ?? 0) + (counts.selected ?? 0) + (counts.ignored ?? 0), 'indigo'],
              ['New', counts.new ?? 0, 'blue'],
              ['Selected', counts.selected ?? 0, 'green'],
              ['Ignored', counts.ignored ?? 0, 'gray'],
            ] as const
          ).map(([label, value, tone]) => (
            <Card key={label} className="p-4">
              <Badge tone={tone}>{label}</Badge>
              <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-6 flex flex-wrap items-center gap-3 p-3">
        <form
          className="relative min-w-48 flex-1"
          onSubmit={(event) => {
            event.preventDefault()
            setSearch(searchInput.trim())
            setPage(1)
          }}
          role="search"
        >
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search sources…"
            className="pl-9"
            aria-label="Search sources"
          />
        </form>
        <Select value={processingStatus} onChange={(e) => { setProcessingStatus(e.target.value); setPage(1) }} aria-label="Status">
          <option value="">All status</option>
          <option value="new">New</option>
          <option value="selected">Selected</option>
          <option value="ignored">Ignored</option>
        </Select>
        <Select value={sourceType} onChange={(e) => { setSourceType(e.target.value); setPage(1) }} aria-label="Source type">
          <option value="">All types</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replaceAll('_', ' ')}
            </option>
          ))}
        </Select>
      </Card>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {listQuery.isLoading && <LoadingState label="Loading source inbox…" />}
      {listQuery.isError && (
        <ErrorState message={getApiErrorMessage(listQuery.error)} onRetry={() => void listQuery.refetch()} />
      )}

      {listQuery.isSuccess && items.length === 0 && (
        <EmptyState
          icon={<Inbox className="h-10 w-10" />}
          title="No sources match these filters"
          description="Add a manual source to start building your provenance trail."
          action={<Button onClick={() => setAddOpen(true)}>Add manual source</Button>}
        />
      )}

      {items.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Date</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="align-top hover:bg-gray-50/60">
                  <td className="max-w-72 px-5 py-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-0.5 block truncate text-xs text-primary-600 hover:underline"
                    >
                      {item.normalizedSourceUrl}
                    </a>
                    {item.internalMemo && (
                      <p className="mt-1 line-clamp-1 text-xs italic text-gray-400">“{item.internalMemo}”</p>
                    )}
                  </td>
                  <td className="px-3 py-3 text-gray-600">{item.sourceName}</td>
                  <td className="px-3 py-3">
                    <Badge tone="gray">{item.sourceType.replaceAll('_', ' ')}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                    {item.sourceDate
                      ? new Date(item.sourceDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone(item.processingStatus)}>{item.processingStatus}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {item.processingStatus !== 'selected' && (
                        <button
                          onClick={() => selectMutation.mutate(item.id)}
                          title="Mark selected"
                          aria-label={`Select ${item.title}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      )}
                      {item.processingStatus !== 'ignored' && (
                        <button
                          onClick={() => ignoreMutation.mutate(item.id)}
                          title="Ignore"
                          aria-label={`Ignore ${item.title}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          <EyeOff className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => setMemoItem(item)}
                        title="Edit memo"
                        aria-label={`Edit memo for ${item.title}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}

      <AddSourceModal open={addOpen} onClose={() => setAddOpen(false)} />
      <MemoModal item={memoItem} onClose={() => setMemoItem(null)} />
    </div>
  )
}
