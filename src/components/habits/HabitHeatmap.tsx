"use client"

import { useMemo } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { HabitLog } from "@/types"
import { subDays, format } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  logs: HabitLog[]
  color: string
  weeks?: number
}

export function HabitHeatmap({ logs, color, weeks = 26 }: Props) {
  const cells = useMemo(() => {
    const logMap = new Map(logs.map((l) => [l.date, l]))
    const today = new Date()
    const totalDays = weeks * 7
    const startDay = subDays(today, totalDays - 1)
    // Align to Monday
    const dayOfWeek = (startDay.getDay() + 6) % 7
    const cells: { date: string; label: string; completed: boolean; value: number | null; future: boolean }[] = []

    for (let i = 0; i < totalDays; i++) {
      const d = subDays(today, totalDays - 1 - i)
      const key = format(d, "yyyy-MM-dd")
      const log = logMap.get(key)
      cells.push({
        date: key,
        label: format(d, "d MMM yyyy", { locale: es }),
        completed: log?.completed ?? false,
        value: log?.value ?? null,
        future: d > today,
      })
    }
    return cells
  }, [logs, weeks])

  const cols = Math.ceil(cells.length / 7)

  return (
    <TooltipProvider delayDuration={0}>
      <div className="overflow-x-auto">
        <svg
          width={cols * 14 + (cols - 1) * 2}
          height={7 * 14 + 6 * 2}
          className="min-w-max"
        >
          {cells.map((cell, i) => {
            const col = Math.floor(i / 7)
            const row = i % 7
            const x = col * 16
            const y = row * 16
            const opacity = cell.future ? 0 : cell.completed ? 1 : 0.08

            return (
              <Tooltip key={cell.date}>
                <TooltipTrigger asChild>
                  <rect
                    x={x}
                    y={y}
                    width={14}
                    height={14}
                    rx={3}
                    fill={cell.future ? "transparent" : cell.completed ? color : "currentColor"}
                    fillOpacity={opacity}
                    className={cell.future ? "" : "text-muted-foreground cursor-pointer"}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>{cell.label}</p>
                  {cell.completed ? (
                    cell.value !== null ? <p className="text-xs font-medium">{cell.value}</p> : <p className="text-xs">✓ Completado</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sin registrar</p>
                  )}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </svg>
      </div>
    </TooltipProvider>
  )
}
