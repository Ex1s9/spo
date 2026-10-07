"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDirection } from "@/shared/config"
import { formatDateTime } from "@/shared/lib/date"
import type { DirectionId, Vacancy } from "@/shared/types"

import { useLatestVacancies } from "./api"

const moneyFormatter = new Intl.NumberFormat("ru-RU")

function formatSalary({ salaryFrom, salaryTo }: Vacancy) {
  if (salaryFrom && salaryTo)
    return `${moneyFormatter.format(salaryFrom)} – ${moneyFormatter.format(salaryTo)} ₽`
  if (salaryFrom) return `от ${moneyFormatter.format(salaryFrom)} ₽`
  if (salaryTo) return `до ${moneyFormatter.format(salaryTo)} ₽`
  return "—"
}

export function LatestVacancies({ directions }: { directions: DirectionId[] }) {
  const { data, isPending, error } = useLatestVacancies(directions)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Последние вакансии</CardTitle>
        <CardDescription>
          {data
            ? `Показано ${data.items.length} из ${moneyFormatter.format(data.total)} собранных`
            : "Загружаем…"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-destructive">{error.message}</p>
        ) : isPending ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Вакансия</TableHead>
                <TableHead>Компания</TableHead>
                <TableHead>Город</TableHead>
                <TableHead className="text-right">Зарплата</TableHead>
                <TableHead>Источник</TableHead>
                <TableHead className="text-right">Опубликована</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: getDirection(v.direction).color }}
                      />
                      {v.title}
                    </div>
                  </TableCell>
                  <TableCell>{v.company}</TableCell>
                  <TableCell>{v.city}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatSalary(v)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{v.source}</Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground tabular-nums">
                    {formatDateTime(v.publishedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
