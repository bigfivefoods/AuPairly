import Link from "next/link";
import {
  BadgeCheck,
  Edit3,
  MessageCircle,
  Search,
  Shield,
  Eye,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Avatar, Badge, Card, PageHeader, VerifiedBadge } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();

  const [aupair, family, verifications, conversations] = await Promise.all([
    user.role === "AUPAIR"
      ? prisma.auPairProfile.findUnique({ where: { userId: user.id } })
      : null,
    user.role === "PARENT"
      ? prisma.familyProfile.findUnique({ where: { userId: user.id } })
      : null,
    prisma.verification.findMany({
      where: { userId: user.id, status: "VERIFIED" },
    }),
    prisma.conversation.count({
      where: { OR: [{ userAId: user.id }, { userBId: user.id }] },
    }),
  ]);

  const profile = aupair || family;
  const isVerified = profile?.isVerified ?? false;
  const listingStatus = profile?.status ?? "DRAFT";
  const verifiedTypes = new Set(verifications.map((v) => v.type));
  const verifySteps = ["ID", "SELFIE", "REFERENCES", "BACKGROUND"] as const;
  const verifyProgress = verifySteps.filter((t) => verifiedTypes.has(t)).length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Your hub"
        title={`Hello, ${user.name.split(" ")[0]}`}
        description={
          user.role === "ADMIN"
            ? "Review verifications and safety reports for AuPairly."
            : user.role === "AUPAIR"
              ? "Manage your au pair profile, verification, and messages."
              : "Manage your family listing, verification, and conversations with au pairs."
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow)]">
        <Avatar name={user.name} image={user.image} size="lg" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold">{user.name}</h2>
            {user.role === "ADMIN" ? (
              <Badge variant="accent">Admin</Badge>
            ) : isVerified ? (
              <VerifiedBadge />
            ) : (
              <Badge variant="warning">Unverified</Badge>
            )}
            {user.role !== "ADMIN" && (
              <Badge variant={listingStatus === "ACTIVE" ? "success" : "default"}>
                Listing: {listingStatus.toLowerCase()}
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            {user.role === "ADMIN"
              ? "Administrator"
              : user.role === "AUPAIR"
                ? "Au pair account"
                : "Parent / family account"}{" "}
            · {user.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="btn-primary">
              Open admin console
            </Link>
          ) : (
            <Link href="/profile/edit" className="btn-primary">
              <Edit3 className="h-4 w-4" />
              Edit profile
            </Link>
          )}
        </div>
      </div>

      {user.role === "ADMIN" && (
        <Card className="mb-10">
          <h3 className="font-display text-lg font-semibold">Admin shortcuts</h3>
          <p className="mt-2 text-sm text-stone-500">
            Approve identity checks and review community reports.
          </p>
          <Link href="/admin" className="btn-secondary mt-4 inline-flex">
            Go to verification queue
          </Link>
        </Card>
      )}

      {user.role !== "ADMIN" && (
      <>
      {/* Checklist */}
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <ChecklistCard
          done={Boolean(profile?.bio && profile?.headline)}
          title="Complete profile"
          desc="Add bio, location, and details"
          href="/profile/edit"
        />
        <ChecklistCard
          done={isVerified}
          title="Get verified"
          desc={`${verifyProgress}/${verifySteps.length} checks complete`}
          href="/verification"
        />
        <ChecklistCard
          done={listingStatus === "ACTIVE"}
          title="Publish listing"
          desc="Go live on the marketplace"
          href="/profile/edit"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Quick actions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action
              href={user.role === "AUPAIR" ? "/browse/families" : "/browse/aupairs"}
              icon={<Search className="h-5 w-5" />}
              title={user.role === "AUPAIR" ? "Browse families" : "Browse au pairs"}
              desc="Discover new matches"
            />
            <Action
              href="/messages"
              icon={<MessageCircle className="h-5 w-5" />}
              title="Messages"
              desc={`${conversations} conversation${conversations === 1 ? "" : "s"}`}
            />
            <Action
              href="/verification"
              icon={<Shield className="h-5 w-5" />}
              title="Verification center"
              desc={isVerified ? "You're verified" : "Boost trust & visibility"}
            />
            <Action
              href={
                profile
                  ? user.role === "AUPAIR"
                    ? `/browse/aupairs/${profile.id}`
                    : `/browse/families/${profile.id}`
                  : "/profile/edit"
              }
              icon={<Eye className="h-5 w-5" />}
              title="View public profile"
              desc="See how others see you"
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-teal-600" />
            <h3 className="font-display text-lg font-semibold">Tips</h3>
          </div>
          <ul className="mt-4 space-y-3 text-sm text-stone-600">
            <li className="flex gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              Verified profiles get up to 3× more messages.
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              Write a warm, specific bio — mention ages of kids or languages.
            </li>
            <li className="flex gap-2">
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
              Reply within 24 hours to stay top of mind.
            </li>
          </ul>
          {!isVerified && (
            <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              Complete ID + selfie verification to unlock your Verified badge.
            </div>
          )}
        </Card>
      </div>
      </>
      )}
    </div>
  );
}

function ChecklistCard({
  done,
  title,
  desc,
  href,
}: {
  done: boolean;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 transition hover:shadow-md ${
        done
          ? "border-emerald-200 bg-emerald-50/50"
          : "border-stone-200 bg-white shadow-sm"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${
            done ? "bg-emerald-500" : "bg-stone-300"
          }`}
        >
          {done ? "✓" : "!"}
        </span>
        <h3 className="font-semibold text-stone-900">{title}</h3>
      </div>
      <p className="mt-2 text-sm text-stone-500">{desc}</p>
    </Link>
  );
}

function Action({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-3 rounded-xl border border-stone-100 bg-stone-50/80 p-4 transition hover:border-teal-200 hover:bg-teal-50/40"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        <p className="text-sm text-stone-500">{desc}</p>
      </div>
    </Link>
  );
}
