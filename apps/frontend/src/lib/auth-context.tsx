"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient, type AuthTokens } from "./api"

interface AuthContextType {
  user: AuthTokens["user"] | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, phone: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => void
  verifyOtp: (contact: string, code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthTokens["user"] | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      const tokens = localStorage.getItem("auth_tokens")
      if (tokens) {
        try {
          const currentUser = await apiClient.getCurrentUser()
          setUser(currentUser)
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem("auth_tokens")
        }
      }
      setIsLoading(false)
    }

    // Only check auth if we're on a protected route or have tokens
    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    const result = await apiClient.login(email, password)
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    )
    setUser(result.user)
  }

  const register = async (email: string, phone: string, password: string, firstName?: string, lastName?: string) => {
    const result = await apiClient.register(email, phone, password, firstName, lastName)
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    )
    setUser(result.user)
  }

  const verifyOtp = async (contact: string, code: string) => {
    const result = await apiClient.verifyOtp(contact, code)
    localStorage.setItem(
      "auth_tokens",
      JSON.stringify({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      }),
    )
    setUser(result.user)
  }

  const logout = () => {
    localStorage.removeItem("auth_tokens")
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        verifyOtp,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
