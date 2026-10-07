"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { DIRECTION_IDS, DIRECTIONS, PERIODS, isPeriod } from "@/shared/config"
import type { DirectionId, Period } from "@/shared/types"

type Props = {
  period: Period
  directions: DirectionId[]
  onPeriodChange: (period: Period) => void
  onDirectionsChange: (directions: DirectionId[]) => void
}

export function DemandFilters({
  period,
  directions,
  onPeriodChange,
  onDirectionsChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <ToggleGroup
        multiple
        variant="outline"
        spacing={0}
        value={directions}
        onValueChange={(value) => {
          const next = DIRECTION_IDS.filter((id) => value.includes(id))
          if (next.length > 0) onDirectionsChange(next)
        }}
        aria-label="Направления"
      >
        {DIRECTIONS.map((d) => (
          <ToggleGroupItem key={d.id} value={d.id} className="gap-2 px-3">
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            {d.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <Tabs
        value={period}
        onValueChange={(value) => isPeriod(value) && onPeriodChange(value)}
      >
        <TabsList>
          {PERIODS.map((p) => (
            <TabsTrigger key={p.id} value={p.id}>
              {p.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
