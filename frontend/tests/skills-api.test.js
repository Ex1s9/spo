import { expect, test } from "bun:test"
import { NextRequest } from "next/server"
import { GET as skills } from "../src/app/api/vacancies/skills/route"
import { GET as list } from "../src/app/api/vacancies/route"

const request = (query = "", authenticated = true) => new NextRequest(`http://localhost/api/vacancies/skills?${query}`, {
  headers: authenticated ? { Cookie: "spo_refresh=mock.dTE" } : {},
})

test("API навыков требует входа", async () => {
  expect((await skills(request("", false))).status).toBe(401)
})

test("API навыков отклоняет неизвестные и пустые фильтры", async () => {
  for (const query of ["period=invalid", "grades=", "grades=unknown", "directions=", "directions=python"]) {
    expect((await skills(request(query))).status).toBe(400)
  }
})

test("API и список вакансий используют одинаковый грейд и стек", async () => {
  const response = await skills(request("period=month&directions=java&grades=middle"))
  expect(response.status).toBe(200)
  const body = await response.json()
  expect(body.grades).toEqual(["middle"])
  expect(body.summary.find((s) => s.skill === "kubernetes").lastComplete).toBe(0)
  const itemsResponse = await list(request("directions=java&grades=middle&limit=2"))
  expect(itemsResponse.status).toBe(200)
  const items = (await itemsResponse.json()).items
  expect(items).toHaveLength(2)
  expect(items.every((v) => v.grade === "middle" && v.skills.includes("java") && !v.skills.includes("kubernetes"))).toBe(true)
})

test("список отклоняет невалидный лимит", async () => {
  for (const query of ["limit=-1", "limit=101", "limit=oops", "limit=1.5"]) {
    expect((await list(request(query))).status).toBe(400)
  }
})
