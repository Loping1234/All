import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FilePlus2, FileText, Inbox, ListPlus, Users } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Button, Card, ErrorState, LoadingState, PageHeader, StatCard } from '@/components/common/ui'
import { statusTone } from '@/components/common/tones'

const quickActions = [
  { to: '/admin/content/new', label: 'Add Content', icon: FilePlus2 },
  { to: '/admin/current-affairs/new', label: 'Add Current Affairs', icon: FilePlus2 },
  { to: '/admin/editorials/new', label: 'Add Editorial', icon: FilePlus2 },
  { to: '/admin/quizzes/new', label: 'Add Quiz', icon: ListPlus },
  { to: '/admin/source-inbox', label: 'Source Inbox', icon: Inbox },
  { to: '/admin/users', label: 'Manage Users', icon: Users },
]

export default function AdminDashboardPage() {
  const overviewQuery = useQuery({ queryKey: ['admin', 'overview'], queryFn: adminApi.overview })

  if (overviewQuery.isLoading) return <LoadingState label="Loading admin overview…" />
  if (overviewQuery.isError) {
    return <ErrorState message={getApiErrorMessage(overviewQuery.error)} onRetry={() => void overviewQuery.refetch()} />
  }

  const overview = overviewQuery.data
  if (!overview) return null

  const categoryRows = Object.entries(overview.contentByCategory)

  return (
    <div>
      <PageHeader title="Admin Dashboard" description="Overview of content, activity, and platform health." />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total content"
          value={overview.content.total}
          hint={`${overview.content.published} published`}
          icon={<FileText className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Quiz questions"
          value={overview.questions.total}
          hint={`${overview.questions.published} published`}
          icon={<ListPlus className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Source inbox"
          value={overview.sources.new}
          hint={`${overview.sources.selected} selected · ${overview.sources.ignored} ignored`}
          icon={<Inbox className="h-5 w-5" aria-hidden />}
        />
        <StatCard
          label="Learners"
          value={overview.learners}
          hint={`${overview.completedAttempts} completed attempts`}
          icon={<Users className="h-5 w-5" aria-hidden />}
        />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        {/* Content status */}
        <Card className="p-6 lg:col-span-2">
          <h2 className="mb-4 font-semibold text-gray-900">Content status</h2>
          <ul className="space-y-3">
            {(
              [
                ['Published', overview.content.published, 'published'],
                ['Draft', overview.content.draft, 'draft'],
                ['Archived', overview.content.archived, 'archived'],
              ] as const
            ).map(([label, count, status]) => (
              <li key={label} className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-2.5">
                <Badge tone={statusTone(status)}>{label}</Badge>
                <span className="text-sm font-bold text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
          <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-gray-400">By category</h3>
          <ul className="space-y-1.5">
            {categoryRows.map(([category, count]) => (
              <li key={category} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{category}</span>
                <span className="font-medium text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Recent publishing activity */}
        <Card className="p-6 lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent publishing activity</h2>
            <Link to="/admin/content" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          {overview.recentContent.length === 0 ? (
            <p className="text-sm text-gray-500">No content yet — create your first item.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {overview.recentContent.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {item.category} · {item.contentType} ·{' '}
                      {new Date(item.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <Badge tone={statusTone(item.status)}>{item.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.to + action.label} to={action.to}>
              <Button variant="outline">
                <action.icon className="h-4 w-4 text-primary-600" aria-hidden />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
