"use client"

import { useQuery } from "@tanstack/react-query"
import { http } from "@/shared/api/http"
import type { DirectionId, Grade, Period, SkillsResponse } from "@/shared/types"

export function useSkills(period: Period, directions: DirectionId[], grades: Grade[]) {
  return useQuery({
    queryKey: ["vacancies", "skills", period, directions, grades],
    queryFn: () => http<SkillsResponse>("/vacancies/skills", { query: { period, directions, grades } }),
  })
}
