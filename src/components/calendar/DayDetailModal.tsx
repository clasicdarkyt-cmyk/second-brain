"use client"

import { useEffect, useState } from "react"
import { format, parseISO, isSameDay } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, CheckSquare, Circle, CheckCircle2, Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CalendarEvent, Task } from "@/types"
import { cn } from "@/lib/utils"

interface Props {
  date: Date | null
  open: boolean
  onClose: () => void
  events: CalendarEvent[]
  onNewEvent: (date: string) => void
}

export function DayDetailModal({ date, open, onClose, events, onNewEvent }: Props) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  useEffect(() => {
    if (!date || !open) return
    setLoadingTasks(true)
    const dateStr = format(date, "yyyy-MM-dd")
    fetch(`/api/tasks?date=${dateStr}`)
      .then((r) => r.json())
      .then((data) => setTasks(data))
      .finally(() => setLoadingTasks(false))
  }, [date, open])

  if (!date) return null

  const dayEvents = events.filter((e) => {
    try {
      return isSameDay(parseISO(e.start), date)
    } catch {
      return false
    }
  })

  const dateStr = format(date, "yyyy-MM-dd")
  const dayLabel = format(date, "EEEE, d 'de' MMMM", { locale: es })
  const dayLabelCap = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            {dayLabelCap}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Events */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Eventos
              </h3>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs"
                onClick={() => { onClose(); onNewEvent(dateStr) }}
              >
                <Plus className="h-3 w-3 mr-1" /> Nuevo
              </Button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Sin eventos este día.</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/40">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      {!e.allDay && (
                        <p className="text-xs text-muted-foreground">
                          {format(parseISO(e.start), "HH:mm")}
                          {e.end ? ` - ${format(parseISO(e.end), "HH:mm")}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tasks */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Tareas del día
            </h3>

            {loadingTasks ? (
              <p className="text-sm text-muted-foreground py-1">Cargando...</p>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground py-1">Sin tareas para este día.</p>
            ) : (
              <div className="space-y-1.5">
                {tasks.map((t) => (
                  <div
                    key={t.id}
                    className={cn(
                      "flex items-center gap-2.5 p-2 rounded-lg",
                      t.status === "done" ? "opacity-60" : ""
                    )}
                  >
                    {t.status === "done" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn("text-sm truncate flex-1", t.status === "done" && "line-through text-muted-foreground")}>
                      {t.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
