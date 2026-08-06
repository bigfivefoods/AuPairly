import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { agencyId: true },
  });
  if (!me?.agencyId) return NextResponse.json({ agency: null, members: [] });

  const agency = await prisma.agency.findUnique({ where: { id: me.agencyId } });
  const members = await prisma.user.findMany({
    where: { agencyId: me.agencyId },
    select: { id: true, name: true, email: true, role: true, image: true },
  });
  return NextResponse.json({ agency, members });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const name = String(body.name || "").trim();
  if (name.length < 2) {
    return NextResponse.json({ error: "Agency name required" }, { status: 400 });
  }
  const slug =
    String(body.slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") +
    "-" +
    Date.now().toString(36);

  const agency = await prisma.agency.create({
    data: {
      name,
      slug,
      email: session.user.email,
      plan: "STARTER",
    },
  });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { agencyId: agency.id },
  });

  return NextResponse.json({ agency });
}
