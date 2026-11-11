import { describe, expect, test } from "bun:test"
import { aggregateSkills } from "../src/shared/lib/skill-demand"
import { parseVacancyFilters } from "../src/shared/api/vacancy-filters"
import { generateSkills } from "../src/mocks/skills"
import { getVacancies } from "../src/mocks/vacancies"

const now = new Date("2026-11-05T12:00:00Z")
const vacancy = (id, publishedAt, skills, grade = "senior", direction = "java") => ({ id, publishedAt, skills, grade, direction })
const summary = (result, id) => result.summary.find((s) => s.skill === id)

describe("история требований к навыкам", () => {
  test("считает доли внутри грейда, удаляет дубли навыков и исключает текущий период из сравнения", () => {
    const result = aggregateSkills([
      vacancy("1", "2026-09-01T00:00:00Z", ["java"]),
      vacancy("2", "2026-10-01T00:00:00Z", ["java", "kubernetes", "kubernetes"]),
      vacancy("3", "2026-10-31T23:59:59Z", ["java"]),
      vacancy("4", "2026-10-10T00:00:00Z", ["java", "kubernetes"], "middle"),
      vacancy("5", "2026-10-10T00:00:00Z", ["kubernetes"], "senior", "react"),
      vacancy("6", "2026-11-02T00:00:00Z", ["java", "kubernetes"]),
      vacancy("7", "2026-11-06T00:00:00Z", ["java", "kubernetes"]),
    ], "month", ["java"], ["senior"], now)
    expect(result.buckets.at(-2).total).toBe(2)
    expect(result.buckets.at(-1).total).toBe(1)
    expect(summary(result, "kubernetes")).toEqual({
      skill: "kubernetes", total: 2, lastComplete: 1, previous: 0,
      lastCompleteShare: 50, previousShare: 0, changePp: 50,
    })
    expect(result.skills.some((s) => s.id === "react")).toBe(false)
  })

  test("отличает пустую выборку от отсутствия навыка", () => {
    const result = aggregateSkills([vacancy("1", "2026-10-01T00:00:00Z", ["java"])], "month", ["java"], ["senior"], now)
    expect(summary(result, "kubernetes").lastCompleteShare).toBe(0)
    expect(summary(result, "kubernetes").previousShare).toBeNull()
    expect(summary(result, "kubernetes").changePp).toBeNull()
  })

  test.each([["day", 30], ["week", 12], ["month", 12], ["year", 3]])("создаёт полное окно %s и считает суммарную выборку", (period, length) => {
    const result = aggregateSkills([
      vacancy("1", "2026-11-01T00:00:00Z", ["java"], "middle"),
      vacancy("2", "2026-11-01T00:00:00Z", ["kubernetes"], "senior"),
    ], period, ["java"], ["middle", "senior"], now)
    expect(result.buckets).toHaveLength(length)
    expect(result.buckets.reduce((n, b) => n + b.total, 0)).toBe(2)
    if (period === "week") expect(result.buckets.at(-1).start).toBe("2026-11-02T00:00:00.000Z")
  })

  test("валидирует грейды и направления, возвращает значения по умолчанию, удаляет повторы", () => {
    expect(parseVacancyFilters(new URLSearchParams()).grades).toHaveLength(4)
    expect(parseVacancyFilters(new URLSearchParams("grades=senior,senior")).grades).toEqual(["senior"])
    for (const query of ["grades=", "grades=senior,unknown", "directions=python", "directions="]) {
      expect(() => parseVacancyFilters(new URLSearchParams(query))).toThrow()
    }
  })

  test("демо-история различает грейды и содержит растущие и падающие требования", () => {
    const skills = (grade, daysAgo) => Array.from({ length: 1000 }, (_, i) => generateSkills("react", grade, daysAgo, i + 1))
    const count = (items, skill) => items.filter((s) => s.includes(skill)).length
    expect(count(skills("middle", 0), "kubernetes")).toBe(0)
    expect(count(skills("senior", 0), "kubernetes")).toBeGreaterThan(500)
    expect(count(skills("senior", 0), "typescript")).toBeGreaterThan(count(skills("senior", 1095), "typescript"))
    expect(count(skills("senior", 0), "redux")).toBeLessThan(count(skills("senior", 1095), "redux"))
    // Последовательные id не должны создавать одинаковые требования на соседних датах.
    for (const seedStart of [1, 20000, 50000]) {
      const sample = Array.from({ length: 1000 }, (_, i) => generateSkills("java", "senior", 0, i + seedStart))
      expect(count(sample, "testing")).toBeGreaterThan(650)
      expect(count(sample, "testing")).toBeLessThan(850)
    }
    // Контрольная последовательность общая с Java-тестом.
    expect(generateSkills("java", "senior", 0, 42)).toEqual([
      "testing", "git", "java", "spring", "sql", "postgresql", "docker", "kubernetes", "cicd", "architecture",
    ])
    const items = getVacancies()
    expect(items.every((v) => v.skills.includes(v.direction))).toBe(true)
    expect(items.filter((v) => v.grade === "middle").some((v) => v.skills.includes("kubernetes"))).toBe(false)
  })
})
