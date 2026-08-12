import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";
import { sendInterestUpdateEmail } from "@/lib/email";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const status = body.status as string;

  if (!["ACCEPTED", "DECLINED", "WITHDRAWN"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const interest = await prisma.interest.findUnique({
    where: { id },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!interest) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (status === "WITHDRAWN") {
    if (interest.fromUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    // Accept / decline only by recipient
    if (interest.toUserId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const updated = await prisma.interest.update({
    where: { id },
    data: { status: status as "ACCEPTED" | "DECLINED" | "WITHDRAWN" },
  });

  if (status === "ACCEPTED" || status === "DECLINED") {
    await createNotification({
      userId: interest.fromUserId,
      type: "INTEREST_UPDATE",
      title: status === "ACCEPTED" ? "Interest accepted" : "Interest declined",
      body:
        status === "ACCEPTED"
          ? `${interest.toUser.name} accepted your interest. You can message them now.`
          : `${interest.toUser.name} declined your interest.`,
      href: status === "ACCEPTED" ? "/messages" : "/interests",
      meta: { interestId: id, status },
    });

    void sendInterestUpdateEmail({
      toEmail: interest.fromUser.email,
      toName: interest.fromUser.name,
      fromName: interest.toUser.name,
      status,
    }).catch((e) => console.error("[email] interest update", e));

    // On accept, ensure a conversation exists
    if (status === "ACCEPTED") {
      const [userAId, userBId] =
        interest.fromUserId < interest.toUserId
          ? [interest.fromUserId, interest.toUserId]
          : [interest.toUserId, interest.fromUserId];

      let conv = await prisma.conversation.findUnique({
        where: { userAId_userBId: { userAId, userBId } },
      });
      if (!conv) {
        conv = await prisma.conversation.create({
          data: {
            userAId,
            userBId,
            messages: {
              create: {
                senderId: interest.toUserId,
                body: `Hi! I've accepted your interest — looking forward to chatting about a possible match.`,
              },
            },
          },
        });
      }

      // House swap: if both hosts with swap dates, block calendar availability
      try {
        const [fromU, toU] = await Promise.all([
          prisma.user.findUnique({
            where: { id: interest.fromUserId },
            select: {
              role: true,
              familyProfile: {
                select: {
                  services: true,
                  swapAvailableFrom: true,
                  swapAvailableTo: true,
                  city: true,
                },
              },
            },
          }),
          prisma.user.findUnique({
            where: { id: interest.toUserId },
            select: {
              role: true,
              familyProfile: {
                select: {
                  services: true,
                  swapAvailableFrom: true,
                  swapAvailableTo: true,
                  city: true,
                },
              },
            },
          }),
        ]);
        const bothHosts = fromU?.role === "PARENT" && toU?.role === "PARENT";
        const fromSwap = (fromU?.familyProfile?.services || "").includes("HOUSE_SWAP");
        const toSwap = (toU?.familyProfile?.services || "").includes("HOUSE_SWAP");
        if (bothHosts && fromSwap && toSwap) {
          const { dateRangesOverlap } = await import("@/lib/house-swap-match");
          const f = fromU!.familyProfile!;
          const t = toU!.familyProfile!;
          if (
            dateRangesOverlap(
              f.swapAvailableFrom,
              f.swapAvailableTo,
              t.swapAvailableFrom,
              t.swapAvailableTo
            )
          ) {
            // Soft calendar hold: BUSY slots for overlapping window (best-effort)
            const start =
              f.swapAvailableFrom && t.swapAvailableFrom
                ? new Date(
                    Math.max(
                      new Date(f.swapAvailableFrom).getTime(),
                      new Date(t.swapAvailableFrom).getTime()
                    )
                  )
                : f.swapAvailableFrom || t.swapAvailableFrom;
            const end =
              f.swapAvailableTo && t.swapAvailableTo
                ? new Date(
                    Math.min(
                      new Date(f.swapAvailableTo).getTime(),
                      new Date(t.swapAvailableTo).getTime()
                    )
                  )
                : f.swapAvailableTo || t.swapAvailableTo;
            if (start && end && end > start) {
              for (const uid of [interest.fromUserId, interest.toUserId]) {
                await prisma.availabilitySlot.create({
                  data: {
                    userId: uid,
                    kind: "BUSY",
                    startDate: start,
                    endDate: end,
                    note: "House swap hold (accepted interest)",
                  },
                });
              }
              await createNotification({
                userId: interest.fromUserId,
                type: "SYSTEM",
                title: "House swap dates held",
                body: "Your overlapping swap window was marked busy on both calendars. Confirm details in chat.",
                href: conv ? `/messages/${conv.id}` : "/messages",
              });
              await createNotification({
                userId: interest.toUserId,
                type: "SYSTEM",
                title: "House swap dates held",
                body: "Your overlapping swap window was marked busy on both calendars. Confirm details in chat.",
                href: conv ? `/messages/${conv.id}` : "/messages",
              });
            }
          }
        }
      } catch (e) {
        console.error("[interest] swap calendar hold", e);
      }
    }
  }

  return NextResponse.json({ interest: updated });
}
