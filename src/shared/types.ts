export type DirectionId = "react" | "java"

export type Period = "day" | "week" | "month" | "year"

export type User = {
  id: string
  email: string
  name: string
}

export type Vacancy = {
  id: string
  title: string
  company: string
  direction: DirectionId
  city: string
  salaryFrom: number | null
  salaryTo: number | null
  source: "hh.ru" | "habr career" | "superjob"
  url: string
  publishedAt: string
}

export type DemandBucket = {
  start: string
  counts: Record<DirectionId, number>
}

export type DirectionSummary = {
  direction: DirectionId
  total: number
  lastComplete: number
  previous: number
  changePct: number | null
}

export type DemandResponse = {
  period: Period
  directions: DirectionId[]
  buckets: DemandBucket[]
  summary: DirectionSummary[]
  generatedAt: string
}

export type VacanciesResponse = {
  items: Vacancy[]
  total: number
}

export type ApiError = {
  message: string
}
