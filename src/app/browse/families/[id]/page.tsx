import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Baby,
  Calendar,
  Clock,
  PawPrint,
  BedDouble,
  Car,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar, Badge, Card, Stars, VerifiedBadge } from "@/components/ui";
import { ContactButton } from "@/components/contact-button";
import { InterestButton } from "@/components/interest-button";
import { StartPlacementButton } from "@/components/start-placement-button";
import { ApplyPacketButton } from "@/components/apply-packet-button";
import { ShortlistButton } from "@/components/shortlist-button";
import { ReviewSection } from "@/components/review-section";
import { ReportButton } from "@/components/report-button";
import { ShareButtons } from "@/components/share-buttons";
import { BlockUserButton } from "@/components/block-user-button";
import { TrustStrip } from "@/components/trust-strip";
import { JsonLd } from "@/components/json-ld";
import { formatLocation, parseJsonArray } from "@/lib/utils";
import { ScheduleDisplay } from "@/components/schedule-display";
import { format } from "date-fns";
import { isReviewPublic } from "@/lib/reviews";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  personProfileJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await prisma.familyProfile.findUnique({
    where: { id },
    select: {
      status: true,
      headline: true,
      bio: true,
      city: true,
      country: true,
      familyName: true,
      isVerified: true,
      coverImage: true,
      user: { select: { name: true, image: true } },
    },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return buildPageMetadata({
      title: "Host listing",
      description: "View host family listings on AuPairly.",
      path: `/browse/families/${id}`,
      noIndex: true,
    });
  }
  const name = profile.familyName || profile.user.name || "Host family";
  const place = [profile.city, profile.country].filter(Boolean).join(", ");
  const title = `${name}${place ? ` in ${place}` : ""} — host listing`;
  const description = (
    profile.headline ||
    profile.bio ||
    `${name} is looking for care on AuPairly${place ? ` in ${place}` : ""}.`
  ).slice(0, 300);
  return buildPageMetadata({
    title,
    description,
    path: `/browse/families/${id}`,
    image: profile.coverImage || profile.user.image || undefined,
    type: "profile",
  });
}

export default async function FamilyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.familyProfile.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, image: true } } },
  });

  if (!profile || (profile.status !== "ACTIVE" && profile.userId !== session?.user?.id)) {
    notFound();
  }

  const familyJsonLd =
    profile.status === "ACTIVE"
      ? [
          personProfileJsonLd({
            name: profile.familyName || profile.user.name || "Host",
            description: profile.headline || profile.bio || undefined,
            path: `/browse/families/${id}`,
            image: profile.user.image || profile.coverImage,
            jobTitle: "Host family",
            city: profile.city,
            country: profile.country,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Hosts", path: "/browse/families" },
            {
              name: profile.familyName || profile.user.name || "Listing",
              path: `/browse/families/${id}`,
            },
          ]),
        ]
      : null;

  const ages = parseJsonArray(profile.childrenAges);
  const languages = parseJsonArray(profile.languages);
  const duties = parseJsonArray(profile.duties);
  const offers = parseJsonArray(profile.offers);
  const photos = parseJsonArray(profile.photos);
  const isOwn = session?.user?.id === profile.userId;
  const displayName = profile.familyName || profile.user.name;

  const [reviews, conversation, myReview, myInterest] = await Promise.all([
    prisma.review.findMany({
      where: { targetId: profile.userId },
      include: {
        author: { select: { id: true, name: true, image: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    session?.user
      ? prisma.conversation.findFirst({
          where: {
            OR: [
              { userAId: session.user.id, userBId: profile.userId },
              { userAId: profile.userId, userBId: session.user.id },
            ],
          },
          include: { messages: { take: 1 } },
        })
      : null,
    session?.user
      ? prisma.review.findUnique({
          where: {
            authorId_targetId: {
              authorId: session.user.id,
              targetId: profile.userId,
            },
          },
        })
      : null,
    session?.user
      ? prisma.interest.findUnique({
          where: {
            fromUserId_toUserId: {
              fromUserId: session.user.id,
              toUserId: profile.userId,
            },
          },
        })
      : null,
  ]);

  const canReview = Boolean(
    session?.user &&
      !isOwn &&
      conversation &&
      conversation.messages.length > 0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {familyJsonLd ? <JsonLd data={familyJsonLd} /> : null}
      <Link
        href="/browse/families"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to families
      </Link>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="!p-0 overflow-hidden">
            <div className="h-36 bg-gradient-to-br from-orange-100 via-amber-50 to-teal-50" />
            <div className="relative px-6 pb-6">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <Avatar
                    name={displayName}
                    image={profile.user.image}
                    size="xl"
                    className="!ring-4 !ring-white shadow-lg"
                  />
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
                        {displayName}
                      </h1>
                      {profile.isVerified && <VerifiedBadge />}
                    </div>
                    <p className="mt-1 text-stone-500">{profile.headline}</p>
                  </div>
                </div>
                {profile.rating > 0 && (
                  <Stars rating={profile.rating} count={profile.reviewCount} />
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">About our family</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
              {profile.bio || "This family has not added a description yet."}
            </p>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">Children</h2>
            <div className="mt-3 flex items-center gap-2 text-stone-600">
              <Baby className="h-5 w-5 text-teal-600" />
              <span>
                {profile.childrenCount} {profile.childrenCount === 1 ? "child" : "children"}
                {ages.length > 0 && ` · ages ${ages.join(", ")}`}
              </span>
            </div>
            {profile.childrenDetails && (
              <p className="mt-3 text-sm leading-relaxed text-stone-500">{profile.childrenDetails}</p>
            )}
          </Card>

          {profile.preferences && (
            <Card>
              <h2 className="font-display text-xl font-semibold">What we&apos;re looking for</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
                {profile.preferences}
              </p>
            </Card>
          )}

          {(profile as { jobEntails?: string | null }).jobEntails && (
            <Card>
              <h2 className="font-display text-xl font-semibold">What the job entails</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
                {(profile as { jobEntails: string }).jobEntails}
              </p>
            </Card>
          )}

          {(profile as { benefits?: string | null }).benefits && (
            <Card>
              <h2 className="font-display text-xl font-semibold">Pay &amp; benefits</h2>
              <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
                {(profile as { benefits: string }).benefits}
              </p>
            </Card>
          )}

          {(() => {
            const p = profile as {
              swapAvailableFrom?: Date | null;
              swapAvailableTo?: Date | null;
              swapSeekingAreas?: string | null;
              swapHomeSummary?: string | null;
              swapSimultaneous?: boolean | null;
              services?: string | null;
            };
            const servicesRaw = p.services || "[]";
            const isSwap =
              servicesRaw.includes("HOUSE_SWAP") ||
              Boolean(p.swapHomeSummary) ||
              Boolean(p.swapAvailableFrom);
            if (!isSwap) return null;
            let seeking: string[] = [];
            try {
              seeking = JSON.parse(p.swapSeekingAreas || "[]");
            } catch {
              seeking = [];
            }
            return (
              <Card className="border-violet-200 bg-violet-50/30">
                <h2 className="font-display text-xl font-semibold text-violet-950">
                  House swap
                </h2>
                <p className="mt-1 text-sm text-violet-900/70">
                  Mutual home exchange — not one-way house sitting.
                </p>
                <div className="mt-4 space-y-2 text-sm text-stone-700">
                  {p.swapAvailableFrom && (
                    <p>
                      <span className="font-medium">Available from:</span>{" "}
                      {format(new Date(p.swapAvailableFrom), "MMM d, yyyy")}
                      {p.swapAvailableTo
                        ? ` → ${format(new Date(p.swapAvailableTo), "MMM d, yyyy")}`
                        : ""}
                    </p>
                  )}
                  {seeking.length > 0 && (
                    <p>
                      <span className="font-medium">Seeking:</span> {seeking.join(", ")}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Style:</span>{" "}
                    {p.swapSimultaneous === false
                      ? "Open to non-simultaneous"
                      : "Prefers simultaneous swap"}
                  </p>
                  {p.swapHomeSummary && (
                    <p className="whitespace-pre-wrap leading-relaxed">{p.swapHomeSummary}</p>
                  )}
                </div>
              </Card>
            );
          })()}

          <Card>
            <h2 className="font-display text-xl font-semibold">Recurring schedule</h2>
            <p className="mt-1 text-sm text-stone-500">
              Typical days and hours the family needs an au pair.
            </p>
            <div className="mt-4">
              <ScheduleDisplay
                scheduleJson={profile.scheduleJson}
                weeklyHoursFallback={profile.weeklyHours}
              />
            </div>
          </Card>

          {(duties.length > 0 || offers.length > 0) && (
            <Card>
              <div className="grid gap-6 sm:grid-cols-2">
                {duties.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900">Duties</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {duties.map((d) => (
                        <Badge key={d}>{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {offers.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-stone-900">We offer</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {offers.map((o) => (
                        <Badge key={o} variant="success">
                          {o}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {photos.length > 0 && (
            <Card>
              <h2 className="font-display text-xl font-semibold">Photos</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photos.map((src) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="aspect-square rounded-xl object-cover"
                  />
                ))}
              </div>
            </Card>
          )}

          <ReviewSection
            targetId={profile.userId}
            targetName={displayName}
            canReview={canReview}
            existing={
              myReview
                ? {
                    rating: myReview.rating,
                    communication: myReview.communication,
                    reliability: myReview.reliability,
                    respect: myReview.respect,
                    recommend: myReview.recommend,
                    comment: myReview.comment,
                  }
                : null
            }
            initialReviews={reviews.map((r) => {
              const pub = isReviewPublic(r);
              const isAuthor = session?.user?.id === r.authorId;
              const isTarget = session?.user?.id === r.targetId;
              const reveal = pub || isAuthor;
              return {
                id: r.id,
                rating: reveal ? r.rating : null,
                communication: reveal ? r.communication : null,
                reliability: reveal ? r.reliability : null,
                respect: reveal ? r.respect : null,
                recommend: reveal ? r.recommend : null,
                comment: reveal ? r.comment : null,
                response: r.response,
                respondedAt: r.respondedAt?.toISOString() ?? null,
                publishedAt: r.publishedAt?.toISOString() ?? null,
                createdAt: r.createdAt.toISOString(),
                isPublic: pub,
                isAuthor,
                isTarget,
                hiddenReason: !reveal && isTarget ? "AWAITING_MUTUAL" : null,
                author: r.author,
              };
            })}
          />
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <div className="space-y-3 text-sm">
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={[
                  profile.addressArea,
                  formatLocation(profile.city, profile.country, profile.region),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
              {profile.continent && (
                <Row
                  label="Continent"
                  value={
                    ({
                      AF: "Africa",
                      AS: "Asia",
                      EU: "Europe",
                      NA: "North America",
                      SA: "South America",
                      OC: "Oceania",
                    } as Record<string, string>)[profile.continent] || profile.continent
                  }
                />
              )}
              {languages.length > 0 && <Row label="Languages at home" value={languages.join(", ")} />}
              {profile.startDate && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="Start date"
                  value={format(new Date(profile.startDate), "MMM d, yyyy")}
                />
              )}
              {(profile as { endDate?: Date | null }).endDate && (
                <Row
                  label="End date"
                  value={format(
                    new Date((profile as { endDate: Date }).endDate),
                    "MMM d, yyyy"
                  )}
                />
              )}
              {profile.durationMonths && (
                <Row label="Duration" value={`${profile.durationMonths} months`} />
              )}
              {profile.weeklyHours && (
                <Row icon={<Clock className="h-4 w-4" />} label="Hours / week" value={`${profile.weeklyHours}h`} />
              )}
              {profile.pocketMoney != null && (
                <Row label="Pay / pocket money" value={`R${profile.pocketMoney}/wk`} />
              )}
              {(profile as { visaSupport?: string | null }).visaSupport && (
                <Row
                  label="Visa / passport"
                  value={
                    (
                      {
                        NONE: "No visa support",
                        HELP: "Help with paperwork",
                        SPONSOR: "Can sponsor / support visa",
                        CITIZEN_ONLY: "Citizens / work rights required",
                      } as Record<string, string>
                    )[(profile as { visaSupport: string }).visaSupport] ||
                    (profile as { visaSupport: string }).visaSupport
                  }
                />
              )}
              <Row label="Arrangement" value={profile.liveIn ? "Live-in" : "Live-out"} />
              <Row
                icon={<BedDouble className="h-4 w-4" />}
                label="Private room"
                value={profile.ownRoom ? "Yes" : "Shared"}
              />
              <Row
                icon={<PawPrint className="h-4 w-4" />}
                label="Pets"
                value={profile.hasPets ? profile.petDetails || "Yes" : "No"}
              />
              <Row
                icon={<Car className="h-4 w-4" />}
                label="Car provided"
                value={profile.carProvided ? "Yes" : "No"}
              />
            </div>

            <div className="mt-6 space-y-3 border-t border-stone-100 pt-5">
              {isOwn ? (
                <Link href="/profile/edit" className="btn-secondary w-full">
                  Edit your listing
                </Link>
              ) : session?.user ? (
                <>
                  {session.user.role === "AUPAIR" && (
                    <InterestButton
                      toUserId={profile.userId}
                      toName={displayName}
                      initialStatus={myInterest?.status}
                    />
                  )}
                  <ContactButton recipientId={profile.userId} recipientName={displayName} />
                  <ShortlistButton targetUserId={profile.userId} />
                  {session.user.role === "AUPAIR" && (
                    <ApplyPacketButton toUserId={profile.userId} />
                  )}
                  <StartPlacementButton otherUserId={profile.userId} />
                </>
              ) : (
                <Link href="/login" className="btn-primary w-full">
                  Log in to connect
                </Link>
              )}
            </div>
            <div className="mt-4 border-t border-stone-100 pt-4">
              <ShareButtons
                url={`/browse/families/${profile.id}`}
                title={`${displayName} on AuPairly`}
                text={`Host listing on AuPairly: ${displayName}. Trusted care marketplace.`}
              />
            </div>
            {session?.user && !isOwn && (
              <div className="mt-4 space-y-2 border-t border-stone-100 pt-4">
                <BlockUserButton userId={profile.userId} name={displayName} />
                <ReportButton targetId={profile.userId} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-stone-500">
        {icon}
        {label}
      </span>
      <span className="text-right font-medium text-stone-800">{value}</span>
    </div>
  );
}
