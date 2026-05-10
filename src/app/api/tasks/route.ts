import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Task } from "@/types"

function serializeTask(t: {
  id: string; title: string; description: string | null; status: string; priority: string;
  dueDate: Date | null; parentId: string | null; order: number;
  createdAt: Date; updatedAt: Date; completedAt: Date | null;
  subtasks?: ReturnType<typeof serializeTask>[]
}): Task {
  return {
    ...t,
    dueDate: t.dueDate?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    completedAt: t.completedAt?.toISOString() ?? null,
    status: t.status as Task["status"],
    priority: t.priority as Task["priority"],
    subtasks: t.subtasks ?? [],
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const due = searchParams.get("due")

  const now = new Date()
  const dueFilter = due === "today"
    ? { lte: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59) }
    : due === "week"
    ? { lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    : undefined

  const tasks = await prisma.task.findMany({
    where: {
      parentId: null,
      ...(status && status !== "all" ? { status } : {}),
      ...(priority && priority !== "all" ? { priority } : {}),
      ...(dueFilter ? { dueDate: dueFilter } : {}),
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
    },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json(tasks.map((t) => serializeTask({ ...t, subtasks: t.subtasks.map((s) => serializeTask({ ...s, subtasks: [] })) })))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const task = await prisma.task.create({
    data: {
      title: body.title,
      description: body.description ?? null,
      status: body.status ?? "todo",
      priority: body.priority ?? "medium",
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      parentId: body.parentId ?? null,
    },
    include: { subtasks: true },
  })
  return NextResponse.json(serializeTask({ ...task, subtasks: [] }), { status: 201 })
}
