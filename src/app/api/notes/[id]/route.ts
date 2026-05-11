import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const note = await prisma.note.findUnique({
    where: { id },
    include: { folder: { select: { id: true, name: true } } },
  })
  if (!note) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({
    ...note,
    tags: note.tags ? JSON.parse(note.tags) : [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const note = await prisma.note.update({
    where: { id },
    data: {
      title: body.title,
      content: body.content,
      folderId: body.folderId,
      pinned: body.pinned,
      tags: body.tags ? JSON.stringify(body.tags) : undefined,
    },
  })
  return NextResponse.json({
    ...note,
    tags: note.tags ? JSON.parse(note.tags) : [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.note.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
