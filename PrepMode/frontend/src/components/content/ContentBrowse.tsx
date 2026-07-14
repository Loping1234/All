import { useMemo, useState, type ReactNode } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { BookmarkCheck, CheckCircle2, FileText, Search } from 'lucide-react'
import { contentApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'
import { ContentDetailModal } from './ContentDetailModal'
import { CONTENT_TYPES, DIFFICULTIES, RECENCY_TAGS, type ContentListItem } from '@/types'
import clsx from 'clsx'

export function ContentCard({ item, onOpen }: { item: ContentListItem; onOpen: (id: string) => void }) {
  return (
    <Card className="flex flex-col p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="indigo">{item.contentType}</Badge>
          <Badge tone={difficultyTone(item.difficulty)}>{item.difficulty}</Badge>
          {item.recencyTag !== 'Evergreen' && <Badge tone="purple">{item.recencyTag}</Badge>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-gray-300">
          {item.isBookmarked && <BookmarkCheck className="h-4 w-4 text-primary-500" aria-label="Bookmarked" />}
          {item.isCompleted && <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-label="Completed" />}
        </div>
      </div>
      <button
        onClick={() => onOpen(item.id)}
        className="mt-3 text-left text-base font-semibold text-gray-900 transition-colors hover:text-primary-700"
      >
        {item.title}
      </button>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-gray-600">{item.summary}</p>
      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <div className="flex flex-wrap gap-1.5">
          {item.topicTags.slice(0, 2).map((tag) => (
            <span key={tag} className="text-xs text-gray-400">
              #{tag}
            </span>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => onOpen(item.id)}>
          Read
        </Button>
      </div>
    </Card>
  )
}

/**
 * Shared browse surface for English / GK / Current Affairs / Editorials.
 * Cards show summaries only; the body lives in the detail modal.
 */
export function ContentBrowse({
  title,
  description,
  categories,
  topicPills,
  headerExtra,
}: {
  title: string
  description: string
  categories: string[]
  topicPills?: string[]
  headerExtra?: ReactNode
}) {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [topic, setTopic] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [contentType, setContentType] = useState('')
  const [recency, setRecency] = useState('')
  const [page, setPage] = useState(1)
  const [openContentId, setOpenContentId] = useState<string | null>(null)

  const examMode = user?.activeExamMode ?? 'All'
  const categoryParam = categories.join(',')

  const queryParams = useMemo(
    () => ({
      category: categoryParam,
      examMode,
      search: search || undefined,
      topic: topic || undefined,
      difficulty: difficulty || undefined,
      contentType: contentType || undefined,
      recency: recency || undefined,
      page,
      pageSize: 12,
    }),
    [categoryParam, examMode, search, topic, difficulty, contentType, recency, page]
  )

  const listQuery = useQuery({
    queryKey: ['content', queryParams],
    queryFn: () => contentApi.list(queryParams),
    placeholderData: keepPreviousData,
  })

  function resetAndSet(setter: (value: string) => void) {
    return (value: string) => {
      setter(value)
      setPage(1)
    }
  }

  const items = listQuery.data?.items ?? []
  const meta = listQuery.data?.meta

  return (
    <div>
      <PageHeader title={title} description={description} actions={headerExtra} />

      {topicPills && topicPills.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Explore topics">
          <button
            onClick={() => resetAndSet(setTopic)('')}
            className={clsx(
              'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              topic === '' ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-primary-50'
            )}
          >
            All topics
          </button>
          {topicPills.map((pill) => (
            <button
              key={pill}
              onClick={() => resetAndSet(setTopic)(topic === pill ? '' : pill)}
              className={clsx(
                'rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
                topic === pill ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-primary-50'
              )}
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      <Card className="mb-6 flex flex-wrap items-center gap-3 p-3">
        <form
          className="relative min-w-52 flex-1"
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
            placeholder="Search by title, summary, or topic…"
            className="pl-9"
            aria-label="Search content"
          />
        </form>
        <Select value={difficulty} onChange={(event) => resetAndSet(setDifficulty)(event.target.value)} aria-label="Difficulty">
          <option value="">All difficulty</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </Select>
        <Select value={contentType} onChange={(event) => resetAndSet(setContentType)(event.target.value)} aria-label="Content type">
          <option value="">All types</option>
          {CONTENT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <Select value={recency} onChange={(event) => resetAndSet(setRecency)(event.target.value)} aria-label="Recency">
          <option value="">All recency</option>
          {RECENCY_TAGS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </Card>

      {listQuery.isLoading && <LoadingState label={`Loading ${title.toLowerCase()}…`} />}
      {listQuery.isError && (
        <ErrorState message={getApiErrorMessage(listQuery.error)} onRetry={() => void listQuery.refetch()} />
      )}

      {listQuery.isSuccess && items.length === 0 && (
        <EmptyState
          icon={<FileText className="h-10 w-10" />}
          title="No content matches these filters"
          description="Try clearing the search or switching exam mode — new material is published regularly."
        />
      )}

      {items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <ContentCard key={item.id} item={item} onOpen={setOpenContentId} />
            ))}
          </div>
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
        </>
      )}

      <ContentDetailModal contentId={openContentId} onClose={() => setOpenContentId(null)} />
    </div>
  )
}

