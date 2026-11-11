"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { http, refreshAccessToken } from "@/shared/api/http"
import { setAccessToken } from "@/shared/api/token-store"
import type { Permission, RoleCode, Session, User } from "@/shared/types"

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = LoginPayload & { name: string }

export const authApi = {
  login: (body: LoginPayload) => http<Session>("/auth/login", { method: "POST", body }),
  register: (body: RegisterPayload) => http<Session>("/auth/register", { method: "POST", body }),
  logout: () => http<void>("/auth/logout", { method: "POST" }),
  me: () => http<User>("/auth/me"),
}

export const meQueryKey = ["auth", "me"] as const

/**
 * При первом монтировании access-токена в памяти нет (перезагрузка страницы),
 * поэтому сначала пробуем поднять сессию по refresh-cookie, затем уже спрашиваем /me.
 */
export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      await refreshAccessToken()
      return authApi.me()
    },
    retry: false,
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      setAccessToken(session.accessToken)
      queryClient.setQueryData(meQueryKey, session.user)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (session) => {
      setAccessToken(session.accessToken)
      queryClient.setQueryData(meQueryKey, session.user)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setAccessToken(null)
      queryClient.clear()
      router.replace("/login")
    },
  })
}

/** Проверка права на клиенте — только для показа и скрытия UI. Решение всё равно принимает бэкенд. */
export function useHasPermission() {
  const { data: user } = useMe()
  return (permission: Permission) => Boolean(user?.permissions.includes(permission))
}

export function useHasRole() {
  const { data: user } = useMe()
  return (role: RoleCode) => Boolean(user?.roles.includes(role))
}
