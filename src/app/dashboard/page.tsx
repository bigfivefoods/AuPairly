import type { Metadata } from "next";
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
  Users,
} from "lucide-react";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge, Card, PageHeader, VerifiedBadge } from "@/components/ui";
import { UserAvatar } from "@/components/user-avatar";
import { CompletenessCoach } from "@/components/completeness-coach";
import { PushSettingsCard } from "@/components/pwa-provider";
import { responseTimeLabel } from "@/lib/completeness";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Your AuPairly hub — manage listing, messages, and verification.",
  path: "/dashboard",
  noIndex: true,
});

export default async function DashboardPage() {
  const user = await requireUser();

  const [aupair, family, verifications, conversations, refCount, docCount, meUser] =
    await Promise.all([
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
      prisma.referenceRequest.count({
        where: { subjectId: user.id, status: "SUBMITTED" },
      }),
      prisma.secureDocument.count({ where: { userId: user.id } }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          videoIntroUrl: true,
          safetyScore: true,
          avgResponseMinutes: true,
          image: true,
        },
      }),
    ]);

  const profile = aupair || family;
  const isVerified = profile?.isVerified ?? false;
  const listingStatus = profile?.status ?? "DRAFT";
  const verifiedTypes = new Set(verifications.map((v) => v.type));
  const verifySteps = ["ID", "SELFIE", "REFERENCES", "BACKGROUND"] as const;
  const verifyProgress = verifySteps.filter((t) => verifiedTypes.has(t)).length;
  const responseLabel = responseTimeLabel(meUser?.avgResponseMinutes);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Your hub"
        title={`Hello, ${user.name.split(" ")[0]}`}
        description={
          user.role === "ADMIN"
            ? "Review verifications and safety reports for AuPairly."
            : user.role === "AUPAIR"
              ? "Manage services (childcare, house & pet sitting), verification, and messages."
              : "Manage what you need (childcare, house & pet sitting), verification, and messages."
        }
      />

      <div className="mb-8 flex flex-wrap items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-[var(--shadow)]">
        <UserAvatar
          name={user.name}
          image={meUser?.image || user.image}
          size="lg"
        />
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
                ? "Sitter / provider account"
                : "Host / family account"}{" "}
            · {user.email}
            {responseLabel ? ` · ${responseLabel}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {user.role === "ADMIN" ? (
            <Link href="/admin" className="btn-primary">
              Open admin console
            </Link>
          ) : (
            <>
              <Link href="/onboarding" className="btn-secondary">
                Setup wizard
              </Link>
              <Link href="/profile/edit" className="btn-primary">
                <Edit3 className="h-4 w-4" />
                Edit profile
              </Link>
              <Link href="/account" className="btn-secondary">
                Account report
              </Link>
              <Link href="/discover" className="btn-secondary">
                <Search className="h-4 w-4" />
                Discover
              </Link>
            </>
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

      <div className="mb-8">
        <CompletenessCoach
          input={{
            role: user.role,
            name: user.name,
            image: meUser?.image || user.image,
            videoIntroUrl: meUser?.videoIntroUrl,
            headline: profile?.headline,
            bio: profile?.bio,
            city: profile?.city,
            country: profile?.country,
            languages: profile?.languages,
            services: profile?.services,
            status: profile?.status,
            isVerified,
            experienceYears: aupair?.experienceYears,
            pocketMoneyMin: aupair?.pocketMoneyMin,
            availableFrom: aupair?.availableFrom,
            workRights: aupair?.workRights,
            childrenCount: family?.childrenCount,
            childrenAges: family?.childrenAges,
            pocketMoney: family?.pocketMoney,
            startDate: family?.startDate,
            schoolArea: family?.schoolArea,
            lifestyleNotes: family?.lifestyleNotes,
            referenceCount: refCount,
            documentCount: docCount,
            safetyScore: meUser?.safetyScore,
          }}
        />
      </div>

      {/* Simple invite / growth */}
      <Card className="mb-8 border-teal-100 bg-gradient-to-r from-teal-50/80 to-white">
        <h3 className="font-display text-lg font-semibold text-stone-900">Invite someone to AuPairly</h3>
        <p className="mt-1 text-sm text-stone-500">
          Share AuPairly with a host or sitter. More local supply = better matches for everyone.
        </p>
        <p className="mt-3 break-all rounded-xl border border-teal-100 bg-white px-3 py-2 font-mono text-xs text-teal-800">
          {(
            process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"
          ).replace(/\/$/, "")}
          /register?ref={user.id.slice(0, 8)}
        </p>
        <p className="mt-2 text-xs text-stone-400">
          Suggested share text: “Join me on AuPairly — trusted care for family, loved ones, home
          &amp; pets.”
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">Quick actions</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Action
              href="/discover"
              icon={<Search className="h-5 w-5" />}
              title="Discover"
              desc="Swipe to match with hosts or sitters"
            />
            {user.role === "AUPAIR" && (
              <Action
                href="/community"
                icon={<Users className="h-5 w-5" />}
                title="AuPair Connect"
                desc="Make friends with sitters nearby while abroad"
              />
            )}
            <Action
              href="/shortlist"
              icon={<Sparkles className="h-5 w-5" />}
              title="Shortlist"
              desc="Compare saved candidates side-by-side"
            />
            <Action
              href="/availability"
              icon={<Search className="h-5 w-5" />}
              title="Availability"
              desc="Free / busy / need cover calendar"
            />
            <Action
              href="/saved-searches"
              icon={<Search className="h-5 w-5" />}
              title="Saved searches"
              desc="Alerts when new matches appear"
            />
            <Action
              href="/applications"
              icon={<Sparkles className="h-5 w-5" />}
              title="Applications"
              desc="Full packets with docs & references"
            />
            <Action
              href="/matches"
              icon={<Sparkles className="h-5 w-5" />}
              title="Weekly matches"
              desc="Your top compatibility picks"
            />
            <Action
              href="/map"
              icon={<Search className="h-5 w-5" />}
              title="Map browse"
              desc="Explore by city (privacy-safe pins)"
            />
            <Action
              href={user.role === "AUPAIR" ? "/browse/families" : "/browse/aupairs"}
              icon={<Search className="h-5 w-5" />}
              title={user.role === "AUPAIR" ? "Browse hosts" : "Browse sitters"}
              desc="Full marketplace search by service"
            />
            <Action
              href="/safety"
              icon={<Shield className="h-5 w-5" />}
              title="Safety tips"
              desc="Category-specific trust checklist"
            />
            <Action
              href="/messages"
              icon={<MessageCircle className="h-5 w-5" />}
              title="Messages"
              desc={`${conversations} conversation${conversations === 1 ? "" : "s"}`}
            />
            <Action
              href="/pricing"
              icon={<Sparkles className="h-5 w-5" />}
              title="Upgrade plan"
              desc="Unlimited likes, messages & boosts"
            />
            <Action
              href="/settings/notifications"
              icon={<Sparkles className="h-5 w-5" />}
              title="App & push alerts"
              desc="Install PWA · enable message notifications"
            />
            <Action
              href="/settings/connections"
              icon={<Sparkles className="h-5 w-5" />}
              title="Connected accounts"
              desc="Link Facebook for name & photo import"
            />
            <Action
              href="/placements"
              icon={<Sparkles className="h-5 w-5" />}
              title="Placements"
              desc="Interview → trial → placed pipeline"
            />
            <Action
              href="/household"
              icon={<Sparkles className="h-5 w-5" />}
              title="Partner seat"
              desc="Co-parent access (Premium)"
            />
            <Action
              href="/trust"
              icon={<Shield className="h-5 w-5" />}
              title="Trust centre"
              desc="Video, references, safety score"
            />
            <Action
              href="/coach"
              icon={<Sparkles className="h-5 w-5" />}
              title="Profile coach"
              desc="Tips & first-message assist"
            />
            <Action
              href="/boost"
              icon={<Sparkles className="h-5 w-5" />}
              title="Boost listing"
              desc="R49 · featured for 7 days + analytics"
            />
            <Action
              href="/documents"
              icon={<Shield className="h-5 w-5" />}
              title="Document vault"
              desc="Passport, clearance, first aid"
            />
            <Action
              href="/connect"
              icon={<Sparkles className="h-5 w-5" />}
              title="Sell with Paystack"
              desc="List products · cards & Apple Pay (SA)"
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

        <div className="space-y-4">
        <PushSettingsCard />
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
