"use client"

import { useState } from "react"
import { Flame, MoreVertical, Pencil, Trash2, Check } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Habit } from "@/types"
import { todayString } from "@/lib/utils"

interface Props {
  habit: Habit
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

// Inline dropdown since we're not using shadcn CLI
function DropdownMenu({ children }: { children: React.ReactNode }) { return <div className="relative">{children}</div> }
function DropdownMenuTriggerInline({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return <div onClick={onClick}>{children}</div>
}

export function HabitCard({ habit, onEdit, onDelete, onToggle }: Props) {
  const [open, setOpen] = useState(false)
  const [numValue, setNumValue] = useState("")
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    await fetch(`/api/habits/${habit.id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayString() }),
    })
    setLoading(false)
    onToggle()
  }

  async function submitValue() {
    if (!numValue) return
    setLoading(true)
    await fetch(`/api/habits/${habit.id}/logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayString(), value: parseFloat(numValue) }),
    })
    setNumValue("")
    setLoading(false)
    onToggle()
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1 w-full" style={{ backgroundColor: habit.color }} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: habit.color + "20" }}>
              <div className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">{habit.name}</p>
              {habit.description && <p className="text-xs text-muted-foreground truncate">{habit.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 ml-2">
            <button onClick={onEdit} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button onClick={onDelete} className="h-7 w-7 flex items-center justify-center rounded hover:bg-muted transition-colors">
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-3 text-sm">
          <div className="flex items-center gap-1 text-orange-500">
            <Flame className="h-4 w-4" />
            <span className="font-semibold">{habit.currentStreak}</span>
            <span className="text-xs text-muted-foreground">días</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {habit.completionRate}% este mes
          </div>
          {habit.isNumeric && habit.targetValue && (
            <div className="text-xs text-muted-foreground">
              Objetivo: {habit.targetValue}{habit.unit ?? ""}
            </div>
          )}
        </div>

        {/* Completion bar */}
        <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: habit.color }}
            initial={{ width: 0 }}
            animate={{ width: `${habit.completionRate}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        </div>

        {/* Toggle / numeric input */}
        {habit.isNumeric ? (
          <div className="flex gap-2">
            <Input
              type="number"
              step="0.1"
              value={numValue}
              onChange={(e) => setNumValue(e.target.value)}
              placeholder={`Hoy: ${habit.todayValue ?? "—"}${habit.unit ?? ""}`}
              className="h-8 text-sm"
              onKeyDown={(e) => e.key === "Enter" && submitValue()}
            />
            <Button size="sm" onClick={submitValue} disabled={loading || !numValue}
              style={{ backgroundColor: habit.color, borderColor: habit.color }}
              className="text-white shrink-0"
            >
              OK
            </Button>
          </div>
        ) : (
          <button
            onClick={toggle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-lg text-sm font-medium transition-all"
            style={
              habit.todayCompleted
                ? { backgroundColor: habit.color, color: "white" }
                : { backgroundColor: habit.color + "15", color: habit.color, border: `1px solid ${habit.color}40` }
            }
          >
            {habit.todayCompleted ? (
              <><Check className="h-4 w-4" /> Completado hoy</>
            ) : (
              <>Marcar hoy</>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
