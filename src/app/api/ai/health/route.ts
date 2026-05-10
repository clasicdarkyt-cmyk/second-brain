import { NextResponse } from "next/server"

export async function GET() {
  const base = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434"
  try {
    const res = await fetch(`${base}/api/tags`, { signal: AbortSignal.timeout(2000) })
    return NextResponse.json({ available: res.ok })
  } catch {
    return NextResponse.json({ available: false })
  }
}
