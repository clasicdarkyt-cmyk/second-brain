import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

function serialize(note: {
  id: string; title: string; content: string; folderId: string | null;
  pinned: boolean; tags: string | null; createdAt: Date; updatedAt: Date;
  folder?: { id: string; name: string } | null
}) {
  return {
    ...note,
    tags: note.tags ? (JSON.parse(note.tags) as string[]) : [],
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get("search")
  const folderId = searchParams.get("folderId")

  const notes = await prisma.note.findMany({
    where: {
      ...(search ? {
        OR: [
          { title: { contains: search } },
          { content: { contains: search } },
        ],
      } : {}),
      ...(folderId === "root" ? { folderId: null } : folderId ? { folderId } : {}),
    },
    include: { folder: { select: { id: true, name: true } } },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
  })
  return NextResponse.json(notes.map(serialize))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const note = await prisma.note.create({
    data: {
      title: body.title ?? "Sin título",
      content: body.content ?? "",
      folderId: body.folderId ?? null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    },
    include: { folder: { select: { id: true, name: true } } },
  })
  return NextResponse.json(serialize(note), { status: 201 })
}
