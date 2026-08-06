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

  const [pending, reports, stats] = await Promise.all([
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
    Promise.all([
      prisma.user.count(),
      prisma.auPairProfile.count({ where: { status: "ACTIVE" } }),
      prisma.familyProfile.count({ where: { status: "ACTIVE" } }),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.conversation.count(),
    ]).then(([users, sitters, hosts, pendingV, openR, chats]) => ({
      users,
      sitters,
      hosts,
      pendingV,
      openR,
      chats,
    })),
  ]);

  const autoVerify = process.env.AUTO_VERIFY === "true";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Ops"
        title="Admin console"
        description="Review identity checks and safety reports. Production should keep AUTO_VERIFY=false."
      />

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Users", value: stats.users },
          { label: "Active sitters", value: stats.sitters },
          { label: "Active hosts", value: stats.hosts },
          { label: "Pending verify", value: stats.pendingV },
          { label: "Open reports", value: stats.openR },
          { label: "Chats", value: stats.chats },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-stone-200 bg-white px-3 py-3 text-center shadow-sm"
          >
            <p className="font-display text-xl font-semibold text-stone-900">{s.value}</p>
            <p className="text-[11px] font-medium text-stone-500">{s.label}</p>
          </div>
        ))}
      </div>

      {autoVerify && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>AUTO_VERIFY is on.</strong> New checks auto-approve — set{" "}
          <code className="rounded bg-white px-1">AUTO_VERIFY=false</code> on Vercel for real
          admin review.
        </div>
      )}

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
