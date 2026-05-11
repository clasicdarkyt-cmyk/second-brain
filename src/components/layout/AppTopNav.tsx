"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, CalendarDays, CheckSquare, FileText, Flame, LayoutDashboard, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAIChatStore } from "@/store/aiChatStore"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/habits",    icon: Flame,           label: "Hábitos" },
  { href: "/notes",     icon: FileText,        label: "Notas" },
  { href: "/calendar",  icon: CalendarDays,    label: "Calendario" },
  { href: "/tasks",     icon: CheckSquare,     label: "Tareas" },
]

export function AppTopNav() {
  const pathname = usePathname()
  const { togglePanel } = useAIChatStore()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b bg-sidebar flex items-center px-4 gap-6">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground text-sm">Second Brain</span>
      </Link>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 h-8 rounded-md text-sm transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* AI Chat toggle */}
      <div className="ml-auto">
        <button
          onClick={togglePanel}
          className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          title="Asistente IA"
        >
          <MessageCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
