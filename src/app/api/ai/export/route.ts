import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { generateBrainDump } from "@/lib/brain-dump"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const markdown = await generateBrainDump()
  return NextResponse.json({ markdown })
}
