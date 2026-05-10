import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { todayString } from "@/lib/utils"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habitId } = await params
  const body = await req.json()
  const date = body.date ?? todayString()
  const value = body.value ?? null

  const existing = await prisma.habitLog.findUnique({ where: { habitId_date: { habitId, date } } })

  if (existing) {
    if (existing.completed && value === null) {
      // Toggle off
      await prisma.habitLog.delete({ where: { id: existing.id } })
      return NextResponse.json({ completed: false })
    }
    // Update value
    const updated = await prisma.habitLog.update({
      where: { id: existing.id },
      data: { completed: true, value },
    })
    return NextResponse.json(updated)
  }

  const log = await prisma.habitLog.create({
    data: { habitId, date, completed: true, value },
  })
  return NextResponse.json(log, { status: 201 })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: habitId } = await params
  const { searchParams } = new URL(req.url)
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  const logs = await prisma.habitLog.findMany({
    where: {
      habitId,
      ...(from && to ? { date: { gte: from, lte: to } } : {}),
    },
    orderBy: { date: "asc" },
  })
  return NextResponse.json(logs)
}
