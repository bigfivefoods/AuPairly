import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const docs = await prisma.secureDocument.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ documents: docs });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const type = String(body.type || "OTHER").slice(0, 40);
  const url = String(body.url || "").trim();
  const label = body.label ? String(body.label).slice(0, 120) : null;
  if (!url) {
    return NextResponse.json(
      { error: "Upload a file first — document URL is missing." },
      { status: 400 }
    );
  }
  // Accept storage paths, absolute https URLs, or data URLs from the upload API
  const ok =
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/") ||
    url.startsWith("data:");
  if (!ok) {
    return NextResponse.json(
      { error: "Invalid document file URL from upload." },
      { status: 400 }
    );
  }

  const doc = await prisma.secureDocument.create({
    data: {
      userId: session.user.id,
      type,
      url,
      label,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      // Vault: only member + app owners can open file URLs
      ownerOnly: true,
    },
  });
  return NextResponse.json({ document: doc });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.secureDocument.deleteMany({
    where: { id, userId: session.user.id },
  });
  return NextResponse.json({ ok: true });
}
