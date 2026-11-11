import { NextResponse, type NextRequest } from "next/server"
import { getUserFromRequest, mockLatency } from "@/mocks/auth"
import { getVacancies } from "@/mocks/vacancies"
import { parseVacancyFilters } from "@/shared/api/vacancy-filters"
import { isPeriod } from "@/shared/config"
import { aggregateSkills } from "@/shared/lib/skill-demand"

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
  if (!user.permissions.includes("STATS_VIEW")) {
    return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 })
  }
  const period = request.nextUrl.searchParams.get("period") ?? "month"
  if (!isPeriod(period)) return NextResponse.json({ message: "Неизвестный период" }, { status: 400 })
  let filters
  try {
    filters = parseVacancyFilters(request.nextUrl.searchParams)
  } catch (error) {
    return NextResponse.json({ message: (error as Error).message }, { status: 400 })
  }
  await mockLatency()
  return NextResponse.json(aggregateSkills(getVacancies(), period, filters.directions, filters.grades))
}
