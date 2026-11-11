import { getPeriod } from "@/shared/config"
import { SKILLS } from "@/shared/skills"
import type { DirectionId, Grade, Period, SkillsResponse, Vacancy } from "@/shared/types"
import { shiftBucket, startOfBucket } from "./date"

/** История требований на дату публикации. Каждая вакансия учитывается один раз на навык. */
export function aggregateSkills(
  vacancies: Vacancy[], period: Period, directions: DirectionId[], grades: Grade[], now = new Date(),
): SkillsResponse {
  const skills = SKILLS.filter((s) => s.directions.some((d) => directions.includes(d)))
    .map(({ id, label }) => ({ id, label }))
  const { bucketCount } = getPeriod(period)
  const first = shiftBucket(startOfBucket(now, period), period, -(bucketCount - 1))
  const buckets = Array.from({ length: bucketCount }, (_, i) => ({
    start: shiftBucket(first, period, i).toISOString(), total: 0,
    counts: Object.fromEntries(skills.map((s) => [s.id, 0])),
  }))
  const index = new Map(buckets.map((b) => [b.start, b]))
  for (const vacancy of vacancies) {
    if (!directions.includes(vacancy.direction) || !grades.includes(vacancy.grade)) continue
    const published = new Date(vacancy.publishedAt)
    if (published > now) continue
    const bucket = index.get(startOfBucket(published, period).toISOString())
    if (!bucket) continue
    bucket.total++
    for (const id of new Set(vacancy.skills)) {
      if (id in bucket.counts) bucket.counts[id]++
    }
  }
  const last = buckets.at(-2)!
  const previous = buckets.at(-3)!
  return {
    period, directions, grades, skills, buckets,
    summary: skills.map(({ id }) => {
      const lastCompleteShare = last.total ? last.counts[id] / last.total * 100 : null
      const previousShare = previous.total ? previous.counts[id] / previous.total * 100 : null
      return {
        skill: id, total: buckets.reduce((sum, b) => sum + b.counts[id], 0),
        lastComplete: last.counts[id], previous: previous.counts[id], lastCompleteShare, previousShare,
        changePp: lastCompleteShare !== null && previousShare !== null ? lastCompleteShare - previousShare : null,
      }
    }),
    generatedAt: now.toISOString(),
  }
}
