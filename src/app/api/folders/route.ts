import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { Folder } from "@/types"

function buildTree(folders: (Folder & { _count: { notes: number } })[]): Folder[] {
  const map = new Map<string, Folder & { children: Folder[] }>(
    folders.map((f) => [f.id, { ...f, children: [] }])
  )
  const roots: Folder[] = []
  for (const f of map.values()) {
    if (f.parentId) {
      map.get(f.parentId)?.children.push(f)
    } else {
      roots.push(f)
    }
  }
  return roots
}

export async function GET() {
  const folders = await prisma.folder.findMany({
    include: { _count: { select: { notes: true } } },
    orderBy: { name: "asc" },
  })
  const serialized = folders.map((f) => ({
    ...f,
    createdAt: f.createdAt.toISOString(),
    updatedAt: f.updatedAt.toISOString(),
    children: [],
  }))
  return NextResponse.json(buildTree(serialized as (Folder & { _count: { notes: number } })[]))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const folder = await prisma.folder.create({
    data: { name: body.name, parentId: body.parentId ?? null },
  })
  return NextResponse.json(folder, { status: 201 })
}
