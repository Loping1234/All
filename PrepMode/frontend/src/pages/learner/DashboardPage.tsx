import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ListChecks,
  Newspaper,
  TrendingUp,
} from 'lucide-react'
import { contentApi, progressApi } from '@/api/endpoints'
import { useAuth } from '@/hooks/useAuth'
import { Badge, Button, Card, LoadingState, StatCard } from '@/components/common/ui'
import { ContentCard } from '@/components/content/ContentBrowse'
import { ContentDetailModal } from '@/components/content/ContentDetailModal'

export default function DashboardPage() {
  const { user } = useAuth()
  const examMode = user?.activeExamMode ?? 'All'
  const [openContentId, setOpenContentId] = useState<string | null>(null)

  const summaryQuery = useQuery({
    queryKey: ['progress', 'summary'],
    queryFn: progressApi.summary,
  })

  const englishQuery = useQuery({
    queryKey: ['content', 'dash-english', examMode],
    queryFn: () => contentApi.list({ category: 'English,Vocabulary', examMode, pageSize: 3 }),
  })

  const awarenessQuery = useQuery({
    queryKey: ['content', 'dash-awareness', examMode],
    queryFn: () => contentApi.list({ category: 'GK,Current Affairs,Editorials', examMode, pageSize: 3 }),
  })

  const summary = summaryQuery.data

  return (
    <div>
      {/* Welcome band */}
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-gradient-to-r from-primary-600 to-primary-500 p-6 text-white">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] ?? 'Aspirant'} 👋</h1>
          <p className="mt-1 text-sm text-primary-100">
            Consistency builds success. You're studying in <span className="font-semibold">{examMode}</span> mode.
          </p>
        </div>
        <Link to="/quizzes">
          <Button className="bg-white text-primary-700 hover:bg-primary-50">
            Start a quiz
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        </Link>
      </Card>

      {/* Progress summary */}
      {summaryQuery.isLoading ? (
        <LoadingState label="Loading your progress…" />
      ) : (
        summary && (
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Content completed"
              value={summary.completedContent}
              icon={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            />
            <StatCard
              label="Quiz accuracy"
              value={`${summary.overallAccuracy}%`}
              hint={`${summary.quizAttempts} attempts`}
              icon={<TrendingUp className="h-5 w-5" aria-hidden />}
            />
            <StatCard
              label="Bookmarks"
              value={summary.bookmarks}
              icon={<Bookmark className="h-5 w-5" aria-hidden />}
            />
            <StatCard
              label="Saved questions"
              value={summary.savedQuestions}
              icon={<ListChecks className="h-5 w-5" aria-hidden />}
            />
          </div>
        )
      )}

      {/* Today's English */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <BookOpen className="h-5 w-5 text-primary-600" aria-hidden /> Today's English
          </h2>
          <Link to="/english" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        {englishQuery.data && englishQuery.data.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {englishQuery.data.items.map((item) => (
              <ContentCard key={item.id} item={item} onOpen={setOpenContentId} />
            ))}
          </div>
        ) : (
          englishQuery.isSuccess && <p className="text-sm text-gray-500">No English content yet for this mode.</p>
        )}
      </section>

      {/* Today's awareness */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Newspaper className="h-5 w-5 text-primary-600" aria-hidden /> Today's Awareness
          </h2>
          <Link to="/current-affairs" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            View all
          </Link>
        </div>
        {awarenessQuery.data && awarenessQuery.data.items.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {awarenessQuery.data.items.map((item) => (
              <ContentCard key={item.id} item={item} onOpen={setOpenContentId} />
            ))}
          </div>
        ) : (
          awarenessQuery.isSuccess && <p className="text-sm text-gray-500">No awareness content yet for this mode.</p>
        )}
      </section>

      {/* Quick links */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link to="/revision">
          <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-card-hover">
            <div>
              <h3 className="font-semibold text-gray-900">Revision queue</h3>
              <p className="mt-0.5 text-sm text-gray-500">Bookmarks and saved questions in one place</p>
            </div>
            <Badge tone="indigo">{(summary?.bookmarks ?? 0) + (summary?.savedQuestions ?? 0)}</Badge>
          </Card>
        </Link>
        <Link to="/editorials">
          <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-card-hover">
            <div>
              <h3 className="font-semibold text-gray-900">Editorial analysis</h3>
              <p className="mt-0.5 text-sm text-gray-500">Argument structure and vocabulary in context</p>
            </div>
            <GraduationCap className="h-5 w-5 text-primary-500" aria-hidden />
          </Card>
        </Link>
        <Link to="/progress">
          <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-card-hover">
            <div>
              <h3 className="font-semibold text-gray-900">Progress</h3>
              <p className="mt-0.5 text-sm text-gray-500">Completions, attempts, and accuracy</p>
            </div>
            <TrendingUp className="h-5 w-5 text-primary-500" aria-hidden />
          </Card>
        </Link>
      </section>

      <ContentDetailModal contentId={openContentId} onClose={() => setOpenContentId(null)} />
    </div>
  )
}
