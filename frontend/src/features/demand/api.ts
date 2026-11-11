"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { http } from "@/shared/api/http"
import { GRADE_IDS } from "@/shared/config"
import type {
  DemandResponse,
  DirectionId,
  Grade,
  Period,
  VacanciesResponse,
} from "@/shared/types"

export const vacanciesApi = {
  demand: (period: Period, directions: DirectionId[]) =>
    http<DemandResponse>("/vacancies/demand", { query: { period, directions } }),
  list: (directions: DirectionId[], limit = 20, grades: Grade[] = GRADE_IDS) =>
    http<VacanciesResponse>("/vacancies", { query: { directions, limit, grades } }),
}

export function useDemand(period: Period, directions: DirectionId[]) {
  return useQuery({
    queryKey: ["vacancies", "demand", period, directions],
    queryFn: () => vacanciesApi.demand(period, directions),
    enabled: directions.length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useLatestVacancies(directions: DirectionId[], grades: Grade[] = GRADE_IDS) {
  return useQuery({
    queryKey: ["vacancies", "list", directions, grades],
    queryFn: () => vacanciesApi.list(directions, 20, grades),
    enabled: directions.length > 0,
  })
}
