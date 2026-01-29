import { apiFetchJson } from "@/lib/api-client"

export type UserRole = "admin" | "student"

export type AuthUser = {
  user_id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string | null
  created_at?: string
}

export type LoginResponse = {
  success: boolean
  data: AuthUser
  accessToken: string
  message?: string
}

export type ApiResponse<T> = {
  statusCode?: number
  success?: boolean
  data: T
  message?: string
}

export async function apiSignup(input: {
  full_name: string
  email: string
  password: string
  role?: UserRole
}) {
  return apiFetchJson<ApiResponse<AuthUser>>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function apiSignin(input: { email: string; password: string }) {
  // Note: backend route is `/api/auth/signin` (not `/login`)
  return apiFetchJson<LoginResponse>("/api/auth/signin", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function apiSignout(authToken?: string | null) {
  return apiFetchJson<ApiResponse<Record<string, never>>>("/api/auth/signout", {
    method: "POST",
    authToken: authToken ?? null,
  })
}

