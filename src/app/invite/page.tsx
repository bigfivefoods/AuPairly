import { requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";
import { InviteCard } from "@/components/invite-card";
import { topCitiesByDensity } from "@/lib/city-density";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invite friends · grow your city" };

export default async function InvitePage() {
  const user = await requireUser();
  const { prisma } = await import("@/lib/prisma");
  let top: Awaited<ReturnType<typeof topCitiesByDensity>> = [];
  let referralCount = 0;
  try {
    top = await topCitiesByDensity(8);
    referralCount = await prisma.user.count({ where: { referredById: user.id } });
  } catch {
    top = [];
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Growth"
        title="Invite people near you"
        description="AuPairly works when both hosts and sitters join the same city. Share your link — when someone registers with it, your listing gets a free 3-day Featured boost."
      />

      <InviteCard
        userId={user.id}
        userName={user.name}
        referralCount={referralCount}
      />

      <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-stone-900">
          Where density is strongest
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Thin cities need your invites most. Focus on your metro first.
        </p>
        {top.length === 0 ? (
          <p className="mt-4 text-sm text-stone-400">
            No city stats yet — be the first to publish a listing.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-stone-100">
            {top.map((c) => (
              <li
                key={c.city}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <span className="font-medium text-stone-800">{c.city}</span>
                <span className="text-stone-500">
                  {c.sitters} sitters · {c.hosts} hosts
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/browse/aupairs" className="btn-secondary text-sm">
            Browse sitters
          </Link>
          <Link href="/browse/families" className="btn-secondary text-sm">
            Browse hosts
          </Link>
          <Link href="/map" className="btn-ghost text-sm font-semibold text-teal-700">
            Map & regions →
          </Link>
        </div>
      </div>
    </div>
  );
}
