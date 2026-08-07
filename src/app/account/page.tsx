import Link from "next/link";
import { format } from "date-fns";
import {
  CreditCard,
  FileText,
  Receipt,
  Sparkles,
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/entitlements";
import { dayKey, planFor, weekKey } from "@/lib/plans";
import { formatZar, paymentKindLabel } from "@/lib/payments";
import { Badge, Card, EmptyState, PageHeader } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "Account report" };

/**
 * User account report: profile snapshot, plan, transaction history, activity.
 */
export default async function AccountReportPage() {
  const user = await requireUser();

  const today = dayKey();
  const thisWeek = weekKey();

  const [
    dbUser,
    planInfo,
    ledger,
    boosts,
    placements,
    products,
    supportTickets,
    verifications,
    usageRows,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        image: true,
        plan: true,
        createdAt: true,
        lastActiveAt: true,
        safetyScore: true,
        placementVerified: true,
        stripeCustomerId: true,
      },
    }),
    getUserPlan(user.id),
    prisma.paymentTransaction.findMany({
      where: { userId: user.id },
      orderBy: { paidAt: "desc" },
      take: 100,
    }),
    prisma.boostEvent.findMany({
      where: { userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 20,
    }),
    prisma.placement.findMany({
      where: {
        OR: [{ parentUserId: user.id }, { aupairUserId: user.id }],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        status: true,
        successFeeCents: true,
        successFeePaidAt: true,
        successFeeRef: true,
        createdAt: true,
        updatedAt: true,
        parentUserId: true,
        aupairUserId: true,
      },
    }),
    prisma.marketplaceProduct.findMany({
      where: { sellerUserId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.supportTicket.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    prisma.verification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.usageCounter.findMany({
      where: {
        userId: user.id,
        OR: [
          { action: "MESSAGE", dayKey: today },
          { action: "SWIPE", dayKey: today },
          { action: "INTEREST", dayKey: thisWeek },
        ],
      },
    }),
  ]);

  const usage = {
    messages: usageRows.find((r) => r.action === "MESSAGE")?.count ?? 0,
    swipes: usageRows.find((r) => r.action === "SWIPE")?.count ?? 0,
    interests: usageRows.find((r) => r.action === "INTEREST")?.count ?? 0,
  };

  // Synthesize history from legacy rows when ledger is empty / partial
  const synthetic: Array<{
    id: string;
    kind: string;
    status: string;
    amountCents: number;
    currency: string;
    description: string;
    reference: string | null;
    provider: string;
    paidAt: Date;
  }> = [];

  if (planInfo.subscription && planInfo.subscription.plan !== "FREE") {
    const sub = planInfo.subscription;
    const ref = sub.stripeSubscriptionId || `sub_${sub.id}`;
    const already = ledger.some((t) => t.reference === ref);
    if (!already) {
      synthetic.push({
        id: `syn-sub-${sub.id}`,
        kind: "MEMBERSHIP",
        status: sub.status === "ACTIVE" ? "SUCCESS" : sub.status,
        amountCents: 0,
        currency: "ZAR",
        description: `${planFor(sub.plan).name} plan access`,
        reference: ref,
        provider: sub.stripeSubscriptionId ? "paystack" : "system",
        paidAt: sub.currentPeriodStart || sub.createdAt,
      });
    }
  }

  for (const b of boosts) {
    const ref = `boost_event_${b.id}`;
    if (!ledger.some((t) => t.reference === ref) && !ledger.some((t) => t.kind === "BOOST" && Math.abs(t.paidAt.getTime() - b.startedAt.getTime()) < 60_000)) {
      synthetic.push({
        id: `syn-boost-${b.id}`,
        kind: "BOOST",
        status: "SUCCESS",
        amountCents: 0,
        currency: "ZAR",
        description: `Profile boost · ${format(b.startedAt, "MMM d")}–${format(b.endsAt, "MMM d, yyyy")}`,
        reference: ref,
        provider: "system",
        paidAt: b.startedAt,
      });
    }
  }

  for (const p of placements) {
    if (p.successFeePaidAt) {
      const ref = p.successFeeRef || `success_fee_${p.id}`;
      if (!ledger.some((t) => t.reference === ref)) {
        synthetic.push({
          id: `syn-fee-${p.id}`,
          kind: "SUCCESS_FEE",
          status: "SUCCESS",
          amountCents: p.successFeeCents,
          currency: "ZAR",
          description: "Placement success fee",
          reference: ref,
          provider: "paystack",
          paidAt: p.successFeePaidAt,
        });
      }
    }
  }

  const transactions = [
    ...ledger.map((t) => ({
      id: t.id,
      kind: t.kind,
      status: t.status,
      amountCents: t.amountCents,
      currency: t.currency,
      description: t.description,
      reference: t.reference,
      provider: t.provider,
      paidAt: t.paidAt,
    })),
    ...synthetic,
  ].sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime());

  const totalSpentCents = transactions
    .filter((t) => t.status === "SUCCESS" && t.amountCents > 0)
    .reduce((sum, t) => sum + t.amountCents, 0);

  const plan = planInfo.plan;
  const planId = planInfo.planId;
  const memberSince = dbUser?.createdAt || new Date();
  const verifiedCount = verifications.filter((v) => v.status === "VERIFIED").length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Account"
        title="Your account report"
        description="Profile summary, membership, payments, and activity in one place."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/billing" className="btn-secondary text-sm">
              Manage plan
            </Link>
            <Link href="/dashboard" className="btn-primary text-sm">
              Dashboard
            </Link>
          </div>
        }
      />

      {/* Identity */}
      <Card className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <UserAvatar name={user.name} image={dbUser?.image || user.image} size="lg" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-xl font-semibold text-stone-900">
                  {dbUser?.name || user.name}
                </h2>
                <Badge variant={planId === "FREE" ? "default" : "success"}>{planId}</Badge>
                {dbUser?.placementVerified && (
                  <Badge variant="verified">
                    <BadgeCheck className="h-3.5 w-3.5" /> Placement ready
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {user.email} · {user.role === "AUPAIR" ? "Sitter / provider" : user.role === "PARENT" ? "Host / family" : user.role}
              </p>
              <p className="mt-1 text-xs text-stone-400">
                Member since {format(memberSince, "MMM d, yyyy")}
                {dbUser?.lastActiveAt
                  ? ` · Last active ${format(dbUser.lastActiveAt, "MMM d, yyyy")}`
                  : ""}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center sm:text-right">
            <div className="rounded-xl bg-stone-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Spent
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                {formatZar(totalSpentCents)}
              </p>
            </div>
            <div className="rounded-xl bg-stone-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Safety
              </p>
              <p className="mt-1 font-display text-lg font-semibold text-stone-900">
                {dbUser?.safetyScore ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Snapshot cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Sparkles className="h-4 w-4" />}
          label="Current plan"
          value={plan.name}
          hint={
            planInfo.subscription?.currentPeriodEnd
              ? `Until ${format(planInfo.subscription.currentPeriodEnd, "MMM d, yyyy")}`
              : plan.tagline
          }
        />
        <StatCard
          icon={<Receipt className="h-4 w-4" />}
          label="Transactions"
          value={String(transactions.length)}
          hint={`${formatZar(totalSpentCents)} successful spend`}
        />
        <StatCard
          icon={<Activity className="h-4 w-4" />}
          label="Boosts used"
          value={String(boosts.length)}
          hint={boosts[0] ? `Last ${format(boosts[0].startedAt, "MMM d")}` : "None yet"}
        />
        <StatCard
          icon={<BadgeCheck className="h-4 w-4" />}
          label="Verifications"
          value={`${verifiedCount}`}
          hint={`${verifications.length} total checks`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Transactions */}
        <section className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <CreditCard className="h-5 w-5 text-teal-700" />
              Transaction history
            </h3>
            <Link href="/pricing" className="text-sm font-semibold text-teal-700 hover:underline">
              Upgrade
            </Link>
          </div>

          {transactions.length === 0 ? (
            <EmptyState
              icon={<Receipt className="h-7 w-7" />}
              title="No payments yet"
              description="Membership upgrades, profile boosts, and placement fees will appear here."
              action={
                <Link href="/pricing" className="btn-primary">
                  View plans
                </Link>
              }
            />
          ) : (
            <Card className="overflow-hidden !p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-stone-100 bg-stone-50/80 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Date</th>
                      <th className="px-4 py-3 font-semibold">Description</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-stone-50/60">
                        <td className="whitespace-nowrap px-4 py-3 text-stone-600">
                          {format(t.paidAt, "MMM d, yyyy")}
                          <span className="mt-0.5 block text-[11px] text-stone-400">
                            {format(t.paidAt, "HH:mm")}
                          </span>
                        </td>
                        <td className="max-w-[14rem] px-4 py-3">
                          <p className="font-medium text-stone-800">{t.description}</p>
                          {t.reference && (
                            <p className="mt-0.5 truncate text-[11px] text-stone-400" title={t.reference}>
                              Ref: {t.reference}
                            </p>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <Badge>{paymentKindLabel(t.kind)}</Badge>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <StatusPill status={t.status} />
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-stone-900">
                          {t.amountCents > 0 ? formatZar(t.amountCents) : "—"}
                          <span className="mt-0.5 block text-[10px] font-normal uppercase text-stone-400">
                            {t.provider}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>

        {/* Side panels */}
        <aside className="space-y-6 lg:col-span-2">
          <Card>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <FileText className="h-5 w-5 text-teal-700" />
              Plan entitlements
            </h3>
            <ul className="mt-4 space-y-2 text-sm text-stone-600">
              <li>
                Messages / day:{" "}
                <strong>
                  {plan.limits.messagesPerDay < 0 ? "Unlimited" : plan.limits.messagesPerDay}
                </strong>
              </li>
              <li>
                Interests / week:{" "}
                <strong>
                  {plan.limits.interestsPerWeek < 0
                    ? "Unlimited"
                    : plan.limits.interestsPerWeek}
                </strong>
              </li>
              <li>
                Swipes / day:{" "}
                <strong>
                  {plan.limits.swipesPerDay < 0 ? "Unlimited" : plan.limits.swipesPerDay}
                </strong>
              </li>
              <li>
                Boosts / month: <strong>{plan.limits.boostsPerMonth}</strong>
              </li>
              <li>
                See who liked you:{" "}
                <strong>{plan.limits.canSeeWhoLikedYou ? "Yes" : "No"}</strong>
              </li>
              <li>
                Read receipts: <strong>{plan.limits.readReceipts ? "Yes" : "No"}</strong>
              </li>
            </ul>
            <div className="mt-4 rounded-xl bg-teal-50/70 px-3 py-2 text-xs text-teal-900">
              Today: {usage.messages} messages · {usage.swipes} swipes · this week{" "}
              {usage.interests} interests
            </div>
            <Link
              href="/billing"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:underline"
            >
              Open billing <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Card>

          <Card>
            <h3 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Calendar className="h-5 w-5 text-teal-700" />
              Activity
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-stone-600">
              <li className="flex justify-between gap-3">
                <span>Placements</span>
                <strong>{placements.length}</strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>Success fees paid</span>
                <strong>
                  {placements.filter((p) => p.successFeePaidAt).length}
                </strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>Boost windows</span>
                <strong>{boosts.length}</strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>Store products</span>
                <strong>{products.length}</strong>
              </li>
              <li className="flex justify-between gap-3">
                <span>Support tickets</span>
                <strong>{supportTickets.length}</strong>
              </li>
            </ul>
          </Card>

          {boosts.length > 0 && (
            <Card>
              <h3 className="font-display text-lg font-semibold">Recent boosts</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {boosts.slice(0, 5).map((b) => (
                  <li
                    key={b.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 px-3 py-2"
                  >
                    <span className="text-stone-600">
                      {format(b.startedAt, "MMM d")} – {format(b.endsAt, "MMM d")}
                    </span>
                    <span className="text-xs text-stone-400">
                      {b.views} views · {b.likes} likes
                    </span>
                  </li>
                ))}
              </ul>
              <Link href="/boost" className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline">
                Boost again
              </Link>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-stone-400">
        <span className="text-teal-700">{icon}</span>
        {label}
      </div>
      <p className="mt-2 font-display text-xl font-semibold text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-500">{hint}</p>
    </Card>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toUpperCase();
  const cls =
    s === "SUCCESS"
      ? "bg-emerald-50 text-emerald-800"
      : s === "PENDING"
        ? "bg-amber-50 text-amber-900"
        : s === "FAILED" || s === "REFUNDED"
          ? "bg-red-50 text-red-700"
          : "bg-stone-100 text-stone-600";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {s}
    </span>
  );
}
