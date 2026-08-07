import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Users,
  UserPlus,
  Home,
  HandHeart,
  MessageCircle,
  BadgeCheck,
  CreditCard,
  AlertTriangle,
  Shield,
  Mail,
  MapPin,
  Crown,
  Activity,
  ExternalLink,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canAccessManagement, MANAGEMENT_OWNER_EMAIL } from "@/lib/management";
import { PageHeader, Card, Badge } from "@/components/ui";
import { buildPageMetadata } from "@/lib/seo";
import { isPrivyConfigured } from "@/lib/privy";
import { isPaystackConfigured } from "@/lib/paystack";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Management console",
  description: "AuPairly site stats and operations overview.",
  path: "/manage",
  noIndex: true,
});

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number) {
  const x = startOfDay();
  x.setDate(x.getDate() - n);
  return x;
}

function formatZar(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export default async function ManagePage() {
  const user = await requireUser();
  if (!canAccessManagement(user)) {
    redirect("/dashboard");
  }

  const now = new Date();
  const today = startOfDay(now);
  const week = daysAgo(7);
  const month = daysAgo(30);

  const [
    totals,
    byRole,
    byPlan,
    signups,
    listings,
    engagement,
    money,
    queues,
    recentUsers,
    recentPayments,
    waitlist,
    topCities,
    system,
  ] = await Promise.all([
    // totals
    Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { suspendedAt: { not: null } } }),
      prisma.auPairProfile.count({ where: { status: "ACTIVE" } }),
      prisma.familyProfile.count({ where: { status: "ACTIVE" } }),
      prisma.auPairProfile.count({ where: { status: "DRAFT" } }),
      prisma.familyProfile.count({ where: { status: "DRAFT" } }),
      prisma.auPairProfile.count({ where: { isVerified: true } }),
      prisma.familyProfile.count({ where: { isVerified: true } }),
    ]).then(
      ([
        users,
        suspended,
        sittersActive,
        hostsActive,
        sittersDraft,
        hostsDraft,
        sittersVerified,
        hostsVerified,
      ]) => ({
        users,
        suspended,
        sittersActive,
        hostsActive,
        sittersDraft,
        hostsDraft,
        sittersVerified,
        hostsVerified,
      })
    ),

    // role breakdown
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),

    // plan breakdown
    prisma.user.groupBy({
      by: ["plan"],
      _count: { _all: true },
    }),

    // signups windows
    Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: week } } }),
      prisma.user.count({ where: { createdAt: { gte: month } } }),
      prisma.user.count({
        where: { createdAt: { gte: today }, role: "AUPAIR" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: today }, role: "PARENT" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: week }, role: "AUPAIR" },
      }),
      prisma.user.count({
        where: { createdAt: { gte: week }, role: "PARENT" },
      }),
    ]).then(
      ([
        todayTotal,
        weekTotal,
        monthTotal,
        todaySitters,
        todayHosts,
        weekSitters,
        weekHosts,
      ]) => ({
        todayTotal,
        weekTotal,
        monthTotal,
        todaySitters,
        todayHosts,
        weekSitters,
        weekHosts,
      })
    ),

    // listings health
    Promise.all([
      prisma.auPairProfile.count({
        where: { status: "ACTIVE", city: { not: null } },
      }),
      prisma.familyProfile.count({
        where: { status: "ACTIVE", city: { not: null } },
      }),
      prisma.auPairProfile.count({
        where: { status: "ACTIVE", isFeatured: true },
      }),
    ]).then(([sittersWithCity, hostsWithCity, featured]) => ({
      sittersWithCity,
      hostsWithCity,
      featured,
    })),

    // engagement
    Promise.all([
      prisma.conversation.count(),
      prisma.message.count(),
      prisma.message.count({ where: { createdAt: { gte: today } } }),
      prisma.interest.count(),
      prisma.interest.count({ where: { createdAt: { gte: week } } }),
      prisma.swipe.count({ where: { createdAt: { gte: week } } }),
      prisma.review.count(),
      prisma.savedSearch.count({ where: { alertEnabled: true } }),
    ]).then(
      ([
        conversations,
        messages,
        messagesToday,
        interests,
        interestsWeek,
        swipesWeek,
        reviews,
        savedAlerts,
      ]) => ({
        conversations,
        messages,
        messagesToday,
        interests,
        interestsWeek,
        swipesWeek,
        reviews,
        savedAlerts,
      })
    ),

    // money
    Promise.all([
      prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS" },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS", paidAt: { gte: month } },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.paymentTransaction.aggregate({
        where: { status: "SUCCESS", paidAt: { gte: today } },
        _sum: { amountCents: true },
        _count: true,
      }),
      prisma.user.count({
        where: { plan: { in: ["PLUS", "PREMIUM"] } },
      }),
    ]).then(([all, mo, day, paidUsers]) => ({
      lifetimeCents: all._sum.amountCents ?? 0,
      lifetimeCount: all._count,
      monthCents: mo._sum.amountCents ?? 0,
      monthCount: mo._count,
      todayCents: day._sum.amountCents ?? 0,
      todayCount: day._count,
      paidUsers,
    })),

    // ops queues
    Promise.all([
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.supportTicket.count({ where: { status: "OPEN" } }),
      prisma.cityWaitlist.count(),
    ]).then(([pendingVerify, openReports, openTickets, waitlistCount]) => ({
      pendingVerify,
      openReports,
      openTickets,
      waitlistCount,
    })),

    // recent signups
    prisma.user.findMany({
      where: { role: { in: ["AUPAIR", "PARENT"] } },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
        emailVerified: true,
        image: true,
        aupairProfile: { select: { city: true, status: true, isVerified: true } },
        familyProfile: { select: { city: true, status: true, isVerified: true } },
      },
    }),

    // recent payments
    prisma.paymentTransaction.findMany({
      where: { status: "SUCCESS" },
      orderBy: { paidAt: "desc" },
      take: 15,
      select: {
        id: true,
        kind: true,
        amountCents: true,
        currency: true,
        description: true,
        paidAt: true,
        user: { select: { name: true, email: true } },
      },
    }),

    // waitlist sample
    prisma.cityWaitlist.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
    }),

    // top cities (sitters)
    prisma.auPairProfile.groupBy({
      by: ["city"],
      where: { status: "ACTIVE", city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 8,
    }),

    // system flags (no secrets)
    Promise.resolve({
      database: true,
      privy: isPrivyConfigured(),
      paystack: isPaystackConfigured(),
      resend: Boolean(process.env.RESEND_API_KEY),
      cron: Boolean(process.env.CRON_SECRET),
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL || null,
      autoVerify: process.env.AUTO_VERIFY === "true",
    }),
  ]);

  const roleMap = Object.fromEntries(
    byRole.map((r) => [r.role, r._count._all])
  ) as Record<string, number>;
  const planMap = Object.fromEntries(
    byPlan.map((p) => [p.plan || "FREE", p._count._all])
  ) as Record<string, number>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Owner console"
        title="Management"
        description={`Signed in as ${user.email}. Full site stats for AuPairly (owner: ${MANAGEMENT_OWNER_EMAIL}).`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link href="/admin" className="btn-secondary">
          <Shield className="h-4 w-4" />
          Verification &amp; reports
        </Link>
        <Link href="/api/health" className="btn-secondary" target="_blank">
          <Activity className="h-4 w-4" />
          Health JSON
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
      </div>

      {/* Signups hero */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
          Signups
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Total members"
            value={totals.users}
            hint={`${roleMap.AUPAIR ?? 0} sitters · ${roleMap.PARENT ?? 0} hosts · ${roleMap.ADMIN ?? 0} admin`}
            accent="teal"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5" />}
            label="Today"
            value={signups.todayTotal}
            hint={`${signups.todaySitters} sitters · ${signups.todayHosts} hosts`}
            accent="emerald"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5" />}
            label="Last 7 days"
            value={signups.weekTotal}
            hint={`${signups.weekSitters} sitters · ${signups.weekHosts} hosts`}
            accent="teal"
          />
          <StatCard
            icon={<UserPlus className="h-5 w-5" />}
            label="Last 30 days"
            value={signups.monthTotal}
            hint="New accounts"
            accent="stone"
          />
        </div>
      </section>

      {/* Marketplace */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
          Marketplace
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<HandHeart className="h-5 w-5" />}
            label="Active sitters"
            value={totals.sittersActive}
            hint={`${totals.sittersDraft} draft · ${totals.sittersVerified} verified`}
          />
          <StatCard
            icon={<Home className="h-5 w-5" />}
            label="Active hosts"
            value={totals.hostsActive}
            hint={`${totals.hostsDraft} draft · ${totals.hostsVerified} verified`}
          />
          <StatCard
            icon={<MapPin className="h-5 w-5" />}
            label="Listings with city"
            value={listings.sittersWithCity + listings.hostsWithCity}
            hint={`${listings.sittersWithCity} sitters · ${listings.hostsWithCity} hosts`}
          />
          <StatCard
            icon={<Crown className="h-5 w-5" />}
            label="Paid plans"
            value={money.paidUsers}
            hint={`Plus ${planMap.PLUS ?? 0} · Premium ${planMap.PREMIUM ?? 0} · Free ${planMap.FREE ?? 0}`}
            accent="amber"
          />
        </div>
      </section>

      {/* Engagement + revenue */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-base font-semibold">Engagement</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Row label="Conversations" value={engagement.conversations} />
            <Row label="Messages (all)" value={engagement.messages} />
            <Row label="Messages today" value={engagement.messagesToday} />
            <Row label="Interests (all)" value={engagement.interests} />
            <Row label="Interests (7d)" value={engagement.interestsWeek} />
            <Row label="Discover swipes (7d)" value={engagement.swipesWeek} />
            <Row label="Reviews" value={engagement.reviews} />
            <Row label="Saved-search alerts" value={engagement.savedAlerts} />
          </dl>
        </Card>
        <Card>
          <h3 className="font-display text-base font-semibold">Revenue (Paystack ledger)</h3>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Row label="Today" value={`${formatZar(money.todayCents)} (${money.todayCount})`} />
            <Row label="Last 30 days" value={`${formatZar(money.monthCents)} (${money.monthCount})`} />
            <Row label="Lifetime" value={`${formatZar(money.lifetimeCents)} (${money.lifetimeCount})`} />
            <Row label="Suspended users" value={totals.suspended} />
          </dl>
          <p className="mt-3 text-xs text-stone-500">
            Amounts from successful <code className="text-[11px]">PaymentTransaction</code> rows.
          </p>
        </Card>
      </section>

      {/* Ops queues + system */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-base font-semibold">Ops queues</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <QueueItem
              href="/admin"
              icon={<BadgeCheck className="h-4 w-4" />}
              label="Pending verifications"
              count={queues.pendingVerify}
              hot={queues.pendingVerify > 0}
            />
            <QueueItem
              href="/admin"
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Open reports"
              count={queues.openReports}
              hot={queues.openReports > 0}
            />
            <QueueItem
              href="/support"
              icon={<Mail className="h-4 w-4" />}
              label="Open support tickets"
              count={queues.openTickets}
              hot={queues.openTickets > 0}
            />
            <QueueItem
              href="/manage"
              icon={<MapPin className="h-4 w-4" />}
              label="City waitlist entries"
              count={queues.waitlistCount}
            />
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-base font-semibold">System readiness</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <Flag ok={system.database} label="Database" />
            <Flag ok={system.privy} label="Privy (email OTP)" />
            <Flag ok={system.paystack} label="Paystack" />
            <Flag ok={system.resend} label="Resend (digest emails)" />
            <Flag ok={system.cron} label="CRON_SECRET" />
            <Flag ok={!system.autoVerify} label="AUTO_VERIFY off (prod safe)" warn={system.autoVerify} />
          </ul>
          {system.siteUrl && (
            <p className="mt-3 text-xs text-stone-500">
              Site URL: <span className="font-medium text-stone-700">{system.siteUrl}</span>
            </p>
          )}
        </Card>
      </section>

      {/* Recent signups table */}
      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
          Latest signups
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Name</th>
                <th className="px-3 py-2.5 font-semibold">Email</th>
                <th className="px-3 py-2.5 font-semibold">Role</th>
                <th className="px-3 py-2.5 font-semibold">Plan</th>
                <th className="px-3 py-2.5 font-semibold">City / listing</th>
                <th className="px-3 py-2.5 font-semibold">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {recentUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-stone-400">
                    No members yet
                  </td>
                </tr>
              ) : (
                recentUsers.map((u) => {
                  const prof = u.aupairProfile || u.familyProfile;
                  return (
                    <tr key={u.id} className="hover:bg-stone-50/80">
                      <td className="px-3 py-2.5 font-medium text-stone-900">
                        {u.name}
                        {u.emailVerified && (
                          <span className="ml-1 text-[10px] font-semibold text-emerald-700">
                            ✓ email
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-stone-600">{u.email}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={u.role === "AUPAIR" ? "accent" : "default"}>
                          {u.role === "AUPAIR" ? "Sitter" : "Host"}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-stone-600">{u.plan || "FREE"}</td>
                      <td className="px-3 py-2.5 text-stone-600">
                        {prof?.city || "—"}
                        {prof?.status ? (
                          <span className="ml-1 text-xs text-stone-400">
                            · {prof.status.toLowerCase()}
                            {prof.isVerified ? " · verified" : ""}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-stone-500">
                        {u.createdAt.toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-base font-semibold">Recent payments</h3>
          {recentPayments.length === 0 ? (
            <p className="mt-3 text-sm text-stone-400">No successful payments yet.</p>
          ) : (
            <ul className="mt-3 divide-y divide-stone-100">
              {recentPayments.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-2 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-900">
                      {formatZar(p.amountCents)} · {p.kind}
                    </p>
                    <p className="truncate text-xs text-stone-500">
                      {p.user?.name} · {p.user?.email}
                    </p>
                    <p className="text-xs text-stone-400">{p.description}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-stone-400">
                    {p.paidAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-base font-semibold">Top sitter cities</h3>
          {topCities.length === 0 ? (
            <p className="mt-3 text-sm text-stone-400">No active city data yet.</p>
          ) : (
            <ul className="mt-3 space-y-1.5 text-sm">
              {topCities.map((c) => (
                <li
                  key={c.city || "unknown"}
                  className="flex justify-between rounded-lg bg-stone-50 px-3 py-2"
                >
                  <span className="font-medium text-stone-800">{c.city || "Unknown"}</span>
                  <span className="text-stone-500">{c._count._all}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-6 font-display text-base font-semibold">City waitlist</h3>
          {waitlist.length === 0 ? (
            <p className="mt-2 text-sm text-stone-400">No waitlist signups yet.</p>
          ) : (
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-stone-600">
              {waitlist.map((w) => (
                <li key={w.id} className="flex justify-between gap-2 border-b border-stone-50 py-1.5">
                  <span className="truncate">
                    {w.email} · {w.city}
                    {w.role ? ` (${w.role})` : ""}
                  </span>
                  <span className="shrink-0 text-stone-400">
                    {w.createdAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <p className="text-center text-xs text-stone-400">
        Access: ADMIN role or owner email <strong>{MANAGEMENT_OWNER_EMAIL}</strong>
        {user.email?.toLowerCase() === MANAGEMENT_OWNER_EMAIL.toLowerCase()
          ? " · you have owner access"
          : ""}
        . Optional env: <code className="text-[10px]">MANAGEMENT_EMAILS</code>
      </p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
  accent = "teal",
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  hint?: string;
  accent?: "teal" | "emerald" | "amber" | "stone";
}) {
  const ring =
    accent === "emerald"
      ? "border-emerald-200 bg-emerald-50/40"
      : accent === "amber"
        ? "border-amber-200 bg-amber-50/40"
        : accent === "stone"
          ? "border-stone-200 bg-white"
          : "border-teal-200 bg-teal-50/30";
  return (
    <div className={`rounded-2xl border px-4 py-4 shadow-sm ${ring}`}>
      <div className="flex items-center gap-2 text-stone-500">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl font-semibold text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-stone-50 px-3 py-2">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-stone-400">
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

function QueueItem({
  href,
  icon,
  label,
  count,
  hot,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  count: number;
  hot?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex items-center justify-between rounded-xl border px-3 py-2.5 transition hover:border-teal-300 ${
          hot ? "border-amber-200 bg-amber-50/50" : "border-stone-100 bg-stone-50"
        }`}
      >
        <span className="flex items-center gap-2 font-medium text-stone-800">
          {icon}
          {label}
        </span>
        <span className="font-display text-lg font-semibold text-stone-900">{count}</span>
      </Link>
    </li>
  );
}

function Flag({
  ok,
  label,
  warn,
}: {
  ok: boolean;
  label: string;
  warn?: boolean;
}) {
  return (
    <li className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2">
      <span className="text-stone-700">{label}</span>
      <span
        className={
          warn
            ? "text-xs font-bold text-amber-700"
            : ok
              ? "text-xs font-bold text-emerald-700"
              : "text-xs font-bold text-red-600"
        }
      >
        {warn ? "WARN" : ok ? "OK" : "MISSING"}
      </span>
    </li>
  );
}
