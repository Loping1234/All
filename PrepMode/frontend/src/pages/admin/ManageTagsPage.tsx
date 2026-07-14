import { useQuery } from '@tanstack/react-query'
import { Tags } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '@/components/common/ui'

function TagGroup({ title, rows }: { title: string; rows: { tag: string; count: number }[] }) {
  return (
    <Card className="p-6">
      <h2 className="mb-4 font-semibold text-gray-900">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No tags in use yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {rows.map((row) => (
            <span
              key={row.tag}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700"
            >
              {row.tag}
              <Badge tone="indigo">{row.count}</Badge>
            </span>
          ))}
        </div>
      )}
    </Card>
  )
}

/** Read-only tag usage across content and questions. */
export default function ManageTagsPage() {
  const tagsQuery = useQuery({ queryKey: ['admin', 'tags'], queryFn: adminApi.listTags })

  if (tagsQuery.isLoading) return <LoadingState label="Loading tags…" />
  if (tagsQuery.isError) {
    return <ErrorState message={getApiErrorMessage(tagsQuery.error)} onRetry={() => void tagsQuery.refetch()} />
  }

  const tags = tagsQuery.data
  if (!tags) return null

  const empty =
    tags.contentSubjectTags.length === 0 && tags.contentTopicTags.length === 0 && tags.questionTopicTags.length === 0

  return (
    <div>
      <PageHeader
        title="Manage Tags"
        description="Tag usage across content and questions. Tags are managed inline on each item; this view shows what is in use."
      />
      {empty ? (
        <EmptyState
          icon={<Tags className="h-10 w-10" />}
          title="No tags yet"
          description="Tags appear here as you classify content and questions."
        />
      ) : (
        <div className="space-y-6">
          <TagGroup title="Content subject tags" rows={tags.contentSubjectTags} />
          <TagGroup title="Content topic tags" rows={tags.contentTopicTags} />
          <TagGroup title="Question topic tags" rows={tags.questionTopicTags} />
        </div>
      )}
    </div>
  )
}
