import { DIRECTION_IDS, GRADE_IDS, isDirectionId, isGrade } from "@/shared/config"

export function parseVacancyFilters(params: URLSearchParams) {
  const directions = params.has("directions") ? params.get("directions")!.split(",") : DIRECTION_IDS
  const grades = params.has("grades") ? params.get("grades")!.split(",") : GRADE_IDS
  if (!directions.length || !directions.every(isDirectionId)) throw new Error("Неизвестное направление")
  if (!grades.length || !grades.every(isGrade)) throw new Error("Неизвестный грейд")
  return { directions: [...new Set(directions)], grades: [...new Set(grades)] }
}
