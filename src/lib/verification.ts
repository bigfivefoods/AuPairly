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
  // Hard off on Vercel production — never auto-approve trust badges in prod.
  if (process.env.VERCEL_ENV === "production") return false;
  // Preview/local: only when explicitly AUTO_VERIFY=true
  return process.env.AUTO_VERIFY === "true";
}
