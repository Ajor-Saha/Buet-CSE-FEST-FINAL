export type ApiOk<T> = { ok: true; data: T }
export type ApiErr = {
  ok: false
  status: number
  message: string
  details?: unknown
}

const DEFAULT_BASE_URL = "http://localhost:8000"

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || DEFAULT_BASE_URL
}

function toMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Request failed"
  const anyPayload = payload as any
  return (
    anyPayload?.message ||
    anyPayload?.error ||
    anyPayload?.msg ||
    "Request failed"
  )
}

export async function apiFetchJson<T>(
  path: string,
  init?: RequestInit & { authToken?: string | null },
): Promise<ApiOk<T> | ApiErr> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`

  const headers = new Headers(init?.headers)
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json")
  if (init?.authToken) headers.set("Authorization", `Bearer ${init.authToken}`)

  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers,
      credentials: "include",
    })
  } catch (e) {
    return { ok: false, status: 0, message: "Network error", details: e }
  }

  const contentType = res.headers.get("content-type") || ""
  const isJson = contentType.includes("application/json")
  const payload = isJson ? await res.json().catch(() => null) : await res.text()

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      message: toMessage(payload),
      details: payload,
    }
  }

  return { ok: true, data: payload as T }
}

