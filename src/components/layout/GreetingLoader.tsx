"use client"

import { useEffect } from "react"
import { useAIChatStore } from "@/store/aiChatStore"

export function GreetingLoader() {
  const setGreeting = useAIChatStore((s) => s.setGreeting)

  useEffect(() => {
    fetch("/api/ai/greeting")
      .then((r) => r.json())
      .then((d) => { if (d.greeting) setGreeting(d.greeting) })
      .catch(() => {})
  }, [setGreeting])

  return null
}
