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
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-10 lg:px-8">
      <PageHeader
        eyebrow="Trust center"
        title="Verify your identity"
        description="South Africa: automated SA ID + face match via VerifyNow. International: Didit document + liveness when configured, or document upload. Optional Meta/Facebook OAuth import for name/photo only."
      />
      <div className="mb-6 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white px-4 py-4 text-sm text-stone-700">
        <p className="font-semibold text-teal-900">How verification works (30 seconds)</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-stone-600">
          <li>Choose your path: South Africa (VerifyNow) or international (Didit / docs).</li>
          <li>Complete ID + liveness (or upload documents if automated path is unavailable).</li>
          <li>Get a Verified badge on your listing — hosts and sitters trust badges more.</li>
        </ol>
        <p className="mt-2 text-xs text-stone-500">
          Facebook Login only prefills name/photo. It is not a government ID check.
        </p>
      </div>
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
