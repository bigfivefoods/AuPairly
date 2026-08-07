import { Suspense } from "react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { VerificationClient } from "@/components/verification-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const user = await requireUser();
  const [verifications, dbUser, profile] = await Promise.all([
    prisma.verification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { facebookId: true },
    }),
    user.role === "AUPAIR"
      ? prisma.auPairProfile.findUnique({ where: { userId: user.id } })
      : prisma.familyProfile.findUnique({ where: { userId: user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Trust center"
        title="Verify your identity"
        description="South Africa: automated SA ID + face match via VerifyNow. International: Didit document + liveness when configured, or document upload. Optional Meta/Facebook OAuth import for name/photo only."
      />
      <Suspense
        fallback={<p className="py-10 text-center text-sm text-stone-400">Loading verification…</p>}
      >
        <VerificationClient
          initial={verifications.map((v) => ({
            id: v.id,
            type: v.type,
            status: v.status,
            notes: v.notes,
            createdAt: v.createdAt.toISOString(),
          }))}
          isFullyVerified={profile?.isVerified ?? false}
          facebookLinked={Boolean(dbUser?.facebookId)}
        />
      </Suspense>
    </div>
  );
}
