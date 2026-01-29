import { getApiBaseUrl } from "@/lib/api-client"

export type TextEvaluation = {
  confidence_score: number
  accuracy_score: number
  clarity_score: number
  explanation: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export type CodeEvaluation = {
  confidence_score: number
  code_quality_score: number
  explanation: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
}

export type TextValidationResponse = {
  content_type: "text"
  evaluation: TextEvaluation
  overall_confidence: number
  metadata: {
    content_length: number
    evaluated_at: string
  }
}

export type CodeValidationResponse = {
  content_type: "code"
  language: string
  compilation: {
    success: boolean
    hasCompilationError: boolean
    hasRuntimeError: boolean
    output: string
    stderr: string
    compileOutput: string | null
    exitCode: number
  }
  evaluation: CodeEvaluation
  overall_confidence: number
  metadata: {
    compiled_successfully: boolean
    has_errors: boolean
    evaluated_at: string
  }
}

export type ApiResponse<T> = {
  statusCode: number
  data: T
  message: string
  success?: boolean
}

/**
 * Validate text content
 */
export async function apiValidateText(
  input: { content: string; context?: string },
  authToken?: string | null
): Promise<{ ok: true; data: ApiResponse<TextValidationResponse> } | { ok: false; message: string }> {
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/validation/validate-text`, {
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
 * Validate code content
 */
export async function apiValidateCode(
  input: { code: string; language: string },
  authToken?: string | null
): Promise<{ ok: true; data: ApiResponse<CodeValidationResponse> } | { ok: false; message: string }> {
  try {
    const baseUrl = getApiBaseUrl()
    const res = await fetch(`${baseUrl}/api/validation/validate-code`, {
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
