import { TrendingDown, TrendingUp } from "lucide-react"

import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getDirection, getPeriod } from "@/shared/config"
import type { DemandResponse, DirectionId } from "@/shared/types"

const numberFormatter = new Intl.NumberFormat("ru-RU")

type Props = {
  data: DemandResponse | undefined
  directions: DirectionId[]
}

export function DemandSummary({ data, directions }: Props) {
  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        {directions.map((d) => (
          <Skeleton key={d} className="h-28 rounded-xl" />
        ))}
      </div>
    )
  }

  const { lastCompleteLabel } = getPeriod(data.period)

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.summary.map((s) => {
        const direction = getDirection(s.direction)
        const growing = (s.changePct ?? 0) >= 0
        return (
          <Card key={s.direction}>
            <CardHeader>
              <CardDescription className="flex items-center gap-2">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: direction.color }}
                />
                {direction.label} · {lastCompleteLabel}
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {numberFormatter.format(s.lastComplete)}
              </CardTitle>
              {s.changePct !== null && (
                <CardAction>
                  <Badge variant="outline" className="gap-1">
                    {growing ? <TrendingUp /> : <TrendingDown />}
                    {growing ? "+" : ""}
                    {s.changePct.toFixed(1)}%
                  </Badge>
                </CardAction>
              )}
              <p className="text-xs text-muted-foreground">
                Всего на графике: {numberFormatter.format(s.total)}
              </p>
            </CardHeader>
          </Card>
        )
      })}
    </div>
  )
}
