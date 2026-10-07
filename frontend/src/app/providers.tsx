"use client"

import { QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ThemeProvider } from "next-themes"
import { useState, type ReactNode } from "react"

import { Toaster } from "@/components/ui/sonner"
import { authApi } from "@/features/auth/api"
import { HttpError } from "@/shared/api/http"

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [queryClient] = useState(() => {
    const client: QueryClient = new QueryClient({
      queryCache: new QueryCache({
        onError: async (error) => {
          const { pathname } = window.location
          if (error instanceof HttpError && error.status === 401 && pathname !== "/login") {
            await authApi.logout().catch(() => {})
            client.clear()
            router.replace(`/login?next=${encodeURIComponent(pathname)}`)
          }
        },
      }),
      defaultOptions: {
        queries: {
          staleTime: 60_000,
          refetchOnWindowFocus: false,
          retry: (count, error) =>
            !(error instanceof HttpError && error.status < 500) && count < 2,
        },
      },
    })
    return client
  })

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
