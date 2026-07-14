import { Link } from 'react-router-dom'
import { ShieldAlert, ServerCrash, Compass } from 'lucide-react'
import { Button } from '@/components/common/ui'
import { useAuth } from '@/hooks/useAuth'
import type { ReactNode } from 'react'

function ErrorShell({ icon, code, title, text }: { icon: ReactNode; code: string; title: string; text: string }) {
  const { user } = useAuth()
  const homePath = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mb-5 text-gray-300">{icon}</div>
      <p className="text-sm font-semibold uppercase tracking-wider text-primary-600">{code}</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">{title}</h1>
      <p className="mt-2 max-w-md text-gray-500">{text}</p>
      <Link to={homePath} className="mt-6">
        <Button>Go to your home</Button>
      </Link>
    </div>
  )
}

export function ForbiddenPage() {
  return (
    <ErrorShell
      icon={<ShieldAlert className="h-14 w-14" />}
      code="403"
      title="You don't have access to this area"
      text="This page belongs to a different role. If you think this is a mistake, log in with the right account."
    />
  )
}

export function ServerErrorPage() {
  return (
    <ErrorShell
      icon={<ServerCrash className="h-14 w-14" />}
      code="500"
      title="Something went wrong on our side"
      text="The server hit an unexpected problem. Please try again in a moment."
    />
  )
}

export function NotFoundPage() {
  return (
    <ErrorShell
      icon={<Compass className="h-14 w-14" />}
      code="404"
      title="Page not found"
      text="The page you're looking for doesn't exist or may have moved."
    />
  )
}
