import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  FilePlus2,
  FileText,
  Inbox,
  LayoutDashboard,
  ListPlus,
  LogOut,
  Menu,
  Newspaper,
  PenSquare,
  Tags,
  Users,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import { Logo } from '@/components/common/Logo'
import { useAuth } from '@/hooks/useAuth'

const navItems = [
  { to: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/content', label: 'Manage Content', icon: FileText, end: true },
  { to: '/admin/content/new', label: 'Add Content', icon: FilePlus2, end: true },
  { to: '/admin/current-affairs/new', label: 'Add Current Affairs', icon: Newspaper, end: true },
  { to: '/admin/editorials/new', label: 'Add Editorial', icon: PenSquare, end: true },
  { to: '/admin/quizzes/new', label: 'Add Quiz', icon: ListPlus, end: true },
  { to: '/admin/source-inbox', label: 'Source Inbox', icon: Inbox, end: true },
  { to: '/admin/tags', label: 'Manage Tags', icon: Tags, end: true },
  { to: '/admin/users', label: 'Manage Users', icon: Users, end: true },
]

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex-1 space-y-0.5 px-3" aria-label="Admin">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-100 text-primary-700'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            )
          }
        >
          <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-gray-200 bg-gray-50/80 lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/admin" aria-label="PrepMode admin">
            <Logo />
          </Link>
        </div>
        <div className="mx-5 mb-3 rounded-lg bg-primary-50 px-3 py-1.5 text-center text-xs font-semibold uppercase tracking-wide text-primary-700">
          Admin Panel
        </div>
        <SidebarNav />
        <div className="border-t border-gray-200 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            <LogOut className="h-4.5 w-4.5" aria-hidden />
            Log out
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-gray-900/40" onClick={() => setMobileOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-gray-50">
            <div className="flex h-16 items-center justify-between px-5">
              <Logo />
              <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-1 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-gray-200 p-3">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              >
                <LogOut className="h-4.5 w-4.5" aria-hidden />
                Log out
              </button>
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-medium text-gray-500">PrepMode content management</span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-gray-200 py-1 pl-1 pr-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
              {(user?.name ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <span className="hidden max-w-32 truncate text-sm font-medium text-gray-700 sm:block">{user?.name}</span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
