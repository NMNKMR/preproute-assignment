import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AuthUser } from '@/api/types'
import { clearAuth, getToken, getUser, setAuth } from './storage'
import { loginRequest } from './api'

interface AuthContextValue {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (userId: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialise from storage so a refresh keeps the session.
  const [user, setUser] = useState<AuthUser | null>(() => getUser())
  const [token, setToken] = useState<string | null>(() => getToken())

  const login = useCallback(async (userId: string, password: string) => {
    const { token: newToken, user: newUser } = await loginRequest(
      userId,
      password,
    )
    setAuth(newToken, newUser)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(token),
      login,
      logout,
    }),
    [user, token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
