"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Save, Pin, Trash2 } from "lucide-react"
import { Note } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { formatRelative } from "@/lib/utils"

interface Props {
  note: Note
  onUpdate: () => void
  onDelete: () => void
}

export function NoteEditor({ note, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setTitle(note.title)
    setContent(note.content)
    setSaveState("idle")
  }, [note.id])

  const save = useCallback(async (t: string, c: string) => {
    setSaveState("saving")
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, content: c }),
    })
    setSaveState("saved")
    onUpdate()
    setTimeout(() => setSaveState("idle"), 1500)
  }, [note.id, onUpdate])

  function handleChange(t: string, c: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(t, c), 1500)
  }

  async function togglePin() {
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    onUpdate()
  }

  async function del() {
    if (!confirm("¿Eliminar esta nota?")) return
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
    onDelete()
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {saveState === "saving" && "Guardando..."}
            {saveState === "saved" && "Guardado ✓"}
            {saveState === "idle" && `Editado ${formatRelative(note.updatedAt)}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={togglePin} title={note.pinned ? "Desanclar" : "Anclar"}>
            <Pin className={`h-4 w-4 ${note.pinned ? "fill-current text-primary" : "text-muted-foreground"}`} />
          </Button>
          <Button variant="ghost" size="icon" onClick={del} title="Eliminar">
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden p-4 gap-3">
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); handleChange(e.target.value, content) }}
          placeholder="Título de la nota"
          className="text-xl font-bold border-0 shadow-none px-0 text-foreground focus-visible:ring-0 bg-transparent"
        />
        <Textarea
          value={content}
          onChange={(e) => { setContent(e.target.value); handleChange(title, e.target.value) }}
          placeholder="Escribe en Markdown o texto libre..."
          className="flex-1 resize-none border-0 shadow-none px-0 bg-transparent focus-visible:ring-0 font-mono text-sm leading-relaxed"
        />
      </div>
    </div>
  )
}
