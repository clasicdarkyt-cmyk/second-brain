"use client"

import { useState } from "react"
import { ChevronRight, Folder, FolderOpen, Plus, Pencil, Trash2, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Folder as FolderType } from "@/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Props {
  folders: FolderType[]
  selectedFolderId: string | null
  onSelect: (id: string | null) => void
  onRefresh: () => void
}

interface FolderNodeProps {
  folder: FolderType
  depth: number
  selectedFolderId: string | null
  onSelect: (id: string | null) => void
  onRefresh: () => void
}

function FolderNode({ folder, depth, selectedFolderId, onSelect, onRefresh }: FolderNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(folder.name)
  const isSelected = selectedFolderId === folder.id

  async function rename() {
    if (newName.trim() && newName !== folder.name) {
      await fetch(`/api/folders/${folder.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      })
      onRefresh()
    }
    setRenaming(false)
  }

  async function del() {
    if (!confirm(`¿Eliminar la carpeta "${folder.name}"? Las notas se moverán a la raíz.`)) return
    await fetch(`/api/folders/${folder.id}`, { method: "DELETE" })
    if (isSelected) onSelect(null)
    onRefresh()
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md px-2 py-1 cursor-pointer hover:bg-accent transition-colors",
          isSelected && "bg-accent"
        )}
        style={{ paddingLeft: `${(depth + 1) * 12}px` }}
      >
        <button onClick={() => setExpanded(!expanded)} className="shrink-0">
          {folder.children.length > 0 ? (
            <ChevronRight className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", expanded && "rotate-90")} />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        <button className="flex flex-1 items-center gap-1.5 min-w-0" onClick={() => onSelect(folder.id)}>
          {expanded ? <FolderOpen className="h-3.5 w-3.5 shrink-0 text-yellow-500" /> : <Folder className="h-3.5 w-3.5 shrink-0 text-yellow-500" />}
          {renaming ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => { if (e.key === "Enter") rename(); if (e.key === "Escape") setRenaming(false) }}
              className="h-5 text-xs py-0 px-1"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-sm truncate">{folder.name}</span>
          )}
          {folder._count && <span className="text-xs text-muted-foreground ml-auto shrink-0">{folder._count.notes}</span>}
        </button>

        <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
          <button onClick={(e) => { e.stopPropagation(); setRenaming(true) }} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted">
            <Pencil className="h-3 w-3 text-muted-foreground" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); del() }} className="h-5 w-5 flex items-center justify-center rounded hover:bg-muted">
            <Trash2 className="h-3 w-3 text-muted-foreground" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && folder.children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            {folder.children.map((child) => (
              <FolderNode key={child.id} folder={child} depth={depth + 1} selectedFolderId={selectedFolderId} onSelect={onSelect} onRefresh={onRefresh} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FolderTree({ folders, selectedFolderId, onSelect, onRefresh }: Props) {
  const [creating, setCreating] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  async function createFolder() {
    if (!newFolderName.trim()) return
    await fetch("/api/folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newFolderName }),
    })
    setNewFolderName("")
    setCreating(false)
    onRefresh()
  }

  return (
    <div className="space-y-0.5">
      {/* All notes */}
      <div
        className={cn("flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer hover:bg-accent transition-colors text-sm", selectedFolderId === null && "bg-accent")}
        onClick={() => onSelect(null)}
      >
        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
        Todas las notas
      </div>

      {folders.map((f) => (
        <FolderNode key={f.id} folder={f} depth={0} selectedFolderId={selectedFolderId} onSelect={onSelect} onRefresh={onRefresh} />
      ))}

      {creating ? (
        <div className="px-2">
          <Input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={createFolder}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setCreating(false) }}
            placeholder="Nombre de carpeta..."
            className="h-7 text-sm"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 px-2 py-1 w-full rounded-md hover:bg-accent transition-colors text-xs text-muted-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Nueva carpeta
        </button>
      )}
    </div>
  )
}
