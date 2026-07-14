import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, BookmarkCheck, CheckCircle2, Circle } from 'lucide-react'
import { bookmarkApi, contentApi, progressApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, ErrorState, LoadingState } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'
import { ModalShell } from '@/components/common/ModalShell'

/**
 * Full content detail (the only learner surface that shows the body),
 * with bookmark and mark-complete actions.
 */
export function ContentDetailModal({ contentId, onClose }: { contentId: string | null; onClose: () => void }) {
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['content-detail', contentId],
    queryFn: () => contentApi.detail(contentId!),
    enabled: !!contentId,
  })

  const item = detailQuery.data

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['content'] })
    void queryClient.invalidateQueries({ queryKey: ['content-detail', contentId] })
    void queryClient.invalidateQueries({ queryKey: ['bookmarks'] })
    void queryClient.invalidateQueries({ queryKey: ['progress'] })
  }

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!item) return
      if (item.isBookmarked && item.bookmarkId) {
        await bookmarkApi.remove(item.bookmarkId)
      } else {
        await bookmarkApi.create(item.id)
      }
    },
    onSettled: invalidate,
  })

  const completeMutation = useMutation({
    mutationFn: async () => {
      if (!item) return
      if (item.isCompleted) {
        await progressApi.unmarkComplete(item.id)
      } else {
        await progressApi.markComplete(item.id)
      }
    },
    onSettled: invalidate,
  })

  return (
    <ModalShell open={!!contentId} onClose={onClose} title={item?.title ?? 'Content'} wide>
      {detailQuery.isLoading && <LoadingState label="Loading content…" />}
      {detailQuery.isError && (
        <ErrorState message={getApiErrorMessage(detailQuery.error)} onRetry={() => void detailQuery.refetch()} />
      )}
      {item && (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge tone="indigo">{item.category}</Badge>
            <Badge tone="gray">{item.contentType}</Badge>
            <Badge tone={difficultyTone(item.difficulty)}>{item.difficulty}</Badge>
            <Badge tone="blue">{item.readingLevel}</Badge>
            <Badge tone="purple">{item.recencyTag}</Badge>
          </div>

          <p className="mb-4 text-sm font-medium text-gray-600">{item.summary}</p>

          <article className="space-y-4 border-t border-gray-100 pt-4">
            {item.body.split(/\n\n+/).map((paragraph, index) => (
              <p key={index} className="whitespace-pre-line text-[15px] leading-relaxed text-gray-800">
                {paragraph}
              </p>
            ))}
          </article>

          {item.topicTags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5 border-t border-gray-100 pt-4">
              {item.topicTags.map((tag) => (
                <Badge key={tag} tone="gray">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-4">
            <Button
              variant="outline"
              onClick={() => bookmarkMutation.mutate()}
              loading={bookmarkMutation.isPending}
            >
              {item.isBookmarked ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-primary-600" aria-hidden /> Bookmarked
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" aria-hidden /> Bookmark
                </>
              )}
            </Button>
            <Button
              variant={item.isCompleted ? 'secondary' : 'primary'}
              onClick={() => completeMutation.mutate()}
              loading={completeMutation.isPending}
            >
              {item.isCompleted ? (
                <>
                  <CheckCircle2 className="h-4 w-4" aria-hidden /> Completed
                </>
              ) : (
                <>
                  <Circle className="h-4 w-4" aria-hidden /> Mark as complete
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </ModalShell>
  )
}
