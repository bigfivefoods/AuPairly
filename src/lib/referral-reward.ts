import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * Dual-sided invite reward when someone joins via invite link:
 * - Inviter: 3-day featured + priority boost
 * - Invitee: 1-day featured welcome boost (helps first publish)
 */
export async function grantReferralReward(opts: {
  inviterId: string;
  inviteeName: string;
  inviteeId: string;
}) {
  const invitee = await prisma.user.findUnique({
    where: { id: opts.inviteeId },
    select: { referralRewardGranted: true, referredById: true, role: true },
  });
  if (!invitee?.referredById || invitee.referralRewardGranted) return;
  if (invitee.referredById !== opts.inviterId) return;

  const until = new Date();
  until.setDate(until.getDate() + 3);
  const welcomeUntil = new Date();
  welcomeUntil.setDate(welcomeUntil.getDate() + 1);

  const inviter = await prisma.user.findUnique({
    where: { id: opts.inviterId },
    select: { role: true },
  });
  if (!inviter) return;

  if (inviter.role === "AUPAIR") {
    await prisma.auPairProfile.updateMany({
      where: { userId: opts.inviterId },
      data: { isFeatured: true, boostedUntil: until },
    });
  } else if (inviter.role === "PARENT") {
    await prisma.familyProfile.updateMany({
      where: { userId: opts.inviterId },
      data: { isFeatured: true, boostedUntil: until },
    });
  }

  // Welcome boost for invitee (once they have a listing — best-effort now)
  if (invitee.role === "AUPAIR") {
    await prisma.auPairProfile
      .updateMany({
        where: { userId: opts.inviteeId },
        data: { isFeatured: true, boostedUntil: welcomeUntil },
      })
      .catch(() => null);
  } else if (invitee.role === "PARENT") {
    await prisma.familyProfile
      .updateMany({
        where: { userId: opts.inviteeId },
        data: { isFeatured: true, boostedUntil: welcomeUntil },
      })
      .catch(() => null);
  }

  await prisma.boostEvent
    .create({
      data: {
        userId: opts.inviterId,
        startedAt: new Date(),
        endsAt: until,
      },
    })
    .catch(() => null);

  await prisma.user.update({
    where: { id: opts.inviteeId },
    data: { referralRewardGranted: true },
  });

  await createNotification({
    userId: opts.inviterId,
    type: "SYSTEM",
    title: "Referral reward: 3-day feature",
    body: `${opts.inviteeName.split(" ")[0]} joined with your link. Your listing is featured for 3 days — invite 2 more for max impact!`,
    href: "/invite",
  });

  await createNotification({
    userId: opts.inviteeId,
    type: "SYSTEM",
    title: "Welcome gift: 1-day feature",
    body: "You joined via invite — publish your listing to use a 1-day featured boost. Free to start.",
    href: invitee.role === "PARENT" ? "/host-job" : "/sitter-start",
  }).catch(() => null);
}
