import { DIRECTION_IDS, getPeriod } from "@/shared/config"
import { shiftBucket, startOfBucket } from "@/shared/lib/date"
import type {
  DemandBucket,
  DemandResponse,
  DirectionId,
  DirectionSummary,
  Period,
  Vacancy,
  Grade,
} from "@/shared/types"
import { generateSkills } from "./skills"

const DAY_MS = 24 * 60 * 60 * 1000
const HISTORY_DAYS = 365 * 3

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const SALARY_RANGE_K: Record<Grade, [number, number]> = {
  junior: [60, 130],
  middle: [150, 280],
  senior: [280, 450],
  lead: [400, 600],
}

type DirectionProfile = {
  baseDaily: number
  yearlyGrowth: number
  titles: [title: string, grade: Grade][]
}

const PROFILES: Record<DirectionId, DirectionProfile> = {
  react: {
    baseDaily: 14,
    yearlyGrowth: 0.18,
    titles: [
      ["Frontend-разработчик (React)", "middle"],
      ["Senior React Developer", "senior"],
      ["Middle Frontend Developer React/TypeScript", "middle"],
      ["React Native / React разработчик", "middle"],
      ["Lead Frontend Engineer (React)", "lead"],
      ["Junior React-разработчик", "junior"],
    ],
  },
  java: {
    baseDaily: 19,
    yearlyGrowth: 0.07,
    titles: [
      ["Java-разработчик", "middle"],
      ["Senior Java Developer (Spring)", "senior"],
      ["Middle Java Backend Engineer", "middle"],
      ["Java/Kotlin разработчик", "middle"],
      ["Team Lead Java", "lead"],
      ["Junior Java-разработчик", "junior"],
    ],
  },
}

const COMPANIES = [
  "Сбер",
  "Яндекс",
  "Т-Банк",
  "VK",
  "Ozon",
  "Авито",
  "Wildberries",
  "МТС",
  "Альфа-Банк",
  "Kaspersky",
  "2ГИС",
  "Lamoda",
]

const CITIES = ["Москва", "Санкт-Петербург", "Казань", "Новосибирск", "Удалённо"]
const SOURCES: Vacancy["source"][] = ["hh.ru", "habr career", "superjob"]

function pick<T>(rand: () => number, list: readonly T[]): T {
  return list[Math.floor(rand() * list.length)]
}

function dailyCount(
  rand: () => number,
  profile: DirectionProfile,
  date: Date,
  daysAgo: number,
) {
  const trend = 1 + profile.yearlyGrowth * ((HISTORY_DAYS - daysAgo) / 365)
  const weekday = date.getUTCDay()
  const weekdayFactor = weekday === 0 || weekday === 6 ? 0.35 : 1
  const month = date.getUTCMonth()
  const seasonFactor = month === 11 || month === 0 ? 0.8 : month >= 8 && month <= 10 ? 1.15 : 1
  const noise = 0.75 + rand() * 0.5
  return Math.round(profile.baseDaily * trend * weekdayFactor * seasonFactor * noise)
}

function generateVacancies(): Vacancy[] {
  const rand = mulberry32(42)
  const today = startOfBucket(new Date(), "day").getTime()
  const now = Date.now()
  const result: Vacancy[] = []
  let seq = 0

  for (let daysAgo = HISTORY_DAYS; daysAgo >= 0; daysAgo--) {
    const dayStart = today - daysAgo * DAY_MS
    const date = new Date(dayStart)

    for (const direction of DIRECTION_IDS) {
      const profile = PROFILES[direction]
      const count = dailyCount(rand, profile, date, daysAgo)

      for (let i = 0; i < count; i++) {
        const publishedAt = dayStart + Math.floor(rand() * DAY_MS)
        if (publishedAt > now) continue

        const [title, grade] = pick(rand, profile.titles)
        const [minK, maxK] = SALARY_RANGE_K[grade]
        const fromK = minK + rand() * (maxK - minK) * 0.6
        const salaryFrom = rand() < 0.35 ? null : Math.round(fromK / 10) * 10_000
        const salaryTo =
          salaryFrom === null || rand() < 0.3
            ? null
            : Math.round((fromK + rand() * (maxK - fromK)) / 10) * 10_000 + 10_000

        seq++
        result.push({
          id: `v${seq}`,
          title,
          company: pick(rand, COMPANIES),
          direction,
          grade,
          skills: generateSkills(direction, grade, daysAgo, seq),
          city: pick(rand, CITIES),
          salaryFrom,
          salaryTo,
          source: pick(rand, SOURCES),
          url: `https://hh.ru/vacancy/${100_000_000 + seq}`,
          publishedAt: new Date(publishedAt).toISOString(),
        })
      }
    }
  }

  return result.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

let cache: { day: number; vacancies: Vacancy[] } | null = null

export function getVacancies(): Vacancy[] {
  const day = startOfBucket(new Date(), "day").getTime()
  if (!cache || cache.day !== day) {
    cache = { day, vacancies: generateVacancies() }
  }
  return cache.vacancies
}

export function getDemand(period: Period, directions: DirectionId[]): DemandResponse {
  const { bucketCount } = getPeriod(period)
  const currentStart = startOfBucket(new Date(), period)
  const firstStart = shiftBucket(currentStart, period, -(bucketCount - 1))

  const buckets: DemandBucket[] = Array.from({ length: bucketCount }, (_, i) => ({
    start: shiftBucket(firstStart, period, i).toISOString(),
    counts: Object.fromEntries(directions.map((d) => [d, 0])) as Record<DirectionId, number>,
  }))
  const indexByStart = new Map(buckets.map((b, i) => [b.start, i]))

  for (const vacancy of getVacancies()) {
    const published = new Date(vacancy.publishedAt)
    if (published < firstStart) break
    if (!directions.includes(vacancy.direction)) continue
    const index = indexByStart.get(startOfBucket(published, period).toISOString())
    if (index !== undefined) buckets[index].counts[vacancy.direction]++
  }

  const summary: DirectionSummary[] = directions.map((direction) => {
    const total = buckets.reduce((sum, b) => sum + b.counts[direction], 0)
    const lastComplete = buckets.at(-2)?.counts[direction] ?? 0
    const previous = buckets.at(-3)?.counts[direction] ?? 0
    return {
      direction,
      total,
      lastComplete,
      previous,
      changePct: previous > 0 ? ((lastComplete - previous) / previous) * 100 : null,
    }
  })

  return {
    period,
    directions,
    buckets,
    summary,
    generatedAt: new Date().toISOString(),
  }
}
