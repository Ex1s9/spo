import type { NextRequest } from "next/server"

import { SESSION_COOKIE } from "@/shared/config"
import type { User } from "@/shared/types"

type MockAccount = User & { password: string }

export const DEMO_CREDENTIALS = { email: "demo@spo.dev", password: "demo1234" }

const ACCOUNTS: MockAccount[] = [
  {
    id: "u1",
    name: "Demo User",
    active: true,
    roles: ["ADMIN"],
    permissions: [
      "STATS_VIEW", "FILTER_SAVE", "COMPANY_WATCH_VIEW", "COMPANY_WATCH_EDIT",
      "COLLECT_RUN", "REPORT_EXPORT", "DICTIONARY_EDIT", "USER_MANAGE",
      "ROLE_MANAGE", "PARSER_SCHEDULE_MANAGE", "AUDIT_VIEW",
    ],
    ...DEMO_CREDENTIALS,
  },
]

function toUser({ password: _password, ...user }: MockAccount): User {
  return user
}

export function authenticate(email: string, password: string): User | null {
  const account = ACCOUNTS.find(
    (a) => a.email === email.trim().toLowerCase() && a.password === password,
  )
  return account ? toUser(account) : null
}

export function createToken(user: User) {
  return `mock.${Buffer.from(user.id).toString("base64url")}`
}

export function getUserFromRequest(request: NextRequest): User | null {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token?.startsWith("mock.")) return null
  const id = Buffer.from(token.slice(5), "base64url").toString()
  const account = ACCOUNTS.find((a) => a.id === id)
  return account ? toUser(account) : null
}

export function mockLatency(min = 250, max = 700) {
  return new Promise((r) => setTimeout(r, min + Math.random() * (max - min)))
}
