import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListChecks, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { savedQuestionApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/common/ui'
import { difficultyTone } from '@/components/common/tones'

/**
 * Saved questions library. Deliberately shows question text and options only —
 * answer keys and explanations stay behind the quiz submission boundary.
 */
export default function SavedQuestionsPage() {
  const queryClient = useQueryClient()

  const savedQuery = useQuery({ queryKey: ['saved-questions'], queryFn: savedQuestionApi.list })

  const removeMutation = useMutation({
    mutationFn: savedQuestionApi.remove,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['saved-questions'] })
      void queryClient.invalidateQueries({ queryKey: ['progress'] })
    },
  })

  const saved = savedQuery.data ?? []

  return (
    <div>
      <PageHeader
        title="Saved Questions"
        description="Questions you saved for later review and practice. Re-attempt them in a quiz to see explanations again."
      />

      {savedQuery.isLoading && <LoadingState label="Loading saved questions…" />}
      {savedQuery.isError && (
        <ErrorState message={getApiErrorMessage(savedQuery.error)} onRetry={() => void savedQuery.refetch()} />
      )}

      {savedQuery.isSuccess && saved.length === 0 && (
        <EmptyState
          icon={<ListChecks className="h-10 w-10" />}
          title="No saved questions yet"
          description="After submitting a quiz, save the questions worth revisiting — they will collect here."
          action={
            <Link to="/quizzes">
              <Button>Take a quiz</Button>
            </Link>
          }
        />
      )}

      {saved.length > 0 && (
        <div className="space-y-4">
          {saved.map((row) => (
            <Card key={row.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={difficultyTone(row.question.difficulty)}>{row.question.difficulty}</Badge>
                  {row.question.topicTags.slice(0, 2).map((tag) => (
                    <Badge key={tag} tone="gray">
                      {tag}
                    </Badge>
                  ))}
                  <Badge tone="indigo">{row.examModeAtSave}</Badge>
                </div>
                <button
                  onClick={() => removeMutation.mutate(row.id)}
                  aria-label="Remove saved question"
                  className="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 whitespace-pre-line text-[15px] font-medium text-gray-900">{row.question.questionText}</p>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {row.question.options.map((option, index) => (
                  <div key={option} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                      {String.fromCharCode(65 + index)}
                    </span>
                    {option}
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                {row.reason ? (
                  <p className="text-xs italic text-gray-400">“{row.reason}”</p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  Saved {new Date(row.savedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
