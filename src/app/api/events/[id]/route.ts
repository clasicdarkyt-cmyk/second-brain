import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const event = await prisma.event.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      startDate: body.start ? new Date(body.start) : undefined,
      endDate: body.end ? new Date(body.end) : null,
      allDay: body.allDay,
      color: body.color,
      category: body.category,
      reminder: body.reminder,
    },
  })
  return NextResponse.json({
    ...event,
    start: event.startDate.toISOString(),
    end: event.endDate?.toISOString() ?? null,
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.event.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
