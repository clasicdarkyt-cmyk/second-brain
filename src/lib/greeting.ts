import { prisma } from "@/lib/prisma"
import { todayString, formatDate } from "@/lib/utils"
import { addDays } from "date-fns"

export async function buildGreeting(): Promise<string> {
  const today = todayString()
  const in3days = addDays(new Date(), 3)

  const [upcomingTasks, upcomingEvents, habits] = await Promise.all([
    prisma.task.findMany({
      where: { status: { not: "done" }, dueDate: { lte: in3days }, parentId: null },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 5,
    }),
    prisma.event.findMany({
      where: { startDate: { gte: new Date(), lte: addDays(new Date(), 7) } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.habit.findMany({
      where: { archived: false },
      include: { logs: { where: { date: today } } },
      take: 10,
    }),
  ])

  const hour = new Date().getHours()
  const saludo = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches"

  const lines: string[] = [`${saludo} 👋`]

  const pendingToday = habits.filter((h) => !h.logs.some((l) => l.completed))
  if (pendingToday.length > 0) {
    lines.push(`\nHábitos pendientes hoy: ${pendingToday.map((h) => h.name).join(", ")}.`)
  }

  if (upcomingTasks.length > 0) {
    lines.push(`\nTareas próximas:`)
    upcomingTasks.forEach((t) => {
      const fecha = t.dueDate ? ` (${formatDate(t.dueDate)})` : ""
      const prio = t.priority === "urgent" ? "🔴 " : t.priority === "high" ? "🟠 " : ""
      lines.push(`  ${prio}${t.title}${fecha}`)
    })
  }

  if (upcomingEvents.length > 0) {
    lines.push(`\nEventos esta semana:`)
    upcomingEvents.forEach((e) => {
      lines.push(`  • ${e.title} — ${formatDate(e.startDate)}`)
    })
  }

  if (upcomingTasks.length === 0 && upcomingEvents.length === 0 && pendingToday.length === 0) {
    lines.push("\nTodo en orden. ¡Buen día! 🎉")
  }

  return lines.join("\n")
}
