"use client"

import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface BreadcrumbItem {
  id: string | null
  name: string
}

interface Props {
  items: BreadcrumbItem[]
  onNavigate: (id: string | null) => void
}

export function NotesBreadcrumb({ items, onNavigate }: Props) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      {items.map((item, i) => {
        const isLast = i === items.length - 1
        return (
          <span key={`${item.id}-${i}`} className="flex items-center gap-1">
            <button
              onClick={() => onNavigate(item.id)}
              className={cn(
                "transition-colors hover:text-foreground",
                isLast
                  ? "text-foreground font-medium cursor-default"
                  : "text-muted-foreground hover:underline"
              )}
              disabled={isLast}
            >
              {item.name}
            </button>
            {!isLast && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />}
          </span>
        )
      })}
    </nav>
  )
}
