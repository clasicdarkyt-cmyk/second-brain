"use client"

import { useMemo } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts"
import { HabitLog } from "@/types"
import { subDays, format, startOfWeek, endOfWeek } from "date-fns"
import { es } from "date-fns/locale"

interface Props {
  logs: HabitLog[]
  color: string
  isNumeric?: boolean
  targetValue?: number | null
  unit?: string | null
  view?: "weekly" | "monthly"
}

export function HabitBarChart({ logs, color, isNumeric, targetValue, unit, view = "weekly" }: Props) {
  const data = useMemo(() => {
    if (view === "weekly") {
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i)
        const key = format(d, "yyyy-MM-dd")
        const log = logs.find((l) => l.date === key)
        return {
          label: format(d, "EEE", { locale: es }),
          value: isNumeric ? (log?.value ?? 0) : (log?.completed ? 1 : 0),
          completed: log?.completed ?? false,
        }
      })
      return days
    } else {
      // Monthly: last 4 weeks
      return Array.from({ length: 4 }, (_, i) => {
        const weekStart = startOfWeek(subDays(new Date(), (3 - i) * 7), { weekStartsOn: 1 })
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
        const weekLogs = logs.filter((l) => {
          const d = new Date(l.date)
          return d >= weekStart && d <= weekEnd && l.completed
        })
        return {
          label: format(weekStart, "d MMM", { locale: es }),
          value: isNumeric
            ? weekLogs.reduce((s, l) => s + (l.value ?? 0), 0) / 7
            : weekLogs.length,
          completed: weekLogs.length > 0,
        }
      })
    }
  }, [logs, view, isNumeric])

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8 }}
          formatter={(val) => {
            const v = typeof val === "number" ? val : 0
            return isNumeric ? [`${v.toFixed(1)} ${unit ?? ""}`, "Valor"] : [v ? "✓" : "—", "Estado"]
          }}
        />
        {isNumeric && targetValue && (
          <ReferenceLine y={targetValue} stroke={color} strokeDasharray="4 2" opacity={0.5} />
        )}
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={32}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.completed || d.value > 0 ? color : `${color}30`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
