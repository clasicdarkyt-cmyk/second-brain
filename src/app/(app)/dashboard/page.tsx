import { prisma } from "@/lib/prisma"
import { calculateStreak, calculateCompletionRate, todayString, formatDate } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flame, CheckSquare, CalendarDays, FileText, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { addDays } from "date-fns"

async function getDashboardData() {
  const now = new Date()
  const today = todayString()
  const in3days = addDays(now, 3)
  const in7days = addDays(now, 7)

  const [habits, upcomingTasks, upcomingEvents, noteCount] = await Promise.all([
    prisma.habit.findMany({
      where: { archived: false },
      include: { logs: { orderBy: { date: "desc" }, take: 90 } },
    }),
    prisma.task.findMany({
      where: { status: { not: "done" }, dueDate: { lte: in3days }, parentId: null },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.event.findMany({
      where: { startDate: { gte: now, lte: in7days } },
      orderBy: { startDate: "asc" },
      take: 5,
    }),
    prisma.note.count(),
  ])

  const habitStats = habits.map((h) => ({
    ...h,
    streak: calculateStreak(h.logs),
    completionRate: calculateCompletionRate(h.logs),
    todayCompleted: h.logs.some((l) => l.date === today && l.completed),
  }))

  return { habitStats, upcomingTasks, upcomingEvents, noteCount }
}

export default async function DashboardPage() {
  const { habitStats, upcomingTasks, upcomingEvents, noteCount } = await getDashboardData()

  const topStreak = habitStats.reduce((best, h) => h.streak > best ? h.streak : best, 0)
  const avgCompletion = habitStats.length
    ? Math.round(habitStats.reduce((s, h) => s + h.completionRate, 0) / habitStats.length)
    : 0

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">{formatDate(new Date())}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-orange-500/10 p-2">
              <Flame className="h-5 w-5 text-orange-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{topStreak}</p>
              <p className="text-xs text-muted-foreground">Racha máxima</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{avgCompletion}%</p>
              <p className="text-xs text-muted-foreground">Completado medio</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-blue-500/10 p-2">
              <CheckSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingTasks.length}</p>
              <p className="text-xs text-muted-foreground">Tareas próximas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-green-500/10 p-2">
              <FileText className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{noteCount}</p>
              <p className="text-xs text-muted-foreground">Notas guardadas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><CheckSquare className="h-4 w-4" /> Tareas próximas</span>
              <Link href="/tasks" className="text-xs text-muted-foreground hover:text-foreground">Ver todas</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay tareas urgentes.</p>
            ) : upcomingTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {t.priority === "urgent" && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                  <span className="truncate max-w-[200px]">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <Badge variant="outline" className="text-xs capitalize">{t.priority}</Badge>
                  {t.dueDate && <span className="text-xs text-muted-foreground">{formatDate(t.dueDate)}</span>}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Eventos (7 días)</span>
              <Link href="/calendar" className="text-xs text-muted-foreground hover:text-foreground">Ver calendario</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay eventos próximos.</p>
            ) : upcomingEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                <span className="truncate flex-1">{e.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(e.startDate)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2"><Flame className="h-4 w-4" /> Hábitos hoy</span>
              <Link href="/habits" className="text-xs text-muted-foreground hover:text-foreground">Ver todos</Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {habitStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">No tienes hábitos. <Link href="/habits" className="underline">Crea uno</Link>.</p>
            ) : habitStats.map((h) => (
              <div key={h.id} className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                <span className="text-sm flex-1 truncate">{h.name}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {h.streak > 0 && <span className="text-xs text-orange-500 font-medium">🔥 {h.streak}</span>}
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center text-xs ${
                    h.todayCompleted ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
                  }`}>
                    {h.todayCompleted ? "✓" : "○"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
