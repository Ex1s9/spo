import { NextResponse, type NextRequest } from "next/server"

import { getUserFromRequest, mockLatency } from "@/mocks/auth"
import { getDemand } from "@/mocks/vacancies"
import { DIRECTION_IDS, isDirectionId, isPeriod } from "@/shared/config"

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ message: "Не авторизован" }, { status: 401 })
  }

  if (!user.permissions.includes("STATS_VIEW")) {
    return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 })
  }

  const params = request.nextUrl.searchParams
  const period = params.get("period") ?? "month"
  const directions = (params.get("directions") ?? DIRECTION_IDS.join(","))
    .split(",")
    .filter(isDirectionId)

  if (!isPeriod(period)) {
    return NextResponse.json({ message: "Неизвестный период" }, { status: 400 })
  }

  await mockLatency()
  return NextResponse.json(getDemand(period, directions))
}
