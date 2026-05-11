"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, CheckCircle2, Circle, ChevronDown, ChevronRight, Trash2, Calendar, Flag } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Task } from "@/types"
import { cn, formatDate, getPriorityColor, getPriorityLabel, getStatusLabel } from "@/lib/utils"
import { useForm } from "react-hook-form"

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-500",
  low: "bg-green-500",
}

function TaskRow({ task, onUpdate, onDelete, onRefresh, depth = 0 }: {
  task: Task; onUpdate: (id: string, data: Partial<Task>) => void
  onDelete: (id: string) => void; onRefresh: () => void; depth?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const [addingSubtask, setAddingSubtask] = useState(false)
  const [subtaskTitle, setSubtaskTitle] = useState("")

  async function toggleStatus() {
    const next = task.status === "done" ? "todo" : task.status === "todo" ? "in_progress" : "done"
    onUpdate(task.id, { status: next })
  }

  async function addSubtask() {
    if (!subtaskTitle.trim()) return
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: subtaskTitle, parentId: task.id }),
    })
    setSubtaskTitle("")
    setAddingSubtask(false)
    onRefresh()
  }

  return (
    <div>
      <div className={cn("group flex items-center gap-2 rounded-lg p-2 hover:bg-accent/50 transition-colors", task.status === "done" && "opacity-60")}
        style={{ paddingLeft: `${(depth + 1) * 16}px` }}>

        <button onClick={toggleStatus} className="shrink-0">
          {task.status === "done"
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <Circle className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
          }
        </button>

        {task.subtasks.length > 0 && (
          <button onClick={() => setExpanded(!expanded)} className="shrink-0">
            {expanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
        )}

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full shrink-0", priorityColors[task.priority] ?? "bg-muted")} />
          <span className={cn("text-sm truncate", task.status === "done" && "line-through text-muted-foreground")}>{task.title}</span>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
              <Calendar className="h-3 w-3" />{formatDate(task.dueDate)}
            </span>
          )}
        </div>

        <div className="hidden group-hover:flex items-center gap-1 shrink-0">
          <button onClick={() => setAddingSubtask(!addingSubtask)} className="text-xs text-muted-foreground hover:text-foreground px-1">+ subtarea</button>
          <button onClick={() => onDelete(task.id)} className="h-6 w-6 flex items-center justify-center rounded hover:bg-muted">
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {addingSubtask && (
        <div className="flex gap-2 px-4 pb-2" style={{ paddingLeft: `${(depth + 2) * 16}px` }}>
          <Input
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            placeholder="Subtarea..."
            className="h-7 text-sm"
            autoFocus
            onKeyDown={(e) => { if (e.key === "Enter") addSubtask(); if (e.key === "Escape") setAddingSubtask(false) }}
          />
          <Button size="sm" className="h-7 px-2" onClick={addSubtask}>OK</Button>
        </div>
      )}

      <AnimatePresence>
        {expanded && task.subtasks.length > 0 && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            {task.subtasks.map((sub) => (
              <TaskRow key={sub.id} task={sub} onUpdate={onUpdate} onDelete={onDelete} onRefresh={onRefresh} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [statusFilter, setStatusFilter] = useState("active")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [formOpen, setFormOpen] = useState(false)
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{
    title: string; description: string; priority: string; dueDate: string
  }>()

  const load = useCallback(async () => {
    const params = new URLSearchParams()
    if (statusFilter !== "all" && statusFilter !== "active") params.set("status", statusFilter)
    if (priorityFilter !== "all") params.set("priority", priorityFilter)
    const res = await fetch(`/api/tasks?${params}`)
    let data: Task[] = await res.json()
    if (statusFilter === "active") data = data.filter((t) => t.status !== "done")
    setTasks(data)
  }, [statusFilter, priorityFilter])

  useEffect(() => { load() }, [load])

  async function updateTask(id: string, data: Partial<Task>) {
    await fetch(`/api/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    load()
  }

  async function deleteTask(id: string) {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    load()
  }

  async function onSubmit(data: { title: string; description: string; priority: string; dueDate: string }) {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, dueDate: data.dueDate || null }),
    })
    reset()
    setFormOpen(false)
    load()
  }

  const counts = {
    urgent: tasks.filter((t) => t.priority === "urgent" && t.status !== "done").length,
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tareas</h1>
          <p className="text-sm text-muted-foreground">{tasks.filter((t) => t.status !== "done").length} pendientes · {counts.done} completadas</p>
        </div>
        <Button onClick={() => setFormOpen(true)}><Plus className="h-4 w-4" /> Nueva tarea</Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="active">Activas</TabsTrigger>
            <TabsTrigger value="todo">Por hacer</TabsTrigger>
            <TabsTrigger value="in_progress">En progreso</TabsTrigger>
            <TabsTrigger value="done">Hechas</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-36 h-9">
            <Flag className="h-3.5 w-3.5 mr-1" />
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
            <SelectItem value="low">Baja</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Task list */}
      <div className="space-y-0.5">
        {tasks.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground">No hay tareas aquí.</p>
          </div>
        ) : tasks.map((task) => (
          <motion.div key={task.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
            <TaskRow task={task} onUpdate={updateTask} onDelete={deleteTask} onRefresh={load} />
          </motion.div>
        ))}
      </div>

      {/* Create task dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva tarea</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1">
              <Label>Título</Label>
              <Input {...register("title", { required: true })} placeholder="¿Qué necesitas hacer?" />
            </div>
            <div className="space-y-1">
              <Label>Descripción (opcional)</Label>
              <Textarea {...register("description")} placeholder="Más detalles..." className="min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Prioridad</Label>
                <select {...register("priority")} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm">
                  <option value="low">Baja</option>
                  <option value="medium" selected>Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label>Fecha límite</Label>
                <Input type="date" {...register("dueDate")} className="h-9" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>Crear tarea</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
