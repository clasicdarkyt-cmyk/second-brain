import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calculateStreak, calculateCompletionRate, todayString } from "@/lib/utils"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const today = todayString()
  const habit = await prisma.habit.findUnique({
    where: { id },
    include: { logs: { orderBy: { date: "desc" }, take: 365 } },
  })
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 })

  return NextResponse.json({
    ...habit,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
    logs: habit.logs.map((l) => ({ ...l, createdAt: l.createdAt.toISOString() })),
    todayCompleted: habit.logs.some((l) => l.date === today && l.completed),
    todayValue: habit.logs.find((l) => l.date === today)?.value ?? null,
    currentStreak: calculateStreak(habit.logs),
    completionRate: calculateCompletionRate(habit.logs),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const habit = await prisma.habit.update({
    where: { id },
    data: {
      name: body.name,
      description: body.description,
      color: body.color,
      icon: body.icon,
      frequency: body.frequency,
      isNumeric: body.isNumeric,
      targetValue: body.targetValue,
      unit: body.unit,
      archived: body.archived,
    },
  })
  return NextResponse.json(habit)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.habit.update({ where: { id }, data: { archived: true } })
  return NextResponse.json({ ok: true })
}
