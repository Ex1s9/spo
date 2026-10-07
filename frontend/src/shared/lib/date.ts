import type { Period } from "@/shared/types"

const DAY_MS = 24 * 60 * 60 * 1000

export function startOfBucket(date: Date, period: Period): Date {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  )
  switch (period) {
    case "day":
      return d
    case "week": {
      const mondayOffset = (d.getUTCDay() + 6) % 7
      return new Date(d.getTime() - mondayOffset * DAY_MS)
    }
    case "month":
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    case "year":
      return new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  }
}

export function shiftBucket(date: Date, period: Period, amount: number): Date {
  switch (period) {
    case "day":
      return new Date(date.getTime() + amount * DAY_MS)
    case "week":
      return new Date(date.getTime() + amount * 7 * DAY_MS)
    case "month":
      return new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1),
      )
    case "year":
      return new Date(Date.UTC(date.getUTCFullYear() + amount, 0, 1))
  }
}

const bucketFormatters: Record<Period, Intl.DateTimeFormat> = {
  day: new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }),
  week: new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }),
  month: new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }),
  year: new Intl.DateTimeFormat("ru-RU", { year: "numeric", timeZone: "UTC" }),
}

export function formatBucket(iso: string, period: Period): string {
  const label = bucketFormatters[period].format(new Date(iso))
  return period === "week" ? `с ${label}` : label
}

const dateTimeFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}
