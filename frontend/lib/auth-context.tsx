"use client"

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"
import { useRouter } from "next/navigation"

export type UserRole = "patient" | "professional"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AUTH_STORAGE_KEY = "bewell_session"
const API_BASE = "/api/v1"

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function getStoredSession(): { user: User; token: string } | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

function setStoredSession(user: User | null, token: string | null) {
  if (typeof window === "undefined") return
  if (user && token) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, token }))
  } else {
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  })
  const router = useRouter()

  useEffect(() => {
    const session = getStoredSession()
    if (session) {
      setState({ user: session.user, token: session.token, isLoading: false, isAuthenticated: true })
    } else {
      setState((s) => ({ ...s, isLoading: false }))
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // DEVELOPMENT BYPASS: Skip backend API call
      // Determine role based on email simply for testing
      const isDoc = email.toLowerCase().includes("doctor") || email.toLowerCase().includes("professional")
      const role: UserRole = isDoc ? "professional" : "patient"

      const user: User = {
        id: "mock_id_" + Date.now(),
        email: email || (isDoc ? "doctor@bewell.app" : "patient@bewell.app"),
        name: isDoc ? "Dr. Demo" : "Demo Patient",
        role: role,
      }
      const token = "mock_token_" + Date.now()

      setStoredSession(user, token)
      setState({ user, token: token, isLoading: false, isAuthenticated: true })
      return { success: true }
    } catch {
      return { success: false, error: "Network error. Is the backend running?" }
    }
  }, [])

  const signup = useCallback(
    async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_BASE}/auth/local/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          let errorMsg = "Signup failed. Please try again."
          if (err.detail) {
            if (Array.isArray(err.detail)) {
              errorMsg = err.detail[0]?.msg || JSON.stringify(err.detail)
            } else if (typeof err.detail === "string") {
              errorMsg = err.detail
            }
          }
          return { success: false, error: errorMsg }
        }

        const data = await res.json()
        const user: User = {
          id: String(data.user.id),
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
        }

        setStoredSession(user, data.token)
        setState({ user, token: data.token, isLoading: false, isAuthenticated: true })
        return { success: true }
      } catch {
        return { success: false, error: "Network error. Is the backend running?" }
      }
    },
    []
  )

  const logout = useCallback(() => {
    setStoredSession(null, null)
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false })
    router.push("/login")
  }, [router])

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (ctx === undefined) throw new Error("useAuth must be used within an AuthProvider")
  return ctx
}
