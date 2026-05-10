"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import FullCalendar from "@fullcalendar/react"
import dayGridPlugin from "@fullcalendar/daygrid"
import timeGridPlugin from "@fullcalendar/timegrid"
import interactionPlugin from "@fullcalendar/interaction"
import listPlugin from "@fullcalendar/list"
import esLocale from "@fullcalendar/core/locales/es"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm, Controller } from "react-hook-form"
import { CalendarEvent } from "@/types"

const EVENT_COLORS = ["#6366f1", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#a855f7", "#ef4444"]

interface EventFormData {
  title: string
  description: string
  start: string
  end: string
  allDay: boolean
  reminder: string
}

// datetime-local value for a given date string
function toDatetimeLocal(dateStr: string): string {
  if (!dateStr) return ""
  if (dateStr.includes("T")) return dateStr.slice(0, 16)
  return `${dateStr}T09:00`
}

const reminderTimers = new Map<string, ReturnType<typeof setTimeout>>()

function scheduleReminder(event: CalendarEvent) {
  if (!event.reminder || !event.start) return
  if (!("Notification" in window)) return
  const fireAt = new Date(event.start).getTime() - event.reminder * 60 * 1000
  const delay = fireAt - Date.now()
  if (delay <= 0) return
  if (reminderTimers.has(event.id)) clearTimeout(reminderTimers.get(event.id)!)
  reminderTimers.set(event.id, setTimeout(() => {
    Notification.requestPermission().then((p) => {
      if (p === "granted")
        new Notification(`Recordatorio: ${event.title}`, { body: `Comienza en ${event.reminder} minutos` })
    })
  }, delay))
}

// Shape FullCalendar expects
function toFCEvent(e: CalendarEvent) {
  return {
    id: e.id,
    title: e.title,
    start: e.start,
    end: e.end ?? undefined,
    allDay: e.allDay,
    backgroundColor: e.color,
    borderColor: e.color,
    extendedProps: { description: e.description, reminder: e.reminder },
  }
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null)
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedColor, setSelectedColor] = useState("#6366f1")

  const { register, handleSubmit, control, reset, setValue, formState: { isSubmitting, errors } } =
    useForm<EventFormData>({
      defaultValues: { allDay: false, reminder: "none", title: "", description: "", start: "", end: "" },
    })

  // Load ALL events (simple approach: fetch everything)
  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/events")
    const data: CalendarEvent[] = await res.json()
    data.forEach(scheduleReminder)
    setEvents(data)
  }, [])

  useEffect(() => { loadEvents() }, [loadEvents])

  // Sync date → form field when dialog opens
  useEffect(() => {
    if (formOpen) setValue("start", toDatetimeLocal(selectedDate))
  }, [formOpen, selectedDate, setValue])

  function openForm(date = "") {
    setSelectedDate(date)
    setSelectedColor("#6366f1")
    reset({ allDay: false, reminder: "none", title: "", description: "", start: "", end: "" })
    setFormOpen(true)
  }

  async function onSubmit(data: EventFormData) {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.title,
        description: data.description || null,
        start: data.start,
        end: data.end || null,
        allDay: data.allDay,
        color: selectedColor,
        reminder: data.reminder && data.reminder !== "none" ? parseInt(data.reminder) : null,
      }),
    })
    if (res.ok) {
      setFormOpen(false)
      await loadEvents()
    }
  }

  async function handleEventDrop(info: {
    event: { id: string; startStr: string; endStr: string; allDay: boolean }
  }) {
    await fetch(`/api/events/${info.event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: info.event.startStr, end: info.event.endStr || null, allDay: info.event.allDay }),
    })
    await loadEvents()
  }

  async function handleEventResize(info: { event: { id: string; startStr: string; endStr: string } }) {
    await fetch(`/api/events/${info.event.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: info.event.startStr, end: info.event.endStr }),
    })
    await loadEvents()
  }

  async function handleEventClick(info: { event: { id: string; title: string } }) {
    if (confirm(`¿Eliminar el evento "${info.event.title}"?`)) {
      await fetch(`/api/events/${info.event.id}`, { method: "DELETE" })
      await loadEvents()
    }
  }

  return (
    <div className="p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <Button onClick={() => openForm()}>
          <Plus className="h-4 w-4" /> Nuevo evento
        </Button>
      </div>

      <div className="flex-1 overflow-hidden">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          locale={esLocale}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,listWeek",
          }}
          events={events.map(toFCEvent)}
          editable
          selectable
          select={(info) => openForm(info.startStr)}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo evento</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="ev-title">Título *</Label>
              <Input
                id="ev-title"
                {...register("title", { required: true })}
                placeholder="Nombre del evento"
                autoFocus
              />
              {errors.title && <p className="text-xs text-destructive">El título es obligatorio</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="ev-desc">Descripción</Label>
              <Textarea id="ev-desc" {...register("description")} placeholder="Opcional..." className="min-h-[60px]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ev-start">Inicio</Label>
                <Input id="ev-start" type="datetime-local" {...register("start")} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ev-end">Fin</Label>
                <Input id="ev-end" type="datetime-local" {...register("end")} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label>Todo el día</Label>
              <Controller control={control} name="allDay" render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )} />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2 flex-wrap">
                {EVENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      outline: selectedColor === c ? `3px solid ${c}` : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Recordatorio</Label>
              <Controller control={control} name="reminder" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin recordatorio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin recordatorio</SelectItem>
                    <SelectItem value="5">5 minutos antes</SelectItem>
                    <SelectItem value="15">15 minutos antes</SelectItem>
                    <SelectItem value="30">30 minutos antes</SelectItem>
                    <SelectItem value="60">1 hora antes</SelectItem>
                    <SelectItem value="1440">1 día antes</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar evento"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
