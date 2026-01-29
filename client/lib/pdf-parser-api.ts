import { apiFetchJson } from "@/lib/api-client"

export type ApiResponse<T> = {
  statusCode?: number
  success?: boolean
  data: T
  message?: string
}

export type ParseFromUrlResponse = {
  material_id: string
  file_info: {
    original_filename?: string | null
    file_url: string
  }
  parsing_info: {
    total_pages: number
    total_tables: number
    total_images: number
    total_chunks: number
    pinecone_vectors_stored?: number
  }
  chunks_stored?: number
  pinecone_vectors_stored?: number
  indexed?: boolean
}

export async function apiParseFromUrl(
  input: { material_id: string; file_url: string },
  authToken?: string | null
) {
  return apiFetchJson<ApiResponse<ParseFromUrlResponse>>("/api/pdf-parser/parse-from-url", {
    method: "POST",
    body: JSON.stringify(input),
    authToken: authToken ?? null,
  })
}
