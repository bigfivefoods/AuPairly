import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { checkAndConsume } from "@/lib/entitlements";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const box = searchParams.get("box") || "received";

  const apps = await prisma.applicationPacket.findMany({
    where: box === "sent" ? { fromUserId: session.user.id } : { toUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      fromUser: { select: { id: true, name: true, image: true, role: true, safetyScore: true } },
      toUser: { select: { id: true, name: true, image: true, role: true } },
    },
    take: 50,
  });

  return NextResponse.json({
    applications: apps.map((a) => ({
      ...a,
      packet: safeJson(a.packetJson),
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const toUserId = body.toUserId as string;
  if (!toUserId) return NextResponse.json({ error: "toUserId required" }, { status: 400 });
  if (toUserId === session.user.id) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }

  const limit = await checkAndConsume(session.user.id, "INTEREST");
  if (!limit.ok) {
    return NextResponse.json(
      { error: limit.reason, upgradeRequired: true, upgradeUrl: "/pricing" },
      { status: 402 }
    );
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      aupairProfile: true,
      familyProfile: true,
      documents: { take: 10, orderBy: { createdAt: "desc" } },
      referencesAbout: {
        where: { status: "SUBMITTED" },
        take: 5,
        select: { rating: true, relationship: true, refereeName: true, comment: true },
      },
      verifications: { where: { status: "VERIFIED" }, select: { type: true } },
    },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const profile = me.aupairProfile || me.familyProfile;
  const packet = {
    headline: profile?.headline,
    bio: profile?.bio?.slice(0, 500),
    city: profile?.city,
    country: profile?.country,
    videoUrl: me.videoIntroUrl,
    safetyScore: me.safetyScore,
    placementVerified: me.placementVerified,
    verifiedTypes: me.verifications.map((v) => v.type),
    documents: me.documents.map((d) => ({ type: d.type, label: d.label, expiresAt: d.expiresAt })),
    references: me.referencesAbout,
    experienceYears: me.aupairProfile?.experienceYears,
    certificates: me.aupairProfile ? safeJson(me.aupairProfile.certificates) : [],
    workRights: me.aupairProfile?.workRights,
    languages: profile?.languages,
  };

  const app = await prisma.applicationPacket.create({
    data: {
      fromUserId: session.user.id,
      toUserId,
      message: (body.message as string)?.trim() || null,
      packetJson: JSON.stringify(packet),
      status: "SENT",
    },
  });

  await createNotification({
    userId: toUserId,
    type: "INTEREST",
    title: "New application packet",
    body: `${me.name} sent a full application (profile, docs & references).`,
    href: "/applications",
  });

  return NextResponse.json({ ok: true, application: { ...app, packet } });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const id = body.id as string;
  const status = body.status as string;
  if (!id || !["VIEWED", "ACCEPTED", "DECLINED"].includes(status)) {
    return NextResponse.json({ error: "id and status required" }, { status: 400 });
  }

  const app = await prisma.applicationPacket.findFirst({
    where: { id, toUserId: session.user.id },
  });
  if (!app) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.applicationPacket.update({
    where: { id },
    data: { status },
  });

  if (status === "ACCEPTED" || status === "DECLINED") {
    await createNotification({
      userId: app.fromUserId,
      type: "INTEREST_UPDATE",
      title: status === "ACCEPTED" ? "Application accepted" : "Application declined",
      body: `Your application was ${status.toLowerCase()}.`,
      href: "/applications?box=sent",
    });
  }

  return NextResponse.json({ ok: true, application: updated });
}

function safeJson(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return [];
  }
}
