import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY } from '@/api/apiClient'
import { authApi } from '@/api/endpoints'
import type { ExamMode, User } from '@/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<User>
  signup: (name: string, email: string, password: string, defaultExamMode?: ExamMode) => Promise<User>
  logout: () => void
  setExamMode: (mode: ExamMode) => Promise<void>
  refreshUser: () => Promise<void>
  updateProfile: (body: Partial<Pick<User, 'name' | 'activeExamMode' | 'defaultExamMode'>>) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const hasToken = () => !!localStorage.getItem(TOKEN_KEY)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(hasToken)

  useEffect(() => {
    if (!hasToken()) return
    let cancelled = false
    authApi
      .me()
      .then((me) => {
        if (!cancelled) setUser(me)
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY)
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: nextUser } = await authApi.login({ email, password })
    localStorage.setItem(TOKEN_KEY, token)
    setUser(nextUser)
    return nextUser
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string, defaultExamMode?: ExamMode) => {
    const { token, user: nextUser } = await authApi.signup({ name, email, password, defaultExamMode })
    localStorage.setItem(TOKEN_KEY, token)
    setUser(nextUser)
    return nextUser
  }, [])

  const logout = useCallback(() => {
    void authApi.logout().catch(() => undefined)
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  const setExamMode = useCallback(async (mode: ExamMode) => {
    const updated = await authApi.updateMe({ activeExamMode: mode })
    setUser(updated)
  }, [])

  const refreshUser = useCallback(async () => {
    const me = await authApi.me()
    setUser(me)
  }, [])

  const updateProfile = useCallback(
    async (body: Partial<Pick<User, 'name' | 'activeExamMode' | 'defaultExamMode'>>) => {
      const updated = await authApi.updateMe(body)
      setUser(updated)
    },
    []
  )

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, setExamMode, refreshUser, updateProfile }),
    [user, loading, login, signup, logout, setExamMode, refreshUser, updateProfile]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
