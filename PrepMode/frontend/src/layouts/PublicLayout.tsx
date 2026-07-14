import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo } from '@/components/common/Logo'
import { Button } from '@/components/common/ui'
import { useAuth } from '@/hooks/useAuth'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/exam-modes', label: 'Exam Modes' },
  { to: '/about', label: 'About' },
]

export default function PublicLayout() {
  const { user } = useAuth()
  const homePath = user ? (user.role === 'admin' ? '/admin' : '/dashboard') : null

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" aria-label="PrepMode home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {homePath ? (
              <Link to={homePath}>
                <Button size="md">Open workspace</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Log in
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="md">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
          <Logo className="opacity-80" />
          <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-500" aria-label="Footer">
            <Link to="/exam-modes" className="hover:text-gray-900">
              Exam Modes
            </Link>
            <Link to="/about" className="hover:text-gray-900">
              About
            </Link>
            <Link to="/login" className="hover:text-gray-900">
              Log in
            </Link>
            <Link to="/signup" className="hover:text-gray-900">
              Sign up
            </Link>
          </nav>
          <p className="text-xs text-gray-400">English + GK. One goal. Many exams.</p>
        </div>
      </footer>
    </div>
  )
}
