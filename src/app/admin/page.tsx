import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AdminVerificationQueue } from "@/components/admin-verification-queue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [pending, reports] = await Promise.all([
    prisma.verification.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Ops"
        title="Admin console"
        description="Review identity checks and safety reports for AuPairly members."
      />
      <AdminVerificationQueue
        initialPending={pending.map((p) => ({
          id: p.id,
          type: p.type,
          status: p.status,
          documentUrl: p.documentUrl,
          notes: p.notes,
          createdAt: p.createdAt.toISOString(),
          user: p.user,
        }))}
        initialReports={reports.map((r) => ({
          id: r.id,
          reporterId: r.reporterId,
          targetId: r.targetId,
          reason: r.reason,
          details: r.details,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
