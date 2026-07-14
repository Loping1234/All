import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bookmark, ListChecks, RotateCcw } from 'lucide-react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import { bookmarkApi, savedQuestionApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'
import { ContentDetailModal } from '@/components/content/ContentDetailModal'

type Tab = 'all' | 'content' | 'questions'

const tabs: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All Revision' },
  { key: 'content', label: 'Bookmarked Content' },
  { key: 'questions', label: 'Saved Questions' },
]

/** Unified revision queue: bookmarks + saved questions. No answer keys here. */
export default function RevisionPage() {
  const [tab, setTab] = useState<Tab>('all')
  const [openContentId, setOpenContentId] = useState<string | null>(null)

  const bookmarksQuery = useQuery({ queryKey: ['bookmarks'], queryFn: bookmarkApi.list })
  const savedQuery = useQuery({ queryKey: ['saved-questions'], queryFn: savedQuestionApi.list })

  const isLoading = bookmarksQuery.isLoading || savedQuery.isLoading
  const error = bookmarksQuery.error ?? savedQuery.error
  const bookmarks = bookmarksQuery.data ?? []
  const saved = savedQuery.data ?? []

  const showContent = tab !== 'questions'
  const showQuestions = tab !== 'content'
  const isEmpty =
    bookmarksQuery.isSuccess &&
    savedQuery.isSuccess &&
    ((tab === 'all' && bookmarks.length + saved.length === 0) ||
      (tab === 'content' && bookmarks.length === 0) ||
      (tab === 'questions' && saved.length === 0))

  return (
    <div>
      <PageHeader
        title="Revision"
        description="Your revision queue — bookmarked content and saved questions, together in one place."
      />

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Revision filter">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.key ? 'bg-primary-600 text-white' : 'border border-gray-200 bg-white text-gray-600 hover:bg-primary-50'
            )}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-70">
              {t.key === 'all' ? bookmarks.length + saved.length : t.key === 'content' ? bookmarks.length : saved.length}
            </span>
          </button>
        ))}
      </div>

      {isLoading && <LoadingState label="Building your revision queue…" />}
      {error != null && (
        <ErrorState
          message={getApiErrorMessage(error)}
          onRetry={() => {
            void bookmarksQuery.refetch()
            void savedQuery.refetch()
          }}
        />
      )}

      {isEmpty && (
        <EmptyState
          icon={<RotateCcw className="h-10 w-10" />}
          title="Nothing to revise yet"
          description="Bookmark content while reading and save questions after quizzes — your revision queue builds itself."
          action={
            <Link to="/english">
              <Button>Start studying</Button>
            </Link>
          }
        />
      )}

      <div className="space-y-6">
        {showContent && bookmarks.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <Bookmark className="h-4 w-4" aria-hidden /> Bookmarked content
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {bookmarks.map((bookmark) => (
                <Card key={bookmark.id} className="flex flex-col p-5 transition-shadow hover:shadow-card-hover">
                  <div className="flex flex-wrap gap-1.5">
                    <Badge tone="indigo">{bookmark.content.category}</Badge>
                    <Badge tone={difficultyTone(bookmark.content.difficulty)}>{bookmark.content.difficulty}</Badge>
                  </div>
                  <button
                    onClick={() => setOpenContentId(bookmark.content.id)}
                    className="mt-3 text-left text-base font-semibold text-gray-900 hover:text-primary-700"
                  >
                    {bookmark.content.title}
                  </button>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-gray-600">{bookmark.content.summary}</p>
                  <div className="mt-4 border-t border-gray-100 pt-3">
                    <Button variant="secondary" size="sm" onClick={() => setOpenContentId(bookmark.content.id)}>
                      Revise
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {showQuestions && saved.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
              <ListChecks className="h-4 w-4" aria-hidden /> Saved questions
            </h2>
            <div className="space-y-3">
              {saved.map((row) => (
                <Card key={row.id} className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={difficultyTone(row.question.difficulty)}>{row.question.difficulty}</Badge>
                    {row.question.topicTags.slice(0, 2).map((tag) => (
                      <Badge key={tag} tone="gray">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2.5 whitespace-pre-line text-sm font-medium text-gray-900">{row.question.questionText}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      Saved {new Date(row.savedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </span>
                    <Link to="/quizzes">
                      <Button variant="ghost" size="sm">
                        Practice again
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>

      <ContentDetailModal contentId={openContentId} onClose={() => setOpenContentId(null)} />
    </div>
  )
}
