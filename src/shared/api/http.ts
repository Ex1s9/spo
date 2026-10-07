import { API_URL } from "@/shared/config"
import type { ApiError } from "@/shared/types"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

type Query = Record<string, string | number | string[] | undefined>

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue
    params.set(key, Array.isArray(value) ? value.join(",") : String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`
}

export async function http<T>(
  path: string,
  init: Omit<RequestInit, "body"> & { query?: Query; body?: unknown } = {},
): Promise<T> {
  const { query, body, headers, ...rest } = init
  const res = await fetch(buildUrl(path, query), {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as ApiError | null
    throw new HttpError(res.status, error?.message ?? `HTTP ${res.status}`)
  }

  return res.status === 204 ? (undefined as T) : res.json()
}
