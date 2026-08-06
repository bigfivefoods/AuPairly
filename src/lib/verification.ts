import { prisma } from "@/lib/prisma";

/** Required checks to earn the public Verified badge */
export const REQUIRED_VERIFY_TYPES = ["ID", "SELFIE"] as const;

export async function refreshUserVerifiedBadge(userId: string) {
  const verified = await prisma.verification.findMany({
    where: { userId, status: "VERIFIED" },
  });
  const types = new Set(verified.map((v) => v.type));
  const isFullyVerified = REQUIRED_VERIFY_TYPES.every((t) => types.has(t));

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return isFullyVerified;

  if (user.role === "AUPAIR") {
    await prisma.auPairProfile.updateMany({
      where: { userId },
      data: { isVerified: isFullyVerified },
    });
  } else if (user.role === "PARENT") {
    await prisma.familyProfile.updateMany({
      where: { userId },
      data: { isVerified: isFullyVerified },
    });
  }

  return isFullyVerified;
}

export function autoVerifyEnabled() {
  // Default ON for local demos; set AUTO_VERIFY=false in production to use admin queue
  return process.env.AUTO_VERIFY !== "false";
}
