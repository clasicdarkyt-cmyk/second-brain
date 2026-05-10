import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { name } = await req.json()
  const folder = await prisma.folder.update({ where: { id }, data: { name } })
  return NextResponse.json(folder)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  // Move notes to root before deleting folder
  await prisma.note.updateMany({ where: { folderId: id }, data: { folderId: null } })
  await prisma.folder.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
