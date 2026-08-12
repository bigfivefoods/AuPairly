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
import { InviteCard } from "@/components/invite-card";
import { ReviewPromptCard } from "@/components/review-prompt-card";
import { NearYouRail } from "@/components/near-you-rail";
import { ActivateNearbyStrip } from "@/components/quick-interest-card";
import { SafetyMeetChecklist } from "@/components/safety-meet-checklist";
import { SoftPaywall } from "@/components/soft-paywall";
import { responseTimeLabel } from "@/lib/completeness";
import { buildPageMetadata } from "@/lib/seo";
import { checkAndConsume } from "@/lib/entitlements";
import { canAccessManagement } from "@/lib/management";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Dashboard",
  description: "Your AuPairly hub — manage listing, messages, and verification.",
  path: "/dashboard",
  noIndex: true,
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ live?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const justLive = sp.live === "1";

  const [aupair, family, verifications, conversations, refCount, docCount, meUser, referralCount] =
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
      prisma.user.count({ where: { referredById: user.id } }),
    ]);

  const profile = aupair || family;
  const isVerified = profile?.isVerified ?? false;
  const listingStatus = profile?.status ?? "DRAFT";
  const verifiedTypes = new Set(verifications.map((v) => v.type));
  const verifySteps = ["ID", "SELFIE", "REFERENCES", "BACKGROUND"] as const;
  const verifyProgress = verifySteps.filter((t) => verifiedTypes.has(t)).length;
  const responseLabel = responseTimeLabel(meUser?.avgResponseMinutes);
  const hasPhoto = Boolean(meUser?.image || user.image);

  // Near-you rail + free usage remaining
  const city = profile?.city || "";
  let nearYou: {
    id: string;
    href: string;
    name: string;
    image?: string | null;
    headline?: string | null;
    city?: string | null;
    isVerified?: boolean;
    badge?: string;
  }[] = [];
  let activateItems: {
    userId: string;
    profileId: string;
    href: string;
    name: string;
    image?: string | null;
    headline?: string | null;
    city?: string | null;
    isVerified?: boolean;
  }[] = [];
  let msgUsage: { used: number; limit: number } | null = null;
  try {
    const usage = await checkAndConsume(user.id, "MESSAGE", { consume: false });
    if (usage.ok && usage.remaining != null && usage.plan.limits.messagesPerDay > 0) {
      msgUsage = {
        used: usage.plan.limits.messagesPerDay - usage.remaining,
        limit: usage.plan.limits.messagesPerDay,
      };
    } else if (!usage.ok) {
      msgUsage = { used: usage.used, limit: usage.limit };
    }

    const weekMs = 7 * 24 * 60 * 60 * 1000;
    const nowMs = Date.now();
    const byActiveThenVerified = <
      T extends {
        isVerified: boolean;
        createdAt: Date;
        user: { lastActiveAt: Date | null };
      },
    >(
      rows: T[]
    ) =>
      [...rows].sort((a, b) => {
        const aActive =
          a.user.lastActiveAt && nowMs - a.user.lastActiveAt.getTime() < weekMs
            ? 1
            : 0;
        const bActive =
          b.user.lastActiveAt && nowMs - b.user.lastActiveAt.getTime() < weekMs
            ? 1
            : 0;
        if (bActive !== aActive) return bActive - aActive;
        if (Number(b.isVerified) !== Number(a.isVerified)) {
          return Number(b.isVerified) - Number(a.isVerified);
        }
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

    if (city && user.role === "PARENT") {
      const raw = await prisma.auPairProfile.findMany({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
          userId: { not: user.id },
        },
        include: {
          user: { select: { id: true, name: true, image: true, lastActiveAt: true } },
        },
        take: 24,
      });
      const rows = byActiveThenVerified(raw).slice(0, 8);
      nearYou = rows.map((r) => ({
        id: r.id,
        href: `/browse/aupairs/${r.id}`,
        name: r.user.name,
        image: r.user.image,
        headline: r.headline,
        city: r.city,
        isVerified: r.isVerified,
        badge: r.isFeatured
          ? "Featured"
          : r.user.lastActiveAt && nowMs - r.user.lastActiveAt.getTime() < weekMs
            ? "Active"
            : undefined,
      }));
      activateItems = rows.slice(0, 3).map((r) => ({
        userId: r.userId,
        profileId: r.id,
        href: `/browse/aupairs/${r.id}`,
        name: r.user.name,
        image: r.user.image,
        headline: r.headline,
        city: r.city,
        isVerified: r.isVerified,
      }));
    } else if (city && user.role === "AUPAIR") {
      const raw = await prisma.familyProfile.findMany({
        where: {
          status: "ACTIVE",
          city: { contains: city, mode: "insensitive" },
          userId: { not: user.id },
        },
        include: {
          user: { select: { id: true, name: true, image: true, lastActiveAt: true } },
        },
        take: 24,
      });
      const rows = byActiveThenVerified(raw).slice(0, 8);
      nearYou = rows.map((r) => ({
        id: r.id,
        href: `/browse/families/${r.id}`,
        name: r.familyName || r.user.name,
        image: r.user.image,
        headline: r.headline,
        city: r.city,
        isVerified: r.isVerified,
        badge: r.isUrgent
          ? "Urgent"
          : r.user.lastActiveAt && nowMs - r.user.lastActiveAt.getTime() < weekMs
            ? "Active"
            : undefined,
      }));
      activateItems = rows.slice(0, 3).map((r) => ({
        userId: r.userId,
        profileId: r.id,
        href: `/browse/families/${r.id}`,
        name: r.familyName || r.user.name,
        image: r.user.image,
        headline: r.headline,
        city: r.city,
        isVerified: r.isVerified,
      }));
    }
  } catch {
    /* non-fatal */
  }

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

      {justLive && listingStatus === "ACTIVE" && (
        <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 px-5 py-4 text-teal-950 shadow-sm">
          <p className="font-display text-lg font-semibold">You&apos;re live!</p>
          <p className="mt-1 text-sm text-teal-900/90">
            Your listing is published. Send interest to people nearby, get verified, and reply
            fast — response time ranks you higher.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/discover" className="btn-primary">
              <Search className="h-4 w-4" />
              Discover matches
            </Link>
            <Link href="/verification" className="btn-secondary">
              <Shield className="h-4 w-4" />
              Get verified
            </Link>
            <Link href="/pricing?period=QUARTER&plan=PLUS" className="btn-secondary">
              Unlimited matching · R249
            </Link>
          </div>
        </div>
      )}

      {justLive && listingStatus === "ACTIVE" && activateItems.length > 0 && (
        <ActivateNearbyStrip
          title={
            user.role === "PARENT"
              ? "3 sitters near you — say hello"
              : "3 hosts near you — say hello"
          }
          items={activateItems}
        />
      )}

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
          {canAccessManagement(user) ? (
            <>
              <Link href="/manage" className="btn-primary">
                Management console
              </Link>
              <Link href="/admin" className="btn-secondary">
                Verification queue
              </Link>
            </>
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

      {canAccessManagement(user) && (
        <Card className="mb-10 border-teal-200 bg-teal-50/40">
          <h3 className="font-display text-lg font-semibold">Owner console</h3>
          <p className="mt-2 text-sm text-stone-600">
            Signups, listings, revenue, queues, and system health for AuPairly.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/manage" className="btn-primary inline-flex">
              Open management stats
            </Link>
            <Link href="/admin" className="btn-secondary inline-flex">
              Verifications &amp; reports
            </Link>
          </div>
        </Card>
      )}

      {user.role !== "ADMIN" && (
      <>
      {/* Profile completion — full width so progress is impossible to miss */}
      <div className="mb-6">
        <CompletenessCoach
          defaultExpanded
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
            photos: aupair?.photos || family?.photos,
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

      {/* Quick moves under completion */}
      <Card className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Right now
        </p>
        <h3 className="mt-1 font-display text-lg font-semibold text-stone-900">
          Your next 3 moves
        </h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-3">
          <li>
            <Link
              href="/messages"
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 hover:border-teal-300"
            >
              Messages
              <span className="text-xs font-medium text-stone-500">{conversations}</span>
            </Link>
          </li>
          <li>
            <Link
              href={listingStatus === "ACTIVE" ? "/discover" : "/profile/edit"}
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 hover:border-teal-300"
            >
              {listingStatus === "ACTIVE" ? "Discover matches" : "Publish listing"}
              <span className="text-xs font-medium text-teal-700">Go →</span>
            </Link>
          </li>
          <li>
            <Link
              href={
                user.role === "AUPAIR"
                  ? profile?.city
                    ? "/community"
                    : "/profile/edit"
                  : isVerified
                    ? "/browse/aupairs"
                    : "/verification"
              }
              className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-semibold text-stone-800 hover:border-teal-300"
            >
              {user.role === "AUPAIR"
                ? profile?.city
                  ? "AuPair Connect"
                  : "Add your city"
                : isVerified
                  ? "Browse sitters"
                  : "Get verified"}
              <span className="text-xs font-medium text-teal-700">Go →</span>
            </Link>
          </li>
        </ul>
      </Card>

      {/* Activation checklist */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ChecklistCard
          done={hasPhoto}
          title="Add photo"
          desc="Clear face photo = more messages"
          href="/onboarding"
        />
        <ChecklistCard
          done={Boolean(profile?.city && profile?.country)}
          title="Set city"
          desc="Required for local matches"
          href="/onboarding"
        />
        <ChecklistCard
          done={listingStatus === "ACTIVE"}
          title="Publish listing"
          desc="Go live on the marketplace"
          href={listingStatus === "ACTIVE" ? "/discover" : "/onboarding"}
        />
        <ChecklistCard
          done={isVerified}
          title="Get verified"
          desc={`${verifyProgress}/${verifySteps.length} checks complete`}
          href="/verification"
        />
      </div>

      {msgUsage && msgUsage.used >= Math.max(1, msgUsage.limit - 1) && (
        <div className="mb-8">
          <SoftPaywall
            title={
              msgUsage.used >= msgUsage.limit
                ? "Message limit reached"
                : "Almost at your free message limit"
            }
            body="Don't lose a hire mid-chat. Plus unlocks unlimited messages, interests, and Discover."
            used={msgUsage.used}
            limit={msgUsage.limit}
          />
        </div>
      )}

      <NearYouRail
        title={
          city
            ? user.role === "PARENT"
              ? `Sitters near ${city}`
              : `Hosts near ${city}`
            : "Matches near you"
        }
        subtitle={
          city
            ? "Verified and new listings first"
            : "Add your city in setup to see local people"
        }
        items={nearYou}
        emptyHref={user.role === "PARENT" ? "/browse/aupairs" : "/browse/families"}
        emptyLabel={
          city
            ? `No live listings in ${city} yet — browse all or invite friends.`
            : "Set your city to unlock local matches."
        }
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <SafetyMeetChecklist />
        <Card>
          <h3 className="font-display text-lg font-semibold">Boost visibility</h3>
          <p className="mt-1 text-sm text-stone-500">
            R49 for 7 days at the top of Discover &amp; search — great after you publish.
          </p>
          <Link href="/boost" className="btn-secondary mt-4 inline-flex">
            <Sparkles className="h-4 w-4" />
            Get a boost
          </Link>
        </Card>
      </div>

      {/* Growth before payments matter: invite always high on hub */}
      <InviteCard
        userId={user.id}
        userName={user.name}
        referralCount={referralCount}
      />
      <ReviewPromptCard />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h3 className="font-display text-lg font-semibold">More tools</h3>
          <p className="mt-1 text-sm text-stone-500">
            Everything else — focus on your next 3 moves above first.
          </p>
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
