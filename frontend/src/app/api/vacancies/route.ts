import { NextResponse, type NextRequest } from "next/server"

import { getUserFromRequest, mockLatency } from "@/mocks/auth"
import { getVacancies } from "@/mocks/vacancies"
import { DIRECTION_IDS, isDirectionId } from "@/shared/config"
import type { VacanciesResponse } from "@/shared/types"

export async function GET(request: NextRequest) {
  if (!getUserFromRequest(request)) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const directions = (params.get("directions") ?? DIRECTION_IDS.join(","))
    .split(",")
    .filter(isDirectionId)
  const limit = Math.min(Number(params.get("limit")) || 20, 100)

  const filtered = getVacancies().filter((v) => directions.includes(v.direction))

  await mockLatency()
  return NextResponse.json<VacanciesResponse>({
    items: filtered.slice(0, limit),
    total: filtered.length,
  })
}
