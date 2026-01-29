"use client"

import * as React from "react"
import type { AuthUser } from "@/lib/auth-api"
import { apiSignin, apiSignout, apiSignup } from "@/lib/auth-api"
import {
  clearStoredToken,
  clearStoredUser,
  getStoredToken,
  getStoredUser,
  setStoredToken,
  setStoredUser,
} from "@/lib/auth-storage"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  hydrateDone: boolean
  signup: (input: {
    full_name: string
    email: string
    password: string
    role?: "admin" | "student"
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  signin: (input: {
    email: string
    password: string
  }) => Promise<{ ok: true } | { ok: false; message: string }>
  signout: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [token, setToken] = React.useState<string | null>(null)
  const [hydrateDone, setHydrateDone] = React.useState(false)

  React.useEffect(() => {
    setUser(getStoredUser())
    setToken(getStoredToken())
    setHydrateDone(true)
  }, [])

  const signup: AuthContextValue["signup"] = React.useCallback(async input => {
    const res = await apiSignup(input)
    if (!res.ok) return { ok: false, message: res.message }
    return { ok: true }
  }, [])

  const signin: AuthContextValue["signin"] = React.useCallback(async input => {
    const res = await apiSignin(input)
    if (!res.ok) return { ok: false, message: res.message }

    // Backend returns: { success, data: user, accessToken, message }
    setUser(res.data.data)
    setToken(res.data.accessToken)
    setStoredUser(res.data.data)
    setStoredToken(res.data.accessToken)
    return { ok: true }
  }, [])

  const signout: AuthContextValue["signout"] = React.useCallback(async () => {
    const currentToken = getStoredToken()
    await apiSignout(currentToken) // even if it fails, we still clear local state
    clearStoredUser()
    clearStoredToken()
    setUser(null)
    setToken(null)
  }, [])

  const value: AuthContextValue = React.useMemo(
    () => ({ user, token, hydrateDone, signup, signin, signout }),
    [user, token, hydrateDone, signup, signin, signout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

