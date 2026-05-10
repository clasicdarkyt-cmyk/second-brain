"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Habit } from "@/types"

const COLORS = ["#6366f1", "#ec4899", "#f97316", "#22c55e", "#06b6d4", "#a855f7", "#eab308", "#ef4444"]

const schema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  description: z.string().optional(),
  color: z.string(),
  icon: z.string().optional(),
  isNumeric: z.boolean(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  onSave: () => void
  habit?: Habit
}

export function HabitForm({ open, onClose, onSave, habit }: Props) {
  const [color, setColor] = useState(habit?.color ?? "#6366f1")
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: habit?.name ?? "",
      description: habit?.description ?? "",
      color: habit?.color ?? "#6366f1",
      isNumeric: habit?.isNumeric ?? false,
      targetValue: habit?.targetValue ?? undefined,
      unit: habit?.unit ?? "",
    },
  })

  const isNumeric = watch("isNumeric")

  async function onSubmit(data: FormData) {
    const url = habit ? `/api/habits/${habit.id}` : "/api/habits"
    const method = habit ? "PUT" : "POST"
    await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, color }),
    })
    onSave()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{habit ? "Editar hábito" : "Nuevo hábito"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input {...register("name")} placeholder="Ej: Sueño, Ejercicio..." />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Descripción (opcional)</Label>
            <Input {...register("description")} placeholder="Describe tu hábito" />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setValue("color", c) }}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : "none", outlineOffset: "2px" }}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Hábito numérico</Label>
              <p className="text-xs text-muted-foreground">Registra un valor en lugar de solo marcar (ej. horas de sueño)</p>
            </div>
            <Switch
              checked={isNumeric}
              onCheckedChange={(v) => setValue("isNumeric", v)}
            />
          </div>

          {isNumeric && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Objetivo</Label>
                <Input
                  type="number"
                  step="0.1"
                  {...register("targetValue", { valueAsNumber: true })}
                  placeholder="7"
                />
              </div>
              <div className="space-y-1">
                <Label>Unidad</Label>
                <Input {...register("unit")} placeholder="horas, km, vasos..." />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
