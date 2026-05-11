import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

function serialize(e: {
  id: string; title: string; description: string | null; startDate: Date;
  endDate: Date | null; allDay: boolean; color: string; category: string | null;
  reminder: number | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    ...e,
    start: e.startDate.toISOString(),
    end: e.endDate?.toISOString() ?? null,
    startDate: undefined,
    endDate: undefined,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const { searchParams } = new URL(req.url)
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  const events = await prisma.event.findMany({
    where: {
      userId,
      ...(start && end ? { startDate: { gte: new Date(start), lte: new Date(end) } } : {}),
    },
    orderBy: { startDate: "asc" },
  })
  return NextResponse.json(events.map(serialize))
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const event = await prisma.event.create({
    data: {
      userId,
      title: body.title,
      description: body.description ?? null,
      startDate: new Date(body.start),
      endDate: body.end ? new Date(body.end) : null,
      allDay: body.allDay ?? false,
      color: body.color ?? "#6366f1",
      category: body.category ?? null,
      reminder: body.reminder ?? null,
    },
  })
  return NextResponse.json(serialize(event), { status: 201 })
}
