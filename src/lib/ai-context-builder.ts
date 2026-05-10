import { prisma } from "@/lib/prisma"
import { todayString, calculateStreak } from "@/lib/utils"
import { subDays } from "date-fns"

export async function buildContext(userMessage: string): Promise<string> {
  const lower = userMessage.toLowerCase()
  const parts: string[] = []

  const mentionsNotes = /nota|apunte|archivo|documento|escrib|contraseña|password|password/i.test(lower)
  const mentionsTasks = /tarea|pendiente|hacer|trabajo|proyecto|deadline|fecha/i.test(lower)
  const mentionsHabits = /hábito|habito|rutina|sueño|ejercicio|deporte|racha|streak/i.test(lower)
  const mentionsEvents = /evento|reunión|reunion|cita|calendario|semana/i.test(lower)

  // Always load a light summary
  const today = todayString()

  if (mentionsNotes || (!mentionsTasks && !mentionsHabits && !mentionsEvents)) {
    // Extract keywords (words > 3 chars, not stopwords)
    const stopwords = new Set(["tengo", "tiene", "algo", "sobre", "para", "como", "que", "una", "mis", "los", "las"])
    const keywords = lower.split(/\s+/).filter((w) => w.length > 3 && !stopwords.has(w))

    if (keywords.length > 0) {
      const notes = await prisma.note.findMany({
        where: {
          OR: keywords.map((k) => ({
            OR: [
              { title: { contains: k } },
              { content: { contains: k } },
            ],
          })),
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      })

      if (notes.length > 0) {
        parts.push("## Notas encontradas")
        notes.forEach((n) => {
          const preview = n.content.slice(0, 300)
          parts.push(`### ${n.title}\n${preview}${n.content.length > 300 ? "…" : ""}`)
        })
      } else if (mentionsNotes) {
        parts.push("## Notas\nNo se encontraron notas con esas palabras clave.")
      }
    }
  }

  if (mentionsTasks) {
    const tasks = await prisma.task.findMany({
      where: { status: { not: "done" }, parentId: null },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      take: 10,
    })
    if (tasks.length > 0) {
      parts.push("## Tareas activas")
      tasks.forEach((t) => {
        const due = t.dueDate ? ` — vence ${t.dueDate.toLocaleDateString("es")}` : ""
        parts.push(`- [${t.priority.toUpperCase()}] ${t.title}${due}`)
      })
    }
  }

  if (mentionsHabits) {
    const since = subDays(new Date(), 30).toISOString().split("T")[0]
    const habits = await prisma.habit.findMany({
      where: { archived: false },
      include: { logs: { where: { date: { gte: since } } } },
    })
    if (habits.length > 0) {
      parts.push("## Hábitos (últimos 30 días)")
      habits.forEach((h) => {
        const streak = calculateStreak(h.logs)
        const completed = h.logs.filter((l) => l.completed).length
        const rate = Math.round((completed / 30) * 100)
        const todayDone = h.logs.some((l) => l.date === today && l.completed)
        parts.push(`- **${h.name}**: racha ${streak} días, ${rate}% completado${todayDone ? ", ✓ hecho hoy" : ""}`)
      })
    }
  }

  if (mentionsEvents) {
    const events = await prisma.event.findMany({
      where: { startDate: { gte: new Date() } },
      orderBy: { startDate: "asc" },
      take: 5,
    })
    if (events.length > 0) {
      parts.push("## Eventos próximos")
      events.forEach((e) => {
        parts.push(`- ${e.title} — ${e.startDate.toLocaleDateString("es")}`)
      })
    }
  }

  if (parts.length === 0) return ""
  return `# Contexto de tu Second Brain\n\n${parts.join("\n\n")}`
}
