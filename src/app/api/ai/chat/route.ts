import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { buildContext } from "@/lib/ai-context-builder"

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2"

const SYSTEM = `Eres el asistente personal del usuario dentro de su aplicación Second Brain.
Tienes acceso a sus notas, tareas, hábitos y eventos a través del contexto proporcionado.
Responde en español, de forma concisa y útil.
Si el usuario pregunta por datos específicos, refiere siempre a la información del contexto.
Si no encuentras información relevante en el contexto, dilo claramente.`

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { messages } = await req.json() as { messages: { role: string; content: string }[] }

  const lastUserMsg = messages.findLast((m) => m.role === "user")?.content ?? ""
  const context = await buildContext(lastUserMsg)

  const systemContent = context ? `${SYSTEM}\n\n${context}` : SYSTEM

  // Check Ollama availability
  try {
    await fetch(`${OLLAMA_BASE}/api/tags`, { signal: AbortSignal.timeout(1500) })
  } catch {
    return NextResponse.json({ error: "Ollama no disponible" }, { status: 503 })
  }

  const ollamaMessages = [
    { role: "system", content: systemContent },
    ...messages,
  ]

  const ollamaRes = await fetch(`${OLLAMA_BASE}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages: ollamaMessages, stream: true }),
  })

  if (!ollamaRes.ok || !ollamaRes.body) {
    return NextResponse.json({ error: "Error al contactar Ollama" }, { status: 502 })
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const reader = ollamaRes.body!.getReader()
      const decoder = new TextDecoder()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const lines = decoder.decode(value).split("\n").filter(Boolean)
          for (const line of lines) {
            try {
              const json = JSON.parse(line)
              const token = json?.message?.content
              if (token) controller.enqueue(encoder.encode(token))
              if (json?.done) { controller.close(); return }
            } catch { /* partial line */ }
          }
        }
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
