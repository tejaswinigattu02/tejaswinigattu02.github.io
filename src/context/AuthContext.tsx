import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type User = {
  sub: string
  name: string
  email: string
  email_verified: boolean
}

type AuthContextType = {
  user: User | null
  loading: boolean
  authenticated: boolean
  setUser: (user: User | null) => void
  login: () => void
  logout: () => void
}

const AUTH_URL = 'https://upsilonlabs-auth.gattucharanteja8143.workers.dev'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${AUTH_URL}/me`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('not authenticated')
        return res.json()
      })
      .then((data) => {
        if (data.authenticated) setUser(data.user)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = () => {
    window.location.href = `${AUTH_URL}/auth`
  }

  const logout = () => {
    window.location.href = `${AUTH_URL}/logout`
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, authenticated: !!user, setUser, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
