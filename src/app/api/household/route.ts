import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";
import { randomBytes } from "crypto";

/** Partner / co-parent seats — Premium families */
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      householdOwnerId: true,
      partnerInviteToken: true,
      householdMembers: {
        select: { id: true, name: true, email: true, image: true, createdAt: true },
      },
    },
  });
  if (!me) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let owner = null;
  if (me.householdOwnerId) {
    owner = await prisma.user.findUnique({
      where: { id: me.householdOwnerId },
      select: { id: true, name: true, email: true, image: true },
    });
  }

  return NextResponse.json({
    me: {
      id: me.id,
      householdOwnerId: me.householdOwnerId,
      partnerInviteToken: me.partnerInviteToken,
    },
    members: me.householdMembers,
    owner,
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const action = body.action as string;

  if (action === "create_invite") {
    if (session.user.role !== "PARENT") {
      return NextResponse.json({ error: "Partner seats are for family accounts" }, { status: 400 });
    }
    const { plan } = await getUserPlan(session.user.id);
    if (plan.id !== "PREMIUM") {
      return NextResponse.json(
        {
          error: "Partner / co-parent seats require Premium.",
          upgradeRequired: true,
          upgradeUrl: "/pricing",
        },
        { status: 402 }
      );
    }
    const token = randomBytes(16).toString("hex");
    await prisma.user.update({
      where: { id: session.user.id },
      data: { partnerInviteToken: token },
    });
    return NextResponse.json({
      ok: true,
      inviteToken: token,
      invitePath: `/household/join?token=${token}`,
    });
  }

  if (action === "join") {
    const token = body.token as string;
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });
    const owner = await prisma.user.findFirst({
      where: { partnerInviteToken: token, role: "PARENT" },
    });
    if (!owner) return NextResponse.json({ error: "Invalid invite" }, { status: 404 });
    if (owner.id === session.user.id) {
      return NextResponse.json({ error: "Cannot join your own household" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: session.user.id },
      data: { householdOwnerId: owner.id },
    });
    return NextResponse.json({ ok: true, ownerId: owner.id, ownerName: owner.name });
  }

  if (action === "leave") {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { householdOwnerId: null },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
