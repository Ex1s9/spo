import type { DirectionId, Skill } from "./types"

export const SKILLS: (Skill & { directions: DirectionId[] })[] = [
  { id: "javascript", label: "JavaScript", directions: ["react"] },
  { id: "typescript", label: "TypeScript", directions: ["react"] },
  { id: "react", label: "React", directions: ["react"] },
  { id: "css", label: "HTML / CSS", directions: ["react"] },
  { id: "nextjs", label: "Next.js", directions: ["react"] },
  { id: "redux", label: "Redux", directions: ["react"] },
  { id: "testing", label: "Тестирование", directions: ["react", "java"] },
  { id: "git", label: "Git", directions: ["react", "java"] },
  { id: "java", label: "Java", directions: ["java"] },
  { id: "spring", label: "Spring Boot", directions: ["java"] },
  { id: "sql", label: "SQL", directions: ["java"] },
  { id: "postgresql", label: "PostgreSQL", directions: ["java"] },
  { id: "kafka", label: "Kafka", directions: ["java"] },
  { id: "docker", label: "Docker", directions: ["react", "java"] },
  { id: "kubernetes", label: "Kubernetes (k8s)", directions: ["react", "java"] },
  { id: "cicd", label: "CI/CD", directions: ["react", "java"] },
  { id: "architecture", label: "Проектирование систем", directions: ["react", "java"] },
]

export function getSkillLabel(id: string) {
  return SKILLS.find((s) => s.id === id)?.label ?? id
}
