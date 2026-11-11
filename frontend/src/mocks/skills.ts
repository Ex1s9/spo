import { SKILLS } from "@/shared/skills"
import type { DirectionId, Grade } from "@/shared/types"

// Вероятности в начале и конце истории. Отдельный seed сохраняет генерацию вакансий.
const PROBABILITIES: Record<string, [number, number]> = {
  javascript: [0.95, 0.9], typescript: [0.4, 0.95], react: [1, 1], css: [0.9, 0.85],
  nextjs: [0.1, 0.65], redux: [0.8, 0.35], testing: [0.35, 0.75], git: [0.9, 0.95],
  java: [1, 1], spring: [0.65, 0.9], sql: [0.8, 0.85], postgresql: [0.35, 0.7],
  kafka: [0.2, 0.65], docker: [0.3, 0.8], kubernetes: [0.15, 0.7],
  cicd: [0.25, 0.75], architecture: [0.6, 0.9],
}

export function generateSkills(direction: DirectionId, grade: Grade, daysAgo: number, seed: number) {
  const progress = 1 - daysAgo / (365 * 3)
  // Перемешиваем последовательные id, чтобы соседние даты не получали одинаковый стек.
  let state = Math.imul(seed ^ (seed >>> 16), 0x7feb352d)
  state = Math.imul(state ^ (state >>> 15), 0x846ca68b)
  state = (state ^ (state >>> 16)) >>> 0
  return SKILLS.filter((skill) => {
    if (!skill.directions.includes(direction)) return false
    // Демонстрационный сценарий: k8s и архитектура нужны только Senior / Lead.
    if (["kubernetes", "architecture"].includes(skill.id) && ["junior", "middle"].includes(grade)) return false
    if (grade === "junior" && ["kafka", "cicd", "docker"].includes(skill.id)) return false
    const [before, after] = PROBABILITIES[skill.id]
    const factor = grade === "junior" && ["testing", "spring", "nextjs"].includes(skill.id) ? 0.45 : 1
    // Один и тот же генератор используется и в Java-заглушке.
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    return state / 4294967296 < (before + (after - before) * progress) * factor
  }).map((s) => s.id)
}
