import { getApiBaseUrl } from "@/lib/api-client"

export type SourceMaterial = {
  material: string
  page: number | null
  category: string
}

export type EnhancedContentResponse = {
  title: string
  description: string
  metadata: {
    course_id: string
    user_prompt: string
    sources_used: number
    source_materials: SourceMaterial[]
    model: string
  }
}

export type ApiResponse<T> = {
  statusCode: number
  data: T
  message: string
  success?: boolean
}

/**
 * Generate enhanced content (returns JSON with title + description)
 */
export async function apiGenerateEnhancedContent(
  input: { course_id: string; user_prompt: string },
  authToken?: string | null
): Promise<{ ok: true; data: ApiResponse<EnhancedContentResponse> } | { ok: false; message: string }> {
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/content/generate-enhanced`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      const errorData = await res.json().catch(() => null)
      return {
        ok: false,
        message: errorData?.message || `Request failed with status ${res.status}`,
      }
    }

    const data = await res.json()
    return { ok: true, data }
  } catch (error: any) {
    return { ok: false, message: error.message || "Network error" }
  }
}

/**
 * Generate PDF (returns blob for download)
 */
export async function apiGeneratePDF(
  input: { course_id: string; user_prompt: string },
  authToken?: string | null
): Promise<{ ok: true; blob: Blob; filename: string } | { ok: false; message: string }> {
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/content/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify(input),
    })

    if (!res.ok) {
      // Try to parse error as JSON
      const contentType = res.headers.get("content-type") || ""
      if (contentType.includes("application/json")) {
        const errorData = await res.json().catch(() => null)
        return {
          ok: false,
          message: errorData?.message || `Request failed with status ${res.status}`,
        }
      }
      return { ok: false, message: `Request failed with status ${res.status}` }
    }

    // Get filename from Content-Disposition header
    const contentDisposition = res.headers.get("content-disposition") || ""
    const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/)
    const filename = filenameMatch ? filenameMatch[1] : `course-material-${Date.now()}.pdf`

    const blob = await res.blob()
    return { ok: true, blob, filename }
  } catch (error: any) {
    return { ok: false, message: error.message || "Network error" }
  }
}
