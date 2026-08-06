import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { defaultContract } from "@/lib/safety";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const placements = await prisma.placement.findMany({
    where: {
      OR: [{ parentUserId: session.user.id }, { aupairUserId: session.user.id }],
    },
    orderBy: { updatedAt: "desc" },
  });

  const userIds = new Set<string>();
  placements.forEach((p) => {
    userIds.add(p.parentUserId);
    userIds.add(p.aupairUserId);
  });
  const users = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, name: true, image: true, role: true },
  });
  const byId = Object.fromEntries(users.map((u) => [u.id, u]));

  return NextResponse.json({
    placements: placements.map((p) => ({
      ...p,
      parent: byId[p.parentUserId],
      aupair: byId[p.aupairUserId],
      checklist: safeJson(p.checklist),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const otherUserId = String(body.otherUserId || "");
  if (!otherUserId || otherUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid otherUserId" }, { status: 400 });
  }

  const other = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!other) return NextResponse.json({ error: "User not found" }, { status: 404 });

  let parentUserId = session.user.id;
  let aupairUserId = otherUserId;
  if (session.user.role === "AUPAIR") {
    parentUserId = otherUserId;
    aupairUserId = session.user.id;
  } else if (session.user.role === "PARENT") {
    parentUserId = session.user.id;
    aupairUserId = otherUserId;
  } else {
    return NextResponse.json({ error: "Only parents and au pairs can start placements" }, { status: 400 });
  }

  const parent = await prisma.user.findUnique({ where: { id: parentUserId } });
  const aupair = await prisma.user.findUnique({ where: { id: aupairUserId } });

  const placement = await prisma.placement.upsert({
    where: {
      parentUserId_aupairUserId: { parentUserId, aupairUserId },
    },
    create: {
      parentUserId,
      aupairUserId,
      status: "INTERESTED",
      contractText: defaultContract({
        parentName: parent?.name || "Host family",
        aupairName: aupair?.name || "Au pair",
      }),
    },
    update: {},
  });

  await createNotification({
    userId: otherUserId,
    type: "SYSTEM",
    title: "Placement started",
    body: `${session.user.name} started a placement pipeline with you.`,
    href: `/placements/${placement.id}`,
  });

  return NextResponse.json({ placement });
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
