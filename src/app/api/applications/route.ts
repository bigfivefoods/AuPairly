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

  // Job applications require a min 1-minute intro video (host families applying sitters)
  const { MIN_VIDEO_INTRO_SECONDS } = await import("@/lib/services");
  const applyingAsSitter = me.role === "AUPAIR";
  if (applyingAsSitter) {
    const hasVideo = Boolean(me.videoIntroUrl?.trim());
    const longEnough =
      Boolean(me.videoIntroConfirmed) ||
      (typeof me.videoIntroSeconds === "number" &&
        me.videoIntroSeconds >= MIN_VIDEO_INTRO_SECONDS);
    if (!hasVideo || !longEnough) {
      return NextResponse.json(
        {
          error: `Add a video intro of at least 1 minute (yourself introducing and experience) before applying. Go to Trust → Video intro.`,
          videoRequired: true,
          minSeconds: MIN_VIDEO_INTRO_SECONDS,
          upgradeUrl: "/trust",
        },
        { status: 400 }
      );
    }
  }

  const profile = me.aupairProfile || me.familyProfile;
  // Never attach document file URLs — vault is owner/app-owner only
  const packet = {
    headline: profile?.headline,
    bio: profile?.bio?.slice(0, 500),
    city: profile?.city,
    country: profile?.country,
    videoUrl: me.videoIntroUrl,
    videoIntroSeconds: me.videoIntroSeconds,
    cvUrl: me.cvUrl,
    safetyScore: me.safetyScore,
    placementVerified: me.placementVerified,
    verifiedTypes: me.verifications.map((v) => v.type),
    documents: me.documents.map((d) => ({
      type: d.type,
      label: d.label,
      expiresAt: d.expiresAt,
      // url intentionally omitted — secure vault
    })),
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

  const recipient = await prisma.user.findUnique({
    where: { id: toUserId },
    select: { email: true, name: true },
  });
  if (recipient?.email) {
    const { sendApplicationEmail } = await import("@/lib/email");
    void sendApplicationEmail({
      toEmail: recipient.email,
      toName: recipient.name || "there",
      fromName: me.name,
      message: (body.message as string)?.trim() || null,
    }).catch((e) => console.error("[email] application", e));
  }

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

    const applicant = await prisma.user.findUnique({
      where: { id: app.fromUserId },
      select: { email: true, name: true },
    });
    const reviewer = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    if (applicant?.email) {
      const { sendInterestUpdateEmail } = await import("@/lib/email");
      void sendInterestUpdateEmail({
        toEmail: applicant.email,
        toName: applicant.name || "there",
        fromName: reviewer?.name || "A host",
        status: status as "ACCEPTED" | "DECLINED",
      }).catch((e) => console.error("[email] application update", e));
    }
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
