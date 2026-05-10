"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, FileText, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FolderTree } from "@/components/notes/FolderTree"
import { NoteEditor } from "@/components/notes/NoteEditor"
import { Note, Folder } from "@/types"
import { formatRelative, truncate, cn } from "@/lib/utils"

export default function NotesPage() {
  const [folders, setFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [search, setSearch] = useState("")

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/folders")
    setFolders(await res.json())
  }, [])

  const loadNotes = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    else if (selectedFolder !== null) params.set("folderId", selectedFolder ?? "root")
    else params.set("folderId", "root")
    const res = await fetch(`/api/notes?${params}`)
    const data: Note[] = await res.json()
    setNotes(data)
    if (selectedNote && !data.find((n) => n.id === selectedNote.id)) {
      setSelectedNote(data[0] ?? null)
    }
  }, [search, selectedFolder, selectedNote])

  useEffect(() => { loadFolders() }, [])
  useEffect(() => { loadNotes() }, [selectedFolder, search])

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nueva nota", content: "", folderId: selectedFolder }),
    })
    const note = await res.json()
    await loadNotes()
    setSelectedNote(note)
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar notas..."
              className="h-7 pl-7 text-xs"
            />
          </div>
        </div>
        <ScrollArea className="flex-1 p-2">
          <FolderTree
            folders={folders}
            selectedFolderId={selectedFolder}
            onSelect={(id) => { setSelectedFolder(id); setSearch("") }}
            onRefresh={loadFolders}
          />
        </ScrollArea>
        <div className="p-2 border-t">
          <Button onClick={createNote} size="sm" className="w-full">
            <Plus className="h-3.5 w-3.5" /> Nueva nota
          </Button>
        </div>
      </div>

      {/* Note list */}
      <div className="w-60 border-r flex flex-col shrink-0">
        <div className="p-3 border-b">
          <p className="text-xs font-medium text-muted-foreground">{notes.length} notas</p>
        </div>
        <ScrollArea className="flex-1">
          {notes.length === 0 ? (
            <div className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">Sin notas aquí</p>
            </div>
          ) : notes.map((note) => (
            <div
              key={note.id}
              className={cn("p-3 border-b cursor-pointer hover:bg-accent transition-colors", selectedNote?.id === note.id && "bg-accent")}
              onClick={() => setSelectedNote(note)}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                <p className="text-sm font-medium truncate">{note.title || "Sin título"}</p>
              </div>
              <p className="text-xs text-muted-foreground truncate">{truncate(note.content.replace(/[#*`]/g, ""), 60) || "Nota vacía"}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{formatRelative(note.updatedAt)}</p>
            </div>
          ))}
        </ScrollArea>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        {selectedNote ? (
          <NoteEditor
            key={selectedNote.id}
            note={selectedNote}
            onUpdate={loadNotes}
            onDelete={() => { setSelectedNote(null); loadNotes() }}
          />
        ) : (
          <div className="flex h-full items-center justify-center flex-col gap-3">
            <FileText className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-muted-foreground text-sm">Selecciona una nota o crea una nueva</p>
            <Button onClick={createNote}><Plus className="h-4 w-4" /> Nueva nota</Button>
          </div>
        )}
      </div>
    </div>
  )
}
