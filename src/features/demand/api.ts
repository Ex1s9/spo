"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { http } from "@/shared/api/http"
import type {
  DemandResponse,
  DirectionId,
  Period,
  VacanciesResponse,
} from "@/shared/types"

export const vacanciesApi = {
  demand: (period: Period, directions: DirectionId[]) =>
    http<DemandResponse>("/vacancies/demand", { query: { period, directions } }),
  list: (directions: DirectionId[], limit = 20) =>
    http<VacanciesResponse>("/vacancies", { query: { directions, limit } }),
}

export function useDemand(period: Period, directions: DirectionId[]) {
  return useQuery({
    queryKey: ["vacancies", "demand", period, directions],
    queryFn: () => vacanciesApi.demand(period, directions),
    enabled: directions.length > 0,
    placeholderData: keepPreviousData,
  })
}

export function useLatestVacancies(directions: DirectionId[]) {
  return useQuery({
    queryKey: ["vacancies", "list", directions],
    queryFn: () => vacanciesApi.list(directions),
    enabled: directions.length > 0,
    placeholderData: keepPreviousData,
  })
}
