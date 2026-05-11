import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"
import { calculateStreak, calculateCompletionRate, todayString } from "@/lib/utils"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const today = todayString()
  const habits = await prisma.habit.findMany({
    where: { userId, archived: false },
    include: { logs: { orderBy: { date: "desc" }, take: 365 } },
    orderBy: { createdAt: "asc" },
  })

  const result = habits.map((h) => ({
    ...h,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
    logs: h.logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    todayCompleted: h.logs.some((l) => l.date === today && l.completed),
    todayValue: h.logs.find((l) => l.date === today)?.value ?? null,
    currentStreak: calculateStreak(h.logs),
    completionRate: calculateCompletionRate(h.logs),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = session.user.id

  const body = await req.json()
  const habit = await prisma.habit.create({
    data: {
      userId,
      name: body.name,
      description: body.description ?? null,
      color: body.color ?? "#6366f1",
      icon: body.icon ?? null,
      frequency: body.frequency ?? "daily",
      isNumeric: body.isNumeric ?? false,
      targetValue: body.targetValue ?? null,
      unit: body.unit ?? null,
    },
  })
  return NextResponse.json(habit, { status: 201 })
}
