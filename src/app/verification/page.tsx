import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { VerificationClient } from "@/components/verification-client";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verification" };

export default async function VerificationPage() {
  const user = await requireUser();
  const verifications = await prisma.verification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const profile =
    user.role === "AUPAIR"
      ? await prisma.auPairProfile.findUnique({ where: { userId: user.id } })
      : await prisma.familyProfile.findUnique({ where: { userId: user.id } });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Trust center"
        title="Verify your identity"
        description="Complete these checks to earn a Verified badge. Verified members get more visibility and trust."
      />
      <VerificationClient
        initial={verifications.map((v) => ({
          id: v.id,
          type: v.type,
          status: v.status,
          notes: v.notes,
          createdAt: v.createdAt.toISOString(),
        }))}
        isFullyVerified={profile?.isVerified ?? false}
      />
    </div>
  );
}
