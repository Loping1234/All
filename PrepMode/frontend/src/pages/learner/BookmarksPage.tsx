import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { bookmarkApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'
import { ContentDetailModal } from '@/components/content/ContentDetailModal'

export default function BookmarksPage() {
  const queryClient = useQueryClient()
  const [openContentId, setOpenContentId] = useState<string | null>(null)

  const bookmarksQuery = useQuery({ queryKey: ['bookmarks'], queryFn: bookmarkApi.list })

  const removeMutation = useMutation({
    mutationFn: bookmarkApi.remove,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
      void queryClient.invalidateQueries({ queryKey: ['content'] })
      void queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })

  const bookmarks = bookmarksQuery.data ?? []

  return (
    <div>
      <PageHeader title="Bookmarks" description="Saved content for quick access and revision." />

      {bookmarksQuery.isLoading && <LoadingState label="Loading bookmarks…" />}
      {bookmarksQuery.isError && (
        <ErrorState message={getApiErrorMessage(bookmarksQuery.error)} onRetry={() => void bookmarksQuery.refetch()} />
      )}

      {bookmarksQuery.isSuccess && bookmarks.length === 0 && (
        <EmptyState
          icon={<Bookmark className="h-10 w-10" />}
          title="No bookmarks yet"
          description="Start bookmarking your favourite lessons, briefs, and passages. They will all be available here."
          action={
            <Link to="/english">
              <Button>Explore content</Button>
            </Link>
          }
        />
      )}

      {bookmarks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {bookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="flex flex-col p-5 transition-shadow hover:shadow-card-hover">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge tone="indigo">{bookmark.content.category}</Badge>
                  <Badge tone={difficultyTone(bookmark.content.difficulty)}>{bookmark.content.difficulty}</Badge>
                </div>
                <button
                  onClick={() => removeMutation.mutate(bookmark.id)}
                  aria-label={`Remove bookmark: ${bookmark.content.title}`}
                  className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={() => setOpenContentId(bookmark.content.id)}
                className="mt-3 text-left text-base font-semibold text-gray-900 hover:text-primary-700"
              >
                {bookmark.content.title}
              </button>
              <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-gray-600">{bookmark.content.summary}</p>
              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  Saved {new Date(bookmark.savedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
                <Button variant="secondary" size="sm" onClick={() => setOpenContentId(bookmark.content.id)}>
                  Open
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ContentDetailModal contentId={openContentId} onClose={() => setOpenContentId(null)} />
    </div>
  )
}
