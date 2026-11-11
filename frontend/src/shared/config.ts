import type { DirectionId, Grade, Period } from "./types"

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api"

export const SESSION_COOKIE = "spo_refresh"

export type DirectionMeta = {
  id: DirectionId
  label: string
  color: string
}

export const DIRECTIONS: DirectionMeta[] = [
  { id: "react", label: "React", color: "oklch(0.68 0.15 230)" },
  { id: "java", label: "Java", color: "oklch(0.7 0.17 50)" },
]

export const DIRECTION_IDS = DIRECTIONS.map((d) => d.id)

export function getDirection(id: DirectionId) {
  return DIRECTIONS.find((d) => d.id === id)!
}

export type PeriodMeta = {
  id: Period
  label: string
  bucketCount: number
  lastCompleteLabel: string
}

export const PERIODS: PeriodMeta[] = [
  { id: "day", label: "День", bucketCount: 30, lastCompleteLabel: "за вчера" },
  { id: "week", label: "Неделя", bucketCount: 12, lastCompleteLabel: "за прошлую неделю" },
  { id: "month", label: "Месяц", bucketCount: 12, lastCompleteLabel: "за прошлый месяц" },
  { id: "year", label: "Год", bucketCount: 3, lastCompleteLabel: "за прошлый год" },
]

export function getPeriod(id: Period) {
  return PERIODS.find((p) => p.id === id)!
}

export function isPeriod(value: unknown): value is Period {
  return PERIODS.some((p) => p.id === value)
}

export function isDirectionId(value: unknown): value is DirectionId {
  return DIRECTION_IDS.includes(value as DirectionId)
}

export const GRADES: { id: Grade; label: string }[] = [
  { id: "junior", label: "Junior" },
  { id: "middle", label: "Middle" },
  { id: "senior", label: "Senior" },
  { id: "lead", label: "Lead" },
]

export const GRADE_IDS = GRADES.map((g) => g.id)

export function isGrade(value: unknown): value is Grade {
  return GRADE_IDS.includes(value as Grade)
}
