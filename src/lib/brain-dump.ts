import { prisma } from "@/lib/prisma"
import { calculateStreak, calculateCompletionRate, formatDate } from "@/lib/utils"
import { subDays } from "date-fns"

export async function generateBrainDump(): Promise<string> {
  const today = new Date()
  const since30 = subDays(today, 30).toISOString().split("T")[0]
  const since90 = subDays(today, 90).toISOString().split("T")[0]

  const [habits, tasks, notes, events] = await Promise.all([
    prisma.habit.findMany({
      where: { archived: false },
      include: { logs: { where: { date: { gte: since90 } }, orderBy: { date: "desc" } } },
    }),
    prisma.task.findMany({
      where: { status: { not: "done" }, parentId: null },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
    }),
    prisma.note.findMany({
      orderBy: { updatedAt: "desc" },
      take: 15,
    }),
    prisma.event.findMany({
      where: { startDate: { gte: today } },
      orderBy: { startDate: "asc" },
      take: 10,
    }),
  ])

  const dateStr = today.toLocaleDateString("es", { year: "numeric", month: "long", day: "numeric" })
  const lines: string[] = [`# Brain Dump — ${dateStr}`, ""]

  // Alerts
  const alerts: string[] = []
  habits.forEach((h) => {
    if (h.isNumeric && h.targetValue) {
      const recentLogs = h.logs.filter((l) => l.date >= since30)
      const values = recentLogs.filter((l) => l.value != null).map((l) => l.value!)
      if (values.length >= 7) {
        const avg = values.reduce((s, v) => s + v, 0) / values.length
        if (avg < h.targetValue * 0.8) {
          alerts.push(`- **${h.name}**: media ${avg.toFixed(1)}${h.unit ?? ""} (objetivo: ${h.targetValue}${h.unit ?? ""}) — por debajo del 80% del objetivo`)
        }
      }
    } else {
      const rate = calculateCompletionRate(h.logs, 30)
      if (rate < 50) {
        alerts.push(`- **${h.name}**: solo ${rate}% de completado en los últimos 30 días`)
      }
    }
  })

  if (alerts.length > 0) {
    lines.push("## ⚠️ Alertas detectadas", ...alerts, "")
  }

  // Habits
  lines.push("## Hábitos (últimos 90 días)")
  if (habits.length === 0) {
    lines.push("Sin hábitos registrados.", "")
  } else {
    habits.forEach((h) => {
      const streak = calculateStreak(h.logs)
      const rate = calculateCompletionRate(h.logs, 30)
      lines.push(`### ${h.name}`)
      if (h.isNumeric && h.targetValue) {
        const values = h.logs.filter((l) => l.value != null).map((l) => l.value!)
        const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
        lines.push(`- Media: ${avg.toFixed(1)}${h.unit ?? ""} | Objetivo: ${h.targetValue}${h.unit ?? ""}`)
      }
      lines.push(`- Completado (30d): ${rate}% | Racha actual: ${streak} días`, "")
    })
  }

  // Tasks
  lines.push("## Tareas activas")
  if (tasks.length === 0) {
    lines.push("Sin tareas pendientes.", "")
  } else {
    const priority: Record<string, string> = { urgent: "🔴", high: "🟠", medium: "🟡", low: "🟢" }
    tasks.forEach((t) => {
      const due = t.dueDate ? ` — vence ${formatDate(t.dueDate)}` : ""
      lines.push(`- ${priority[t.priority] ?? "•"} **${t.title}**${due}`)
    })
    lines.push("")
  }

  // Notes
  lines.push("## Notas recientes")
  if (notes.length === 0) {
    lines.push("Sin notas.", "")
  } else {
    notes.forEach((n) => {
      lines.push(`### ${n.title}`)
      lines.push(`*Editada: ${formatDate(n.updatedAt)}*`)
      lines.push(n.content || "(sin contenido)", "")
    })
  }

  // Events
  lines.push("## Eventos próximos")
  if (events.length === 0) {
    lines.push("Sin eventos.", "")
  } else {
    events.forEach((e) => {
      lines.push(`- **${e.title}** — ${formatDate(e.startDate)}`)
    })
    lines.push("")
  }

  lines.push("---")
  lines.push("*Exportado desde Second Brain. Pega este contenido en Claude.ai o Gemini para análisis avanzado.*")

  return lines.join("\n")
}
