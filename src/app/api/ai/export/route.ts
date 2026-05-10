import { NextResponse } from "next/server"
import { generateBrainDump } from "@/lib/brain-dump"

export async function GET() {
  const markdown = await generateBrainDump()
  return NextResponse.json({ markdown })
}
