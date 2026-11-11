import { NextResponse, type NextRequest } from "next/server"

import { authenticate, createToken, mockLatency } from "@/mocks/auth"
import { SESSION_COOKIE } from "@/shared/config"

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as {
    email?: unknown
    password?: unknown
  } | null

  await mockLatency()

  if (typeof body?.email !== "string" || typeof body?.password !== "string") {
    return NextResponse.json({ message: "Укажите email и пароль" }, { status: 400 })
  }

  const user = authenticate(body.email, body.password)
  if (!user) {
    return NextResponse.json({ message: "Неверный email или пароль" }, { status: 401 })
  }

  const response = NextResponse.json({ accessToken: "mock", expiresIn: 900, user })
  response.cookies.set(SESSION_COOKIE, createToken(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })
  return response
}
