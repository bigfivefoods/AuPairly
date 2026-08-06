import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    searches: searches.map((s) => ({
      ...s,
      filters: safeJson(s.filters),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = (body.name as string)?.trim() || "My search";
  const filters = body.filters && typeof body.filters === "object" ? body.filters : {};
  const alertEnabled = body.alertEnabled !== false;

  const search = await prisma.savedSearch.create({
    data: {
      userId: session.user.id,
      name,
      filters: JSON.stringify(filters),
      alertEnabled,
    },
  });
  return NextResponse.json({ search: { ...search, filters } });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = body.id as string;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const existing = await prisma.savedSearch.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const search = await prisma.savedSearch.update({
    where: { id },
    data: {
      name: body.name !== undefined ? String(body.name) : undefined,
      alertEnabled: body.alertEnabled !== undefined ? Boolean(body.alertEnabled) : undefined,
      filters:
        body.filters !== undefined ? JSON.stringify(body.filters) : undefined,
    },
  });
  return NextResponse.json({ search: { ...search, filters: safeJson(search.filters) } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.savedSearch.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
