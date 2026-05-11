"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Pin, Trash2, Save, Loader2 } from "lucide-react"
import { Note } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatRelative } from "@/lib/utils"

interface Props {
  note: Note | null
  open: boolean
  onClose: () => void
  onUpdate: () => void
  onDelete: () => void
}

export function NoteEditorModal({ note, open, onClose, onUpdate, onDelete }: Props) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle")
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (note) {
      setTitle(note.title)
      setContent(note.content)
      setSaveState("idle")
    }
  }, [note?.id])

  const save = useCallback(async (t: string, c: string, silent = false) => {
    if (!note) return
    if (!silent) setSaveState("saving")
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: t, content: c }),
    })
    onUpdate()
    if (!silent) {
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 1500)
    }
  }, [note?.id, onUpdate])

  function handleChange(t: string, c: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => save(t, c), 1500)
  }

  async function handleSaveAndClose() {
    if (timerRef.current) clearTimeout(timerRef.current)
    await save(title, content, true)
    onClose()
  }

  async function togglePin() {
    if (!note) return
    await fetch(`/api/notes/${note.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned: !note.pinned }),
    })
    onUpdate()
  }

  async function del() {
    if (!note) return
    if (!confirm("¿Eliminar esta nota?")) return
    await fetch(`/api/notes/${note.id}`, { method: "DELETE" })
    onDelete()
    onClose()
  }

  if (!note) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleSaveAndClose() }}>
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="flex flex-row items-center justify-between border-b px-5 py-3 shrink-0 space-y-0">
          <DialogTitle className="sr-only">Editor de nota</DialogTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {saveState === "saving" && <><Loader2 className="h-3 w-3 inline animate-spin mr-1" />Guardando...</>}
              {saveState === "saved" && "Guardado ✓"}
              {saveState === "idle" && `Editado ${formatRelative(note.updatedAt)}`}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={togglePin} title={note.pinned ? "Desanclar" : "Anclar"}>
              <Pin className={`h-4 w-4 ${note.pinned ? "fill-current text-primary" : "text-muted-foreground"}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={del} title="Eliminar nota">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
            <Button size="sm" onClick={handleSaveAndClose} className="ml-2 gap-1.5">
              <Save className="h-3.5 w-3.5" />
              Guardar nota
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden p-5 gap-3">
          <Input
            value={title}
            onChange={(e) => { setTitle(e.target.value); handleChange(e.target.value, content) }}
            placeholder="Título de la nota"
            className="text-2xl font-bold border-0 shadow-none px-0 focus-visible:ring-0 bg-transparent h-auto py-1"
          />
          <Textarea
            value={content}
            onChange={(e) => { setContent(e.target.value); handleChange(title, e.target.value) }}
            placeholder="Escribe en Markdown o texto libre..."
            className="flex-1 resize-none border-0 shadow-none px-0 bg-transparent focus-visible:ring-0 font-mono text-sm leading-relaxed"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
