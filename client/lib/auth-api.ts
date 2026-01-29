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

export async function apiGetCurrentUser(authToken?: string | null) {
  return apiFetchJson<ApiResponse<AuthUser>>("/api/auth/me", {
    method: "GET",
    authToken: authToken ?? null,
  })
}

export async function apiUpdateProfile(
  input: { full_name: string },
  authToken?: string | null
) {
  return apiFetchJson<ApiResponse<AuthUser>>("/api/auth/update-profile", {
    method: "PUT",
    body: JSON.stringify(input),
    authToken: authToken ?? null,
  })
}

export async function apiChangePassword(
  input: { currentPassword: string; newPassword: string },
  authToken?: string | null
) {
  return apiFetchJson<ApiResponse<Record<string, never>>>("/api/auth/change-password", {
    method: "PUT",
    body: JSON.stringify(input),
    authToken: authToken ?? null,
  })
}

export async function apiUpdateProfilePicture(
  file: File,
  authToken?: string | null
) {
  const formData = new FormData()
  formData.append("avatar", file)

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
  const url = `${baseUrl}/api/auth/update-profile-picture`

  const headers = new Headers()
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: formData,
    credentials: "include",
  })

  const data = await res.json()
  
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to update profile picture" }
  }

  return { ok: true as const, data: data as ApiResponse<AuthUser> }
}

