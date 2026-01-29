import { getApiBaseUrl } from "@/lib/api-client"

export type Material = {
  material_id: string
  course_id: string
  course_name?: string | null
  course_code?: string | null
  title: string
  description?: string | null
  category: "theory" | "lab"
  material_type: string
  file_url: string
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  week_number?: number | null
  topic?: string | null
  tags?: string[] | null
  view_count?: number | null
  download_count?: number | null
  uploaded_at: string
}

export type ApiResponse<T> = {
  statusCode?: number
  success?: boolean
  data: T
  message?: string
}

export type UploadMaterialData = {
  material_id: string
  file_info: {
    original_filename?: string | null
    file_url: string
  }
  parsing_info?: {
    total_pages?: number
    total_tables?: number
    total_images?: number
    total_chunks?: number
  }
}

export async function apiGetMaterials(params?: {
  course_id?: string
  category?: "theory" | "lab"
  week_number?: number
  topic?: string
  content_type?: string
  search?: string
  authToken?: string | null
}) {
  const baseUrl = getApiBaseUrl()
  const searchParams = new URLSearchParams()
  
  if (params?.course_id) searchParams.set("course_id", params.course_id)
  if (params?.category) searchParams.set("category", params.category)
  if (params?.week_number) searchParams.set("week_number", params.week_number.toString())
  if (params?.topic) searchParams.set("topic", params.topic)
  if (params?.content_type) searchParams.set("content_type", params.content_type)
  if (params?.search) searchParams.set("search", params.search)

  const query = searchParams.toString()
  const url = `${baseUrl}/api/materials${query ? `?${query}` : ""}`

  const headers = new Headers()
  if (params?.authToken) headers.set("Authorization", `Bearer ${params.authToken}`)

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to fetch materials" }
  }

  return { ok: true as const, data: data as ApiResponse<Material[]> }
}

export async function apiGetMaterialById(materialId: string, authToken?: string | null) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/materials/${materialId}`

  const headers = new Headers()
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to fetch material" }
  }

  return { ok: true as const, data: data as ApiResponse<Material> }
}

export async function apiBrowseMaterialsByCategory(
  category: "theory" | "lab",
  params?: { course_id?: string; authToken?: string | null }
) {
  const baseUrl = getApiBaseUrl()
  const searchParams = new URLSearchParams()
  if (params?.course_id) searchParams.set("course_id", params.course_id)

  const query = searchParams.toString()
  const url = `${baseUrl}/api/materials/browse/${category}${query ? `?${query}` : ""}`

  const headers = new Headers()
  if (params?.authToken) headers.set("Authorization", `Bearer ${params.authToken}`)

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to browse materials" }
  }

  return { ok: true as const, data: data as ApiResponse<Material[]> }
}

export async function apiGetMaterialsByWeek(
  weekNumber: number,
  params?: { course_id?: string; authToken?: string | null }
) {
  const baseUrl = getApiBaseUrl()
  const searchParams = new URLSearchParams()
  if (params?.course_id) searchParams.set("course_id", params.course_id)

  const query = searchParams.toString()
  const url = `${baseUrl}/api/materials/week/${weekNumber}${query ? `?${query}` : ""}`

  const headers = new Headers()
  if (params?.authToken) headers.set("Authorization", `Bearer ${params.authToken}`)

  const res = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to fetch materials by week" }
  }

  return { ok: true as const, data: data as ApiResponse<Material[]> }
}

export async function apiTrackDownload(materialId: string, authToken?: string | null) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/materials/${materialId}/download`

  const headers = new Headers()
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "POST",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to track download" }
  }

  return { ok: true as const, data: data as ApiResponse<{ file_url: string }> }
}

export async function apiUploadMaterial(
  formData: FormData,
  authToken?: string | null
) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/materials/upload`

  const headers = new Headers()
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  })

  const contentType = res.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => "")

  if (!res.ok) {
    const message =
      typeof payload === "string"
        ? payload || "Failed to upload material"
        : payload?.message || "Failed to upload material"
    return { ok: false as const, status: res.status, message }
  }

  return { ok: true as const, data: payload as ApiResponse<UploadMaterialData> }
}

export async function apiUpdateMaterial(
  materialId: string,
  input: {
    title?: string
    description?: string
    category?: "theory" | "lab"
    week_number?: number
    topic?: string
    tags?: string[]
    programming_language?: string
    is_public?: boolean
  },
  authToken?: string | null
) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/materials/${materialId}`

  const headers = new Headers()
  headers.set("Content-Type", "application/json")
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to update material" }
  }

  return { ok: true as const, data: data as ApiResponse<Material> }
}

export async function apiDeleteMaterial(materialId: string, authToken?: string | null) {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/materials/${materialId}`

  const headers = new Headers()
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`)

  const res = await fetch(url, {
    method: "DELETE",
    headers,
    credentials: "include",
  })

  const data = await res.json()
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data.message || "Failed to delete material" }
  }

  return { ok: true as const, data: data as ApiResponse<Record<string, never>> }
}
