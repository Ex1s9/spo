"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LatestVacancies } from "@/features/demand/latest-vacancies"
import { DIRECTIONS, GRADE_IDS, GRADES, PERIODS, isDirectionId, isGrade, isPeriod } from "@/shared/config"
import { formatBucket } from "@/shared/lib/date"
import type { DirectionId, Grade, Period } from "@/shared/types"
import { useSkills } from "./api"
import { SkillsCharts } from "./skills-charts"

const percent = (value: number | null) => value === null ? "Нет данных" : `${value.toFixed(1)}%`
const selectClass = "h-9 rounded-lg border bg-background px-3 text-sm"

export function SkillsDashboard() {
  const [direction, setDirection] = useState<DirectionId>("java")
  const [grade, setGrade] = useState<Grade | "all">("middle")
  const [period, setPeriod] = useState<Period>("month")
  const [selection, setSelection] = useState<string[] | null>(null)
  const directions = [direction]
  const grades = grade === "all" ? GRADE_IDS : [grade]
  const query = useSkills(period, directions, grades)
  const data = query.data
  const sorted = data ? [...data.summary].sort((a, b) => (b.lastCompleteShare ?? -1) - (a.lastCompleteShare ?? -1) || a.skill.localeCompare(b.skill)) : []
  const tracked = selection ?? sorted.slice(0, 6).map((s) => s.skill)
  const last = data?.buckets.at(-2)
  const previous = data?.buckets.at(-3)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Радар навыков</h1>
        <p className="text-sm text-muted-foreground">Какие навыки требуют работодатели и как меняется стек по грейдам</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Направление
            <select className={selectClass} value={direction} onChange={(e) => { if (isDirectionId(e.target.value)) { setDirection(e.target.value); setSelection(null) } }}>
              {DIRECTIONS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">Грейд
            <select className={selectClass} value={grade} onChange={(e) => { if (e.target.value === "all" || isGrade(e.target.value)) setGrade(e.target.value) }}>
              <option value="all">Все грейды</option>
              {GRADES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
        </div>
        <Tabs value={period} onValueChange={(v) => isPeriod(v) && setPeriod(v)}>
          <TabsList>{PERIODS.map((p) => <TabsTrigger key={p.id} value={p.id}>{p.label}</TabsTrigger>)}</TabsList>
        </Tabs>
      </div>
      <p className="text-xs text-muted-foreground">Демонстрационные данные. Доля = вакансии с навыком / все вакансии выбранного направления и грейда. Требования сохраняются на дату публикации; сумма долей может превышать 100%.</p>
      {query.error ? <p role="alert" className="text-sm text-destructive">{query.error.message}</p> : !data ? <Skeleton className="h-96 w-full rounded-xl" /> : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card><CardHeader><CardDescription>Вакансии · {formatBucket(last!.start, period)}</CardDescription><CardTitle className="text-3xl">{last!.total.toLocaleString("ru-RU")}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Вакансии · {formatBucket(previous!.start, period)}</CardDescription><CardTitle className="text-3xl">{previous!.total.toLocaleString("ru-RU")}</CardTitle></CardHeader></Card>
            <Card><CardHeader><CardDescription>Навыки в последнем завершённом периоде</CardDescription><CardTitle className="text-3xl">{last!.total ? data.summary.filter((s) => s.lastComplete > 0).length : "—"}</CardTitle></CardHeader></Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Навыки на графиках</CardTitle><CardDescription>Выберите от 1 до 6 навыков. Для радара нужно хотя бы 3; таблица ниже показывает весь стек.</CardDescription></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.skills.map((s) => <label key={s.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/5 has-disabled:opacity-50">
                <input type="checkbox" checked={tracked.includes(s.id)} disabled={tracked.includes(s.id) ? tracked.length === 1 : tracked.length >= 6} onChange={(e) => setSelection(e.target.checked ? [...tracked, s.id] : tracked.filter((id) => id !== s.id))} />{s.label}
              </label>)}
            </CardContent>
          </Card>
          <SkillsCharts data={data} tracked={tracked} />
          <Card>
            <CardHeader><CardTitle>Требования к стеку</CardTitle><CardDescription>Сравнение завершённых периодов: {formatBucket(last!.start, period)} и {formatBucket(previous!.start, period)}. Изменение доли — в процентных пунктах (п.п.).</CardDescription></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Навык</TableHead><TableHead className="text-right">Вакансии</TableHead><TableHead className="text-right">Доля</TableHead><TableHead className="text-right">Ранее</TableHead><TableHead className="text-right">Изменение</TableHead></TableRow></TableHeader>
                <TableBody>{sorted.map((row) => <TableRow key={row.skill}>
                  <TableCell className="font-medium">{data.skills.find((s) => s.id === row.skill)?.label}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.lastComplete} / {last!.total}</TableCell>
                  <TableCell className="text-right tabular-nums">{percent(row.lastCompleteShare)}</TableCell>
                  <TableCell className="text-right tabular-nums">{percent(row.previousShare)}</TableCell>
                  <TableCell className="text-right tabular-nums">{row.changePp === null ? "—" : `${row.changePp > 0 ? "+" : ""}${row.changePp.toFixed(1)} п.п.`}</TableCell>
                </TableRow>)}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
      <LatestVacancies directions={directions} grades={grades} />
    </div>
  )
}
