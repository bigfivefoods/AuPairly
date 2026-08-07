import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  Languages,
  Car,
  HeartPulse,
  Waves,
  CigaretteOff,
  GraduationCap,
  Calendar,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Avatar, Badge, Card, Stars, VerifiedBadge } from "@/components/ui";
import { ContactButton } from "@/components/contact-button";
import { InterestButton } from "@/components/interest-button";
import { StartPlacementButton } from "@/components/start-placement-button";
import { ShortlistButton } from "@/components/shortlist-button";
import { PeerConnectButton } from "@/components/peer-connect-button";
import { ReviewSection } from "@/components/review-section";
import { ReportButton } from "@/components/report-button";
import { JsonLd } from "@/components/json-ld";
import { formatLocation, parseJsonArray } from "@/lib/utils";
import { responseTimeLabel } from "@/lib/completeness";
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
  const profile = await prisma.auPairProfile.findUnique({
    where: { id },
    select: {
      status: true,
      headline: true,
      bio: true,
      city: true,
      country: true,
      isVerified: true,
      coverImage: true,
      user: { select: { name: true, image: true } },
    },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return buildPageMetadata({
      title: "Sitter profile",
      description: "View sitter profiles on AuPairly.",
      path: `/browse/aupairs/${id}`,
      noIndex: true,
    });
  }
  const name = profile.user.name || "Sitter";
  const place = [profile.city, profile.country].filter(Boolean).join(", ");
  const title = `${name}${place ? ` in ${place}` : ""} — sitter profile`;
  const description = (
    profile.headline ||
    profile.bio ||
    `${name} offers care on AuPairly${place ? ` in ${place}` : ""}.`
  ).slice(0, 300);
  return buildPageMetadata({
    title,
    description,
    path: `/browse/aupairs/${id}`,
    image: profile.coverImage || profile.user.image || undefined,
    type: "profile",
    keywords: [
      "au pair profile",
      place,
      profile.isVerified ? "verified sitter" : "sitter",
    ].filter(Boolean) as string[],
  });
}

export default async function AuPairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const profile = await prisma.auPairProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          avgResponseMinutes: true,
          safetyScore: true,
          videoIntroUrl: true,
        },
      },
    },
  });

  if (!profile || (profile.status !== "ACTIVE" && profile.userId !== session?.user?.id)) {
    notFound();
  }

  const jsonLd =
    profile.status === "ACTIVE"
      ? [
          personProfileJsonLd({
            name: profile.user.name || "Sitter",
            description: profile.headline || profile.bio || undefined,
            path: `/browse/aupairs/${id}`,
            image: profile.user.image || profile.coverImage,
            jobTitle: "Care provider",
            city: profile.city,
            country: profile.country,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Sitters", path: "/browse/aupairs" },
            {
              name: profile.user.name || "Profile",
              path: `/browse/aupairs/${id}`,
            },
          ]),
        ]
      : null;

  const languages = parseJsonArray(profile.languages);
  const skills = parseJsonArray(profile.childcareSkills);
  const preferred = parseJsonArray(profile.preferredCountries);
  const workPlaces = parseJsonArray(profile.relocateCities);
  const photos = parseJsonArray(profile.photos);
  const isOwn = session?.user?.id === profile.userId;

  const isPeerViewer = session?.user?.role === "AUPAIR" && !isOwn;

  const [reviews, conversation, myReview, myInterest, myPeerConnect] =
    await Promise.all([
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
      isPeerViewer
        ? prisma.peerConnect.findFirst({
            where: {
              OR: [
                {
                  fromUserId: session!.user!.id,
                  toUserId: profile.userId,
                },
                {
                  fromUserId: profile.userId,
                  toUserId: session!.user!.id,
                },
              ],
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

  const freeSlots = await prisma.availabilitySlot.findMany({
    where: {
      userId: profile.userId,
      kind: "FREE",
      endDate: { gte: new Date() },
    },
    orderBy: { startDate: "asc" },
    take: 12,
  });

  // Boost analytics: count views while featured
  if (
    !isOwn &&
    profile.boostedUntil &&
    profile.boostedUntil.getTime() > Date.now()
  ) {
    void prisma.auPairProfile
      .update({
        where: { id: profile.id },
        data: { boostViews: { increment: 1 } },
      })
      .catch(() => {});
    void prisma.boostEvent
      .updateMany({
        where: { userId: profile.userId, endsAt: { gt: new Date() } },
        data: { views: { increment: 1 } },
      })
      .catch(() => {});
  }

  const replyLabel = responseTimeLabel(profile.user.avgResponseMinutes);
  const certs = parseJsonArray(profile.certificates);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <Link
        href="/browse/aupairs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to sitters
      </Link>

      <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="!p-0 overflow-hidden">
            <div className="relative h-36 bg-gradient-to-br from-teal-100 via-teal-50 to-orange-50">
              {(profile.coverImage || photos[0]) && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.coverImage || photos[0]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
            </div>
            <div className="relative px-6 pb-6">
              <div className="-mt-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <Avatar
                    name={profile.user.name}
                    image={profile.user.image}
                    size="xl"
                    className="!ring-4 !ring-white shadow-lg"
                  />
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
                        {profile.user.name}
                      </h1>
                      {profile.isVerified && <VerifiedBadge />}
                    </div>
                    <p className="mt-1 text-stone-500">{profile.headline}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {profile.isVerified && (
                        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                          Verified
                        </span>
                      )}
                      {replyLabel && (
                        <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                          {replyLabel}
                        </span>
                      )}
                      {typeof profile.user.safetyScore === "number" &&
                        profile.user.safetyScore >= 60 && (
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-semibold text-stone-700">
                            Safety {profile.user.safetyScore}
                          </span>
                        )}
                      {profile.rating > 0 && (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                          {profile.rating.toFixed(1)} · {profile.reviewCount} reviews
                        </span>
                      )}
                    </div>
                    {profile.workRights && (
                      <p className="mt-1 text-xs text-stone-500">
                        Work rights: {profile.workRights}
                        {profile.willingRelocate ? " · Open to relocate" : ""}
                      </p>
                    )}
                    {certs.length > 0 && (
                      <p className="mt-1 text-xs text-stone-500">
                        Certs: {certs.join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                {profile.rating > 0 && (
                  <Stars rating={profile.rating} count={profile.reviewCount} />
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="font-display text-xl font-semibold">About</h2>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-stone-600">
              {profile.bio || "This sitter has not added a bio yet."}
            </p>
          </Card>

          {skills.length > 0 && (
            <Card>
              <h2 className="font-display text-xl font-semibold">Childcare skills</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
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

          <Card>
            <h2 className="font-display text-xl font-semibold">Weekly availability</h2>
            <p className="mt-1 text-sm text-stone-500">
              Typical days and times this au pair is free to work.
            </p>
            <div className="mt-4">
              <ScheduleDisplay
                scheduleJson={profile.scheduleJson}
                weeklyHoursFallback={profile.weeklyHours}
              />
            </div>
            {freeSlots.length > 0 && (
              <div className="mt-6 border-t border-stone-100 pt-4">
                <h3 className="text-sm font-semibold text-stone-800">Upcoming free windows</h3>
                <ul className="mt-2 space-y-1.5 text-sm text-stone-600">
                  {freeSlots.map((s) => (
                    <li
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-teal-50/80 px-3 py-2"
                    >
                      <span>
                        {format(new Date(s.startDate), "MMM d, yyyy · HH:mm")}
                        {" → "}
                        {format(new Date(s.endDate), "MMM d · HH:mm")}
                      </span>
                      {s.note && (
                        <span className="text-xs text-stone-500">{s.note}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <ReviewSection
            targetId={profile.userId}
            targetName={profile.user.name}
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

          <Card>
            <h2 className="font-display text-xl font-semibold">Qualifications</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Qual icon={<Languages className="h-4 w-4" />} label="Languages" value={languages.join(", ") || "—"} />
              <Qual icon={<GraduationCap className="h-4 w-4" />} label="Education" value={profile.education || "—"} />
              <Qual icon={<Car className="h-4 w-4" />} label="Driving license" value={profile.drivingLicense ? "Yes" : "No"} />
              <Qual icon={<HeartPulse className="h-4 w-4" />} label="First aid" value={profile.firstAid ? "Yes" : "No"} />
              <Qual icon={<Waves className="h-4 w-4" />} label="Swimming" value={profile.swimming ? "Yes" : "No"} />
              <Qual icon={<CigaretteOff className="h-4 w-4" />} label="Non-smoker" value={profile.nonSmoker ? "Yes" : "No"} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <div className="space-y-3 text-sm">
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Based now"
                value={formatLocation(profile.city, profile.country, profile.region)}
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
              {(preferred.length > 0 || workPlaces.length > 0 || profile.willingRelocate) && (
                <div className="rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                    Open to work in
                  </p>
                  {profile.willingRelocate && (
                    <p className="mt-1 text-xs font-medium text-teal-700">
                      Willing to relocate for the right placement
                    </p>
                  )}
                  {preferred.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {preferred.map((c) => (
                        <Badge key={c}>{c}</Badge>
                      ))}
                    </div>
                  )}
                  {workPlaces.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-stone-700">
                      {workPlaces.map((p) => (
                        <li key={p} className="flex items-start gap-1.5">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {profile.nationality && <Row label="Nationality" value={profile.nationality} />}
              {profile.age && <Row label="Age" value={`${profile.age}`} />}
              <Row label="Experience" value={`${profile.experienceYears}+ years`} />
              {profile.availableFrom && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="Available from"
                  value={format(new Date(profile.availableFrom), "MMM d, yyyy")}
                />
              )}
              {profile.availableTo && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="Available until"
                  value={format(new Date(profile.availableTo), "MMM d, yyyy")}
                />
              )}
              {profile.weeklyHours && (
                <Row icon={<Clock className="h-4 w-4" />} label="Hours / week" value={`${profile.weeklyHours}h`} />
              )}
              {profile.pocketMoneyMin && (
                <Row label="Pocket money from" value={`R${profile.pocketMoneyMin}/wk`} />
              )}
              <Row label="Live-in" value={profile.liveIn ? "Preferred" : "Live-out OK"} />
            </div>

            <div className="mt-6 space-y-3 border-t border-stone-100 pt-5">
              {isOwn ? (
                <Link href="/profile/edit" className="btn-secondary w-full">
                  Edit your profile
                </Link>
              ) : session?.user ? (
                <>
                  {isPeerViewer && profile.openToPeerConnect ? (
                    <>
                      <PeerConnectButton
                        toUserId={profile.userId}
                        toName={profile.user.name}
                        initialStatus={
                          (myPeerConnect?.status as
                            | "PENDING"
                            | "ACCEPTED"
                            | "DECLINED"
                            | "WITHDRAWN"
                            | undefined) || "NONE"
                        }
                        conversationId={conversation?.id}
                      />
                      {profile.peerIntro && (
                        <p className="rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">
                          <span className="font-semibold">Looking for friends: </span>
                          {profile.peerIntro}
                        </p>
                      )}
                      <Link
                        href="/community"
                        className="block text-center text-sm font-medium text-teal-700 hover:underline"
                      >
                        Browse AuPair Connect nearby
                      </Link>
                    </>
                  ) : (
                    <>
                      {session.user.role === "PARENT" && (
                        <InterestButton
                          toUserId={profile.userId}
                          toName={profile.user.name}
                          initialStatus={myInterest?.status}
                        />
                      )}
                      <ContactButton
                        recipientId={profile.userId}
                        recipientName={profile.user.name}
                      />
                      <ShortlistButton targetUserId={profile.userId} />
                      {session.user.role === "PARENT" && (
                        <StartPlacementButton otherUserId={profile.userId} />
                      )}
                    </>
                  )}
                </>
              ) : (
                <Link href="/login" className="btn-primary w-full">
                  Log in to connect
                </Link>
              )}
            </div>
            {session?.user && !isOwn && (
              <div className="mt-4 border-t border-stone-100 pt-4">
                <ReportButton targetId={profile.userId} />
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Qual({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-stone-50 px-3 py-2.5">
      <span className="mt-0.5 text-teal-600">{icon}</span>
      <div>
        <p className="text-xs font-medium text-stone-500">{label}</p>
        <p className="text-sm font-medium text-stone-800">{value}</p>
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
