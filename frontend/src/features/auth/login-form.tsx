"use client"

import { useRouter, useSearchParams } from "next/navigation"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { useLogin } from "./api"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const login = useLogin()

  const next = searchParams.get("next")
  const redirectTo = next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    login.mutate(
      { email: String(form.get("email")), password: String(form.get("password")) },
      { onSuccess: () => router.replace(redirectTo) },
    )
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-xl">Вход</CardTitle>
        <CardDescription>
          Аналитика востребованности IT-вакансий
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
          {login.error && (
            <p role="alert" className="text-sm text-destructive">
              {login.error.message}
            </p>
          )}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Входим…" : "Войти"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Демо-доступ: demo@spo.dev / demo1234
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
