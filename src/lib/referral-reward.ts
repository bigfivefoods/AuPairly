import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

/**
 * One-time reward when someone joins via invite link:
 * 3-day featured boost on the inviter's listing + in-app notice.
 */
export async function grantReferralReward(opts: {
  inviterId: string;
  inviteeName: string;
  inviteeId: string;
}) {
  const invitee = await prisma.user.findUnique({
    where: { id: opts.inviteeId },
    select: { referralRewardGranted: true, referredById: true },
  });
  if (!invitee?.referredById || invitee.referralRewardGranted) return;
  if (invitee.referredById !== opts.inviterId) return;

  const until = new Date();
  until.setDate(until.getDate() + 3);

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

  await prisma.boostEvent.create({
    data: {
      userId: opts.inviterId,
      startedAt: new Date(),
      endsAt: until,
    },
  }).catch(() => null);

  await prisma.user.update({
    where: { id: opts.inviteeId },
    data: { referralRewardGranted: true },
  });

  await createNotification({
    userId: opts.inviterId,
    type: "SYSTEM",
    title: "Referral reward: 3-day feature",
    body: `${opts.inviteeName.split(" ")[0]} joined with your link. Your listing is featured for 3 days — thank you for growing AuPairly!`,
    href: "/boost",
  });
}
