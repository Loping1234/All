import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, Users } from 'lucide-react'
import { adminApi } from '@/api/endpoints'
import { getApiErrorMessage } from '@/api/apiClient'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  PageHeader,
  Select,
} from '@/components/common/ui'

export default function ManageUsersPage() {
  const [role, setRole] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const params = useMemo(
    () => ({ role: role || undefined, search: search || undefined, page, pageSize: 15 }),
    [role, search, page]
  )

  const usersQuery = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => adminApi.listUsers(params),
    placeholderData: keepPreviousData,
  })

  const users = usersQuery.data?.users ?? []
  const meta = usersQuery.data?.meta

  return (
    <div>
      <PageHeader title="Manage Users" description="All registered accounts on PrepMode." />

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
            placeholder="Search by name or email…"
            className="pl-9"
            aria-label="Search users"
          />
        </form>
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }} aria-label="Role">
          <option value="">All roles</option>
          <option value="registered_learner">Learners</option>
          <option value="admin">Admins</option>
        </Select>
      </Card>

      {usersQuery.isLoading && <LoadingState label="Loading users…" />}
      {usersQuery.isError && (
        <ErrorState message={getApiErrorMessage(usersQuery.error)} onRetry={() => void usersQuery.refetch()} />
      )}

      {usersQuery.isSuccess && users.length === 0 && (
        <EmptyState icon={<Users className="h-10 w-10" />} title="No users match these filters" />
      )}

      {users.length > 0 && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Default mode</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                        {user.name.slice(0, 1).toUpperCase()}
                      </span>
                      <span className="font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{user.email}</td>
                  <td className="px-3 py-3">
                    <Badge tone={user.role === 'admin' ? 'purple' : 'indigo'}>
                      {user.role === 'admin' ? 'Admin' : 'Learner'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <Badge tone={user.status === 'active' ? 'green' : 'red'}>{user.status}</Badge>
                  </td>
                  <td className="px-3 py-3 text-gray-600">{user.defaultExamMode}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-gray-500">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
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
