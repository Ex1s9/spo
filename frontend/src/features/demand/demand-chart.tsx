"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { DIRECTIONS } from "@/shared/config"
import { formatBucket } from "@/shared/lib/date"
import type { DemandResponse } from "@/shared/types"

const chartConfig = Object.fromEntries(
  DIRECTIONS.map((d) => [d.id, { label: d.label, color: d.color }]),
) satisfies ChartConfig

type Props = {
  data: DemandResponse | undefined
  isFetching: boolean
}

export function DemandChart({ data, isFetching }: Props) {
  const points = data?.buckets.map((b) => ({
    label: formatBucket(b.start, data.period),
    ...b.counts,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Количество новых вакансий</CardTitle>
        <CardDescription>
          Последний столбец — текущий, ещё не завершившийся период
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data || !points ? (
          <Skeleton className="aspect-[3/1] w-full rounded-lg" />
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-80 w-full transition-opacity data-[fetching=true]:opacity-60"
            data-fetching={isFetching}
          >
            <AreaChart data={points} margin={{ left: 0, right: 12, top: 8 }}>
              <defs>
                {data.directions.map((id) => (
                  <linearGradient key={id} id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${id})`} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={`var(--color-${id})`} stopOpacity={0.02} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
              />
              <YAxis tickLine={false} axisLine={false} width={44} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
              <ChartLegend content={<ChartLegendContent />} />
              {data.directions.map((id) => (
                <Area
                  key={id}
                  dataKey={id}
                  type="monotone"
                  stroke={`var(--color-${id})`}
                  strokeWidth={2}
                  fill={`url(#fill-${id})`}
                />
              ))}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
