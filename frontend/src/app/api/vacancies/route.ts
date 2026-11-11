import { NextResponse, type NextRequest } from "next/server"

import { getUserFromRequest, mockLatency } from "@/mocks/auth"
import { getVacancies } from "@/mocks/vacancies"
import { parseVacancyFilters } from "@/shared/api/vacancy-filters"
import type { VacanciesResponse } from "@/shared/types"

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
  }

  if (!user.permissions.includes("STATS_VIEW")) {
    return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  let filters
  try {
    filters = parseVacancyFilters(params)
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 })
  }
  const limit = params.has("limit") ? Number(params.get("limit")) : 20
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    return NextResponse.json({ message: "Лимит должен быть от 1 до 100" }, { status: 400 })
  }
  const filtered = getVacancies().filter((v) =>
    filters.directions.includes(v.direction) && filters.grades.includes(v.grade),
  )

  await mockLatency()
  return NextResponse.json<VacanciesResponse>({
    items: filtered.slice(0, limit),
    total: filtered.length,
  })
}
