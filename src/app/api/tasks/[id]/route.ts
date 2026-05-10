import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const completedAt = body.status === "done" ? new Date() : body.status === "todo" ? null : undefined

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : body.dueDate === null ? null : undefined,
      ...(completedAt !== undefined ? { completedAt } : {}),
    },
  })
  return NextResponse.json({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    completedAt: task.completedAt?.toISOString() ?? null,
    subtasks: [],
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Delete subtasks first
  await prisma.task.deleteMany({ where: { parentId: id } })
  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
