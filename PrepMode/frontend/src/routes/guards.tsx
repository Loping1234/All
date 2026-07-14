import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingState } from '@/components/common/ui'

function FullPageLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoadingState label="Loading PrepMode…" />
    </div>
  )
}

/** Learner-only routes. Unauthed -> /login, admin -> /403. */
export function RequireLearner() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'registered_learner') return <Navigate to="/403" replace />
  return <Outlet />
}

/** Admin-only routes. Unauthed -> /login, learner -> /403. */
export function RequireAdmin() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullPageLoading />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (user.role !== 'admin') return <Navigate to="/403" replace />
  return <Outlet />
}

/** /login and /signup redirect authenticated users to their home. */
export function RedirectIfAuthed() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageLoading />
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
  return <Outlet />
}
