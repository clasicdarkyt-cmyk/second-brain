"use client"

import { useEffect, useRef, useState } from "react"
import { X, Send, Download, Bot, User, Loader2, Wifi, WifiOff } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useAIChatStore } from "@/store/aiChatStore"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { v4 as uuidv4 } from "uuid"

export function AIChatPanel() {
  const { isOpen, togglePanel, messages, isLoading, greeting, addMessage, setLoading, appendToLastMessage } = useAIChatStore()
  const [input, setInput] = useState("")
  const [ollamaAvailable, setOllamaAvailable] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    fetch("/api/ai/health")
      .then((r) => r.json())
      .then((d) => setOllamaAvailable(d.available))
      .catch(() => setOllamaAvailable(false))
  }, [isOpen])

  async function sendMessage() {
    if (!input.trim() || isLoading) return
    const userMsg = { id: uuidv4(), role: "user" as const, content: input.trim(), timestamp: new Date() }
    addMessage(userMsg)
    setInput("")
    setLoading(true)
    const assistantMsg = { id: uuidv4(), role: "assistant" as const, content: "", timestamp: new Date() }
    addMessage(assistantMsg)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })) }),
      })
      if (!res.body) return
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        appendToLastMessage(decoder.decode(value))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="flex h-full w-[380px] flex-col border-l bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              <span className="font-semibold">Asistente IA</span>
              {ollamaAvailable !== null && (
                ollamaAvailable
                  ? <Wifi className="h-3 w-3 text-green-500" />
                  : <WifiOff className="h-3 w-3 text-muted-foreground" />
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={togglePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <Tabs defaultValue="chat" className="flex flex-1 flex-col overflow-hidden">
            <TabsList className="mx-4 mt-2 w-auto">
              <TabsTrigger value="chat" className="flex-1">Chat</TabsTrigger>
              <TabsTrigger value="export" className="flex-1">Exportar</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex flex-1 flex-col overflow-hidden mt-0 p-0">
              <ScrollArea className="flex-1 px-4 py-2">
                {/* Greeting */}
                {greeting && messages.length === 0 && (
                  <div className="mb-4 rounded-lg bg-primary/10 p-3 text-sm text-foreground">
                    <p className="font-medium text-primary mb-1">Resumen del día</p>
                    <p className="whitespace-pre-wrap">{greeting}</p>
                  </div>
                )}

                {/* No Ollama warning */}
                {ollamaAvailable === false && (
                  <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm dark:border-orange-900 dark:bg-orange-950">
                    <p className="font-medium text-orange-700 dark:text-orange-400 mb-1">Ollama no detectado</p>
                    <p className="text-orange-600 dark:text-orange-500">
                      Para usar el chat IA instala Ollama:
                    </p>
                    <code className="mt-1 block rounded bg-orange-100 dark:bg-orange-900 px-2 py-1 text-xs font-mono">
                      winget install Ollama.Ollama
                    </code>
                    <p className="mt-1 text-orange-600 dark:text-orange-500">
                      Luego: <code className="text-xs">ollama pull llama3.2</code>
                    </p>
                  </div>
                )}

                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("mb-3 flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                  >
                    <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                      msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    )}>
                      {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                    </div>
                    <div className={cn("max-w-[85%] rounded-lg px-3 py-2 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground"
                    )}>
                      {msg.content || (isLoading && msg.role === "assistant" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : null)}
                    </div>
                  </motion.div>
                ))}
                <div ref={bottomRef} />
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-3 flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Pregunta sobre tus notas, tareas..."
                  className="min-h-0 h-9 resize-none py-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                />
                <Button size="icon" onClick={sendMessage} disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="export" className="flex-1 overflow-hidden mt-0">
              <BrainDumpTab />
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function BrainDumpTab() {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai/export")
      const data = await res.json()
      setPreview(data.markdown)
    } finally {
      setLoading(false)
    }
  }

  async function copy() {
    if (!preview) return
    await navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-3 p-4 h-full">
      <div>
        <h3 className="font-semibold text-sm">Brain Dump</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Exporta todos tus datos como Markdown para analizarlos en Claude.ai o Gemini.
        </p>
      </div>

      <Button onClick={generate} disabled={loading} className="w-full">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {loading ? "Generando..." : "Generar exportación"}
      </Button>

      {preview && (
        <>
          <ScrollArea className="flex-1 rounded-md border bg-muted p-3">
            <pre className="text-xs whitespace-pre-wrap font-mono">{preview}</pre>
          </ScrollArea>
          <Button variant="outline" onClick={copy} className="w-full">
            {copied ? "¡Copiado!" : "Copiar al portapapeles"}
          </Button>
        </>
      )}
    </div>
  )
}
