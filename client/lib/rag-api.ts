import { apiFetchJson } from "@/lib/api-client"

export type RagSource = {
  source_number: number
  material: string
  category?: string
  page?: number
  chunk_type?: string
  is_code?: boolean
  language?: string
  topic?: string
  week?: number
  excerpt: string
}

export type RagChatResponse = {
  question: string
  answer: string
  sources: RagSource[]
  metadata: {
    chunks_found: number
    tokens_used?: number
    course_id?: string
    material_id?: string
    category?: string
    filters_applied: number
    is_lab_content: boolean
  }
}

export type RagChatInput = {
  question: string
  course_id?: string
  material_id?: string
  category?: "theory" | "lab"
  week_number?: number
  top_k?: number
}

export async function apiRagChat(
  input: RagChatInput,
  authToken?: string | null
) {
  return apiFetchJson<{ statusCode: number; data: RagChatResponse; message: string }>(
    "/api/rag/chat",
    {
      method: "POST",
      body: JSON.stringify(input),
      authToken: authToken ?? null,
    }
  )
}
