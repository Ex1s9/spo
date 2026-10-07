"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { http } from "@/shared/api/http"
import type { User } from "@/shared/types"

export type LoginPayload = { email: string; password: string }

export const authApi = {
  login: (body: LoginPayload) => http<User>("/auth/login", { method: "POST", body }),
  logout: () => http<void>("/auth/logout", { method: "POST" }),
  me: () => http<User>("/auth/me"),
}

export const meQueryKey = ["auth", "me"] as const

export function useMe() {
  return useQuery({ queryKey: meQueryKey, queryFn: authApi.me, retry: false })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => queryClient.setQueryData(meQueryKey, user),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      queryClient.clear()
      router.replace("/login")
    },
  })
}
