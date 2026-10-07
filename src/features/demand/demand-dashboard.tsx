"use client"

import { useState } from "react"

import { DIRECTION_IDS } from "@/shared/config"
import type { DirectionId, Period } from "@/shared/types"

import { useDemand } from "./api"
import { DemandChart } from "./demand-chart"
import { DemandFilters } from "./demand-filters"
import { DemandSummary } from "./demand-summary"
import { LatestVacancies } from "./latest-vacancies"

export function DemandDashboard() {
  const [period, setPeriod] = useState<Period>("week")
  const [directions, setDirections] = useState<DirectionId[]>(DIRECTION_IDS)
  const demand = useDemand(period, directions)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Востребованность вакансий
        </h1>
        <p className="text-sm text-muted-foreground">
          Сколько новых вакансий публикуют по каждому направлению
        </p>
      </div>

      <DemandFilters
        period={period}
        directions={directions}
        onPeriodChange={setPeriod}
        onDirectionsChange={setDirections}
      />

      {demand.error ? (
        <p className="text-sm text-destructive">{demand.error.message}</p>
      ) : (
        <>
          <DemandSummary data={demand.data} directions={directions} />
          <DemandChart data={demand.data} isFetching={demand.isFetching} />
        </>
      )}

      <LatestVacancies directions={directions} />
    </div>
  )
}
