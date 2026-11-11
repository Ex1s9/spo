"use client"

import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { formatBucket } from "@/shared/lib/date"
import type { SkillsResponse } from "@/shared/types"

const COLORS = ["#2563eb", "#ea580c", "#16a34a", "#9333ea", "#0891b2", "#db2777"]

export function SkillsCharts({ data, tracked }: { data: SkillsResponse; tracked: string[] }) {
  const skills = tracked.map((id) => data.skills.find((s) => s.id === id)!).filter(Boolean)
  const config = Object.fromEntries(skills.map((s, i) => [s.id, { label: s.label, color: COLORS[i] }]))
  const points = data.buckets.map((b, i) => ({
    label: formatBucket(b.start, data.period) + (i === data.buckets.length - 1 ? " *" : ""),
    ...Object.fromEntries(skills.map((s) => [s.id, b.total ? b.counts[s.id] / b.total * 100 : null])),
  }))
  const radar = skills.map((s) => {
    const summary = data.summary.find((row) => row.skill === s.id)!
    return { label: s.label, current: summary.lastCompleteShare, previous: summary.previousShare }
  })
  const hasComplete = data.buckets.at(-2)!.total > 0

  return (
    <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Как меняются требования</CardTitle>
          <CardDescription>Доля вакансий с навыком, %. * — текущий незавершённый период. Пробел — нет вакансий.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className="h-80 w-full">
            <LineChart data={points} margin={{ right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} width={46} />
              <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <><span>{config[String(name)]?.label ?? String(name)}</span><span className="ml-auto font-mono">{Number(value).toFixed(1)}%</span></>}  />} />
              <ChartLegend content={<ChartLegendContent />} />
              {skills.map((s) => <Line key={s.id} dataKey={s.id} stroke={`var(--color-${s.id})`} strokeWidth={2} dot={false} connectNulls={false} />)}
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Радар требований</CardTitle>
          <CardDescription>Два завершённых периода для выбранного направления и грейда. Шкала 0–100%.</CardDescription>
        </CardHeader>
        <CardContent>
          {!hasComplete ? <p className="flex h-80 items-center justify-center text-sm text-muted-foreground">Нет вакансий за завершённый период</p> : skills.length < 3 ? <p className="flex h-80 items-center justify-center text-sm text-muted-foreground">Выберите хотя бы 3 навыка для радара</p> : (
            <ChartContainer config={{ current: { label: "Последний завершённый", color: "#2563eb" }, previous: { label: "Предыдущий", color: "#94a3b8" } }} className="h-80 w-full">
              <RadarChart data={radar} outerRadius="65%">
                <PolarGrid />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tickCount={3} tick={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent formatter={(value, name) => <><span>{name === "current" ? "Последний завершённый" : "Предыдущий"}</span><span className="ml-auto font-mono">{Number(value).toFixed(1)}%</span></>}  />} />
                <ChartLegend content={<ChartLegendContent />} />
                {data.buckets.at(-3)!.total > 0 && <Radar dataKey="previous" stroke="var(--color-previous)" fill="var(--color-previous)" fillOpacity={0.1} />}
                <Radar dataKey="current" stroke="var(--color-current)" fill="var(--color-current)" fillOpacity={0.2} />
              </RadarChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
