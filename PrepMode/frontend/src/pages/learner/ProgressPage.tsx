import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Bookmark, CheckCircle2, ListChecks, TrendingUp } from 'lucide-react'
import { progressApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import {
  Badge,
  Card,
  ErrorState,
  LoadingState,
  PageHeader,
  StatCard,
} from '@/components/common/ui'

/** Aggregate progress: completions, attempts, accuracy. No answer content. */
export default function ProgressPage() {
  const summaryQuery = useQuery({ queryKey: ['progress', 'summary'], queryFn: progressApi.summary })
  const historyQuery = useQuery({ queryKey: ['progress', 'history'], queryFn: () => progressApi.history({ limit: 15 }) })

  if (summaryQuery.isLoading) return <LoadingState label="Calculating your progress…" />
  if (summaryQuery.isError) {
    return <ErrorState message={getApiErrorMessage(summaryQuery.error)} onRetry={() => void summaryQuery.refetch()} />
  }

  const summary = summaryQuery.data
  if (!summary) return null

  const chartData = Object.entries(summary.completedByCategory)
    .filter(([, count]) => count >= 0)
    .map(([category, count]) => ({ category, completed: count }))

  const completions = historyQuery.data?.completions ?? []
  const attempts = historyQuery.data?.attempts ?? []

  return (
    <div>
      <PageHeader title="Progress" description="Track your improvement: completed material, quiz attempts, and overall accuracy." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Completed content"
          value={summary.completedContent}
          icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Quiz attempts"
          value={summary.quizAttempts}
          hint={`${summary.totalQuestionsAnswered} questions answered`}
          icon={<ListChecks className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Overall accuracy"
          value={`${summary.overallAccuracy}%`}
          hint={`${summary.correctAnswers} correct answers`}
          icon={<TrendingUp className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Revision queue"
          value={summary.bookmarks + summary.savedQuestions}
          hint={`${summary.bookmarks} bookmarks · ${summary.savedQuestions} saved questions`}
          icon={<Bookmark className="h-5 w-5" aria-hidden />}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* Completion by category */}
        <Card className="p-6 lg:col-span-3">
          <h2 className="mb-4 font-semibold text-gray-900">Completions by section</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} interval={0} angle={-18} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} />
                <Tooltip cursor={{ fill: '#eef2ff' }} contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
                <Bar dataKey="completed" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent attempts */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-900">Recent quiz attempts</h2>
          {attempts.length === 0 ? (
            <p className="text-sm text-gray-500">No completed attempts yet — take your first quiz.</p>
          ) : (
            <ul className="space-y-3">
              {attempts.slice(0, 6).map((attempt) => (
                <li key={attempt.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3.5 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {attempt.score}/{attempt.totalQuestions} correct
                    </p>
                    <p className="text-xs text-gray-400">
                      {attempt.completedAt
                        ? new Date(attempt.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </p>
                  </div>
                  <Badge tone={(attempt.accuracy ?? 0) >= 60 ? 'green' : 'amber'}>{attempt.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Recent completions */}
      <Card className="p-6">
        <h2 className="mb-4 font-semibold text-gray-900">Recently completed</h2>
        {completions.length === 0 ? (
          <p className="text-sm text-gray-500">Mark content as complete while studying to build your history.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {completions.map((completion) => (
              <li key={completion.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                  <span className="truncate text-sm font-medium text-gray-900">{completion.content.title}</span>
                  <Badge tone="indigo">{completion.content.category}</Badge>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(completion.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
