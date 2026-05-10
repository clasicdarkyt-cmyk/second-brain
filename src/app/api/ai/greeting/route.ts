import { NextResponse } from "next/server"
import { buildGreeting } from "@/lib/greeting"

export async function GET() {
  const greeting = await buildGreeting()
  return NextResponse.json({ greeting })
}
