import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateStreak, calculateCompletionRate, todayString } from "@/lib/utils"

export async function GET() {
  const today = todayString()
  const habits = await prisma.habit.findMany({
    where: { archived: false },
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
  const body = await req.json()
  const habit = await prisma.habit.create({
    data: {
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
