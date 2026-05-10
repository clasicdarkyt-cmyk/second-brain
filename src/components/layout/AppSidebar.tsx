"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Brain, CalendarDays, CheckSquare, FileText, Flame, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAIChatStore } from "@/store/aiChatStore"

const navItems = [
  { href: "/", icon: Brain,        label: "Dashboard" },
  { href: "/habits",   icon: Flame,         label: "Hábitos" },
  { href: "/notes",    icon: FileText,      label: "Notas" },
  { href: "/calendar", icon: CalendarDays,  label: "Calendario" },
  { href: "/tasks",    icon: CheckSquare,   label: "Tareas" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { togglePanel } = useAIChatStore()

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="flex h-full w-16 flex-col items-center border-r bg-sidebar py-4 gap-1">
        {/* Logo */}
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Brain className="h-5 w-5 text-primary-foreground" />
        </div>

        <nav className="flex flex-1 flex-col items-center gap-1">
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = href === "/" ? pathname === "/" : pathname.startsWith(href)
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="sr-only">{label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            )
          })}
        </nav>

        {/* AI Chat toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={togglePanel}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Asistente IA</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Asistente IA</TooltipContent>
        </Tooltip>
      </aside>
    </TooltipProvider>
  )
}
