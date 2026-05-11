"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, FileText, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Note, Folder } from "@/types"
import { formatRelative, truncate } from "@/lib/utils"
import { NoteEditorModal } from "@/components/notes/NoteEditorModal"
import { NotesBreadcrumb, BreadcrumbItem } from "@/components/notes/NotesBreadcrumb"
import FolderIcon from "@/components/ui/Folder"

export default function NotesPage() {
  const [allFolders, setAllFolders] = useState<Folder[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: "Notas" }])
  const [search, setSearch] = useState("")
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const loadFolders = useCallback(async () => {
    const res = await fetch("/api/folders")
    setAllFolders(await res.json())
  }, [])

  const loadNotes = useCallback(async () => {
    const params = new URLSearchParams()
    if (search) {
      params.set("search", search)
    } else {
      params.set("folderId", currentFolderId ?? "root")
    }
    const res = await fetch(`/api/notes?${params}`)
    setNotes(await res.json())
  }, [search, currentFolderId])

  useEffect(() => { loadFolders() }, [])
  useEffect(() => { loadNotes() }, [currentFolderId, search])

  const visibleFolders = search
    ? []
    : allFolders.filter((f) => f.parentId === currentFolderId)

  function navigateToFolder(folder: Folder) {
    setCurrentFolderId(folder.id)
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }])
    setSearch("")
  }

  function handleBreadcrumbNavigate(id: string | null) {
    setCurrentFolderId(id)
    setBreadcrumb((prev) => {
      const idx = prev.findIndex((item) => item.id === id)
      return prev.slice(0, idx + 1)
    })
    setSearch("")
  }

  async function createNote() {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nueva nota", content: "", folderId: currentFolderId }),
    })
    const note = await res.json()
    await loadNotes()
    setSelectedNote(note)
    setModalOpen(true)
  }

  function openNote(note: Note) {
    setSelectedNote(note)
    setModalOpen(true)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar notas..."
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Button size="sm" onClick={createNote}>
          <Plus className="h-3.5 w-3.5" /> Nueva nota
        </Button>
      </div>

      {/* Breadcrumb */}
      {!search && (
        <div className="px-6 py-2.5 border-b shrink-0 bg-muted/30">
          <NotesBreadcrumb items={breadcrumb} onNavigate={handleBreadcrumbNavigate} />
        </div>
      )}

      {/* Grid */}
      <div className="flex-1 overflow-auto px-6 py-6">
        {visibleFolders.length === 0 && notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <FileText className="h-10 w-10 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">
              {search ? "Sin resultados" : "Esta carpeta está vacía"}
            </p>
            <Button size="sm" variant="outline" onClick={createNote}>
              <Plus className="h-3.5 w-3.5" /> Nueva nota
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Folders */}
            {visibleFolders.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Carpetas
                </h2>
                <div className="flex flex-wrap gap-6">
                  {visibleFolders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => navigateToFolder(folder)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/60 transition-colors group"
                    >
                      <div
                        className="flex items-center justify-center overflow-visible"
                        style={{ width: 200, height: 160 }}
                      >
                        <FolderIcon color="#5227FF" size={2} />
                      </div>
                      <span className="text-sm font-medium text-center leading-tight max-w-[120px] truncate group-hover:text-foreground">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Notes */}
            {notes.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {search ? "Resultados" : "Notas"}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => openNote(note)}
                      className="text-left flex flex-col gap-1.5 p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0" />}
                        <span className="text-sm font-medium truncate">
                          {note.title || "Sin título"}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {truncate(note.content.replace(/[#*`]/g, ""), 80) || "Nota vacía"}
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-auto pt-1">
                        {formatRelative(note.updatedAt)}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>

      <NoteEditorModal
        note={selectedNote}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onUpdate={loadNotes}
        onDelete={() => { setSelectedNote(null); loadNotes() }}
      />
    </div>
  )
}
