import { NextResponse, type NextRequest } from "next/server"

import { getUserFromRequest } from "@/mocks/auth"

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
  }
  return NextResponse.json(user)
}
