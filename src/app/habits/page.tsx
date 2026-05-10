"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Flame, TrendingUp, Target } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HabitCard } from "@/components/habits/HabitCard"
import { HabitForm } from "@/components/habits/HabitForm"
import { HabitHeatmap } from "@/components/habits/HabitHeatmap"
import { HabitBarChart } from "@/components/habits/HabitBarChart"
import { Habit } from "@/types"

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [editHabit, setEditHabit] = useState<Habit | undefined>()
  const [chartView, setChartView] = useState<"weekly" | "monthly">("weekly")
  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null)

  const loadHabits = useCallback(async () => {
    const res = await fetch("/api/habits")
    const data = await res.json()
    setHabits(data)
    if (!selectedHabit && data.length > 0) setSelectedHabit(data[0])
    setLoading(false)
  }, [selectedHabit])

  useEffect(() => { loadHabits() }, [])

  const topStreak = habits.reduce((best, h) => h.currentStreak > best ? h.currentStreak : best, 0)
  const avgCompletion = habits.length
    ? Math.round(habits.reduce((s, h) => s + h.completionRate, 0) / habits.length)
    : 0
  const completedToday = habits.filter((h) => h.todayCompleted).length

  async function deleteHabit(id: string) {
    await fetch(`/api/habits/${id}`, { method: "DELETE" })
    loadHabits()
  }

  const selected = selectedHabit ? habits.find((h) => h.id === selectedHabit.id) ?? null : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hábitos</h1>
          <p className="text-sm text-muted-foreground">{habits.length} hábitos activos</p>
        </div>
        <Button onClick={() => { setEditHabit(undefined); setFormOpen(true) }}>
          <Plus className="h-4 w-4" /> Nuevo hábito
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2"><Flame className="h-5 w-5 text-orange-500" /></div>
            <div><p className="text-2xl font-bold">{topStreak}</p><p className="text-xs text-muted-foreground">Mejor racha</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{avgCompletion}%</p><p className="text-xs text-muted-foreground">Media mensual</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2"><Target className="h-5 w-5 text-green-500" /></div>
            <div><p className="text-2xl font-bold">{completedToday}/{habits.length}</p><p className="text-xs text-muted-foreground">Hoy</p></div>
          </CardContent>
        </Card>
      </div>

      {habits.length === 0 && !loading ? (
        <Card className="py-16 text-center">
          <p className="text-muted-foreground mb-4">No tienes hábitos todavía.</p>
          <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Crear primer hábito</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habit cards */}
          <div className="space-y-3">
            {habits.map((h, i) => (
              <motion.div
                key={h.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedHabit(h)}
                className="cursor-pointer"
              >
                <HabitCard
                  habit={h}
                  onEdit={() => { setEditHabit(h); setFormOpen(true) }}
                  onDelete={() => deleteHabit(h.id)}
                  onToggle={loadHabits}
                />
              </motion.div>
            ))}
          </div>

          {/* Charts panel */}
          {selected && (
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base" style={{ color: selected.color }}>
                      {selected.name} — Actividad
                    </CardTitle>
                    <Tabs value={chartView} onValueChange={(v) => setChartView(v as "weekly" | "monthly")}>
                      <TabsList className="h-7">
                        <TabsTrigger value="weekly" className="text-xs px-2 h-6">7 días</TabsTrigger>
                        <TabsTrigger value="monthly" className="text-xs px-2 h-6">4 semanas</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>
                <CardContent>
                  <HabitBarChart
                    logs={selected.logs}
                    color={selected.color}
                    isNumeric={selected.isNumeric}
                    targetValue={selected.targetValue}
                    unit={selected.unit}
                    view={chartView}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Historial (6 meses)</CardTitle>
                </CardHeader>
                <CardContent>
                  <HabitHeatmap logs={selected.logs} color={selected.color} weeks={26} />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      <HabitForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={loadHabits}
        habit={editHabit}
      />
    </div>
  )
}
