import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { AdminVerificationQueue } from "@/components/admin-verification-queue";
import { AdminUnsuspendButton } from "@/components/admin-unsuspend-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

export default async function AdminPage() {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [pending, reports, stats, today, suspended] = await Promise.all([
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
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.auPairProfile.count({
        where: { status: "ACTIVE", updatedAt: { gte: startOfDay } },
      }),
      prisma.familyProfile.count({
        where: { status: "ACTIVE", updatedAt: { gte: startOfDay } },
      }),
      prisma.paymentTransaction.count({
        where: { status: "SUCCESS", paidAt: { gte: startOfDay } },
      }),
      prisma.supportTicket.count({
        where: { status: "OPEN", createdAt: { gte: startOfDay } },
      }),
    ]).then(([signups, sittersLive, hostsLive, payments, tickets]) => ({
      signups,
      sittersLive,
      hostsLive,
      payments,
      tickets,
    })),
    prisma.user.findMany({
      where: { suspendedAt: { not: null } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        suspendedAt: true,
        suspendReason: true,
      },
      orderBy: { suspendedAt: "desc" },
      take: 20,
    }),
  ]);

  const autoVerify = process.env.AUTO_VERIFY === "true";

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Ops"
        title="Admin console"
        description="Review identity checks and safety reports. Production should keep AUTO_VERIFY=false."
      />

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
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

      <div className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
          Today
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "New signups", value: today.signups },
            { label: "Sitter listings touched", value: today.sittersLive },
            { label: "Host listings touched", value: today.hostsLive },
            { label: "Successful payments", value: today.payments },
            { label: "Open tickets (new)", value: today.tickets },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-teal-100 bg-teal-50/50 px-3 py-3 text-center"
            >
              <p className="font-display text-xl font-semibold text-teal-900">{s.value}</p>
              <p className="text-[11px] font-medium text-teal-800/80">{s.label}</p>
            </div>
          ))}
        </div>
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

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Suspended accounts</h2>
        <p className="mt-1 text-sm text-stone-500">
          Suspend from a report target id via API, or reinstate below.
        </p>
        {suspended.length === 0 ? (
          <p className="mt-3 text-sm text-stone-400">No suspended users.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {suspended.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-semibold text-stone-900">
                    {u.name}{" "}
                    <span className="text-xs font-medium text-stone-400">{u.role}</span>
                  </p>
                  <p className="text-xs text-stone-500">{u.email}</p>
                  {u.suspendReason && (
                    <p className="text-xs text-red-700">{u.suspendReason}</p>
                  )}
                </div>
                <AdminUnsuspendButton userId={u.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
