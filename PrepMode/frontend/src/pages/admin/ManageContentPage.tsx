import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Archive, FilePlus2, FileText, Pencil, Search, Upload, Undo2 } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select } from '@/components/common/ui'
import { difficultyTone, statusTone } from '@/components/common/tones'
import { CATEGORIES, CONTENT_TYPES, DIFFICULTIES, EXAM_MODES, type ExamMode } from '@/types'

export default function ManageContentPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState('')
  const [category, setCategory] = useState('')
  const [examMode, setExamMode] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [contentType, setContentType] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [actionError, setActionError] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      status: status || undefined,
      category: category || undefined,
      examMode: (examMode || undefined) as ExamMode | undefined,
      difficulty: difficulty || undefined,
      contentType: contentType || undefined,
      search: search || undefined,
      page,
      pageSize: 15,
    }),
    [status, category, examMode, difficulty, contentType, search, page]
  )

  const listQuery = useQuery({
    queryKey: ['admin', 'content', params],
    queryFn: () => adminApi.listContent(params),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin'] })
  }

  const publishMutation = useMutation({
    mutationFn: adminApi.publishContent,
    onSuccess: invalidate,
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })
  const unpublishMutation = useMutation({
    mutationFn: adminApi.unpublishContent,
    onSuccess: invalidate,
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })
  const archiveMutation = useMutation({
    mutationFn: adminApi.archiveContent,
    onSuccess: invalidate,
    onError: (err) => setActionError(getApiErrorMessage(err)),
  })

  const items = listQuery.data?.items ?? []
  const meta = listQuery.data?.meta
  const counts = meta?.statusCounts

  return (
    <div>
      <PageHeader
        title="Manage Content"
        description="View, manage, and organise all content in PrepMode."
        actions={
          <Link to="/admin/content/new">
            <Button>
              <FilePlus2 className="h-4 w-4" aria-hidden /> Add Content
            </Button>
          </Link>
        }
      />

      {counts && (
        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {(
            [
              ['Total', (counts.draft ?? 0) + (counts.published ?? 0) + (counts.archived ?? 0), 'indigo'],
              ['Published', counts.published ?? 0, 'green'],
              ['Draft', counts.draft ?? 0, 'amber'],
              ['Archived', counts.archived ?? 0, 'gray'],
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
            placeholder="Search by title or keyword…"
            className="pl-9"
            aria-label="Search content"
          />
        </form>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} aria-label="Status">
          <option value="">All status</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </Select>
        <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1) }} aria-label="Category">
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
        <Select value={examMode} onChange={(e) => { setExamMode(e.target.value); setPage(1) }} aria-label="Exam mode">
          <option value="">All exam modes</option>
          {EXAM_MODES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
        <Select value={contentType} onChange={(e) => { setContentType(e.target.value); setPage(1) }} aria-label="Type">
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={difficulty} onChange={(e) => { setDifficulty(e.target.value); setPage(1) }} aria-label="Difficulty">
          <option value="">All difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
      </Card>

      {actionError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {actionError}
        </p>
      )}

      {listQuery.isLoading && <LoadingState label="Loading content…" />}
      {listQuery.isError && (
        <ErrorState message={getApiErrorMessage(listQuery.error)} onRetry={() => void listQuery.refetch()} />
      )}

      {listQuery.isSuccess && items.length === 0 && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No content matches these filters"
          description="Adjust the filters or create a new content item."
        />
      )}

      {items.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Title</th>
                <th className="px-3 py-3 font-medium">Category</th>
                <th className="px-3 py-3 font-medium">Exam modes</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Difficulty</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/60">
                  <td className="max-w-64 px-5 py-3">
                    <p className="truncate font-medium text-gray-900">{item.title}</p>
                    <p className="truncate text-xs text-gray-400">{item.slug}</p>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{item.category}</td>
                  <td className="px-3 py-3">
                    <div className="flex max-w-40 flex-wrap gap-1">
                      {item.examModeTags.slice(0, 3).map((mode) => (
                        <Badge key={mode} tone="indigo">
                          {mode}
                        </Badge>
                      ))}
                      {item.examModeTags.length > 3 && <Badge tone="gray">+{item.examModeTags.length - 3}</Badge>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{item.contentType}</td>
                  <td className="px-3 py-3">
                    <Badge tone={difficultyTone(item.difficulty)}>{item.difficulty}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/admin/content/${item.id}/edit`}
                        aria-label={`Edit ${item.title}`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-primary-50 hover:text-primary-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      {item.status !== 'published' && (
                        <button
                          onClick={() => publishMutation.mutate(item.id)}
                          aria-label={`Publish ${item.title}`}
                          title="Publish"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Upload className="h-4 w-4" />
                        </button>
                      )}
                      {item.status === 'published' && (
                        <button
                          onClick={() => unpublishMutation.mutate(item.id)}
                          aria-label={`Unpublish ${item.title}`}
                          title="Unpublish (back to draft)"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Undo2 className="h-4 w-4" />
                        </button>
                      )}
                      {item.status !== 'archived' && (
                        <button
                          onClick={() => archiveMutation.mutate(item.id)}
                          aria-label={`Archive ${item.title}`}
                          title="Archive"
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
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
    </div>
  )
}
