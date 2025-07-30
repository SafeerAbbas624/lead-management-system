"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"

// Define our User type to match our database schema
interface User {
  id: number
  username: string
  fullName: string
  email: string
  role: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const isAuthenticated = !!user

  useEffect(() => {
    // Check if user is logged in from our custom auth
    const checkSession = async () => {
      try {
        console.log('Checking session...')
        const response = await fetch('/api/auth/me', {
          credentials: 'include' // Important for cookies
        })
        console.log('Session check response:', response.status)

        if (response.ok) {
          const data = await response.json()
          console.log('Session data:', data)
          setUser(data.user)
        } else {
          console.log('No valid session found')
          setUser(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    try {
      console.log('Attempting login for username:', username)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Important for cookies
      })

      const data = await response.json()
      console.log('Login response:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      if (data.success && data.user) {
        console.log('Setting user:', data.user)
        setUser(data.user)
        console.log('User set successfully - redirect will be handled by login page component')
        // Don't redirect here - let the login page component handle it
      } else {
        throw new Error('Invalid login response')
      }
    } catch (error: any) {
      console.error("Login failed:", error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      console.log('Logging out...')
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Important for cookies
      })
      console.log('Logout successful, clearing user state')
      setUser(null)
      console.log('Redirecting to login...')
      router.push("/login")
    } catch (error) {
      console.error("Logout failed:", error)
      // Even if logout fails, clear local state
      setUser(null)
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
