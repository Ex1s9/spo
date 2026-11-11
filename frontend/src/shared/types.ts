export type DirectionId = "react" | "java"

export type Period = "day" | "week" | "month" | "year"

export type Grade = "junior" | "middle" | "senior" | "lead"

export type RoleCode = "USER" | "ANALYST" | "ADMIN"

export type Permission =
  | "STATS_VIEW"
  | "FILTER_SAVE"
  | "COMPANY_WATCH_VIEW"
  | "COMPANY_WATCH_EDIT"
  | "COLLECT_RUN"
  | "REPORT_EXPORT"
  | "DICTIONARY_EDIT"
  | "USER_MANAGE"
  | "ROLE_MANAGE"
  | "PARSER_SCHEDULE_MANAGE"
  | "AUDIT_VIEW"

export type User = {
  id: string
  email: string
  name: string
  active: boolean
  roles: RoleCode[]
  permissions: Permission[]
}

export type Session = {
  accessToken: string
  expiresIn: number
  user: User
}

export type Vacancy = {
  id: string
  title: string
  company: string
  direction: DirectionId
  grade: Grade
  skills: string[]
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

export type Skill = { id: string; label: string }

export type SkillBucket = {
  start: string
  total: number
  counts: Record<string, number>
}

export type SkillSummary = {
  skill: string
  total: number
  lastComplete: number
  previous: number
  lastCompleteShare: number | null
  previousShare: number | null
  changePp: number | null
}

export type SkillsResponse = {
  period: Period
  directions: DirectionId[]
  grades: Grade[]
  skills: Skill[]
  buckets: SkillBucket[]
  summary: SkillSummary[]
  generatedAt: string
}
