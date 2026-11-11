"use client"

import { API_URL } from "@/shared/config"
import type { ApiError } from "@/shared/types"

import { getAccessToken, setAccessToken } from "./token-store"

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

type Query = Record<string, string | number | boolean | string[] | undefined>

function buildUrl(path: string, query?: Query) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value === undefined) continue
    params.set(key, Array.isArray(value) ? value.join(",") : String(value))
  }
  const qs = params.toString()
  return `${API_URL}${path}${qs ? `?${qs}` : ""}`
}

type Init = Omit<RequestInit, "body"> & { query?: Query; body?: unknown }

async function send(path: string, init: Init, token: string | null) {
  const { query, body, headers, ...rest } = init
  return fetch(buildUrl(path, query), {
    ...rest,
    credentials: "include",
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/**
 * Single-flight: если десять запросов одновременно поймали 401, обновление
 * запускается один раз, остальные ждут его результат. Иначе refresh-токен
 * ротируется параллельно сам с собой и вся сессия гасится как украденная.
 */
let refreshing: Promise<string | null> | null = null

function refreshAccessToken(): Promise<string | null> {
  refreshing ??= send("/auth/refresh", { method: "POST" }, null)
    .then(async (res) => {
      if (!res.ok) return null
      const session = (await res.json()) as { accessToken: string }
      setAccessToken(session.accessToken)
      return session.accessToken
    })
    .catch(() => null)
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

const AUTH_FREE_PATHS = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"]

export async function http<T>(path: string, init: Init = {}): Promise<T> {
  let res = await send(path, init, getAccessToken())

  if (res.status === 401 && !AUTH_FREE_PATHS.includes(path)) {
    const token = await refreshAccessToken()
    if (token) {
      res = await send(path, init, token)
    } else {
      setAccessToken(null)
    }
  }

  if (!res.ok) {
    const error = (await res.json().catch(() => null)) as ApiError | null
    throw new HttpError(res.status, error?.message ?? `HTTP ${res.status}`)
  }

  return res.status === 204 ? (undefined as T) : res.json()
}

export { refreshAccessToken }
