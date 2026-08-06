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
import { ReviewSection } from "@/components/review-section";
import { ReportButton } from "@/components/report-button";
import { formatLocation, parseJsonArray } from "@/lib/utils";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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
      <Link
        href="/browse/families"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to families
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
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
            existingRating={myReview?.rating}
            initialReviews={reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment,
              createdAt: r.createdAt.toISOString(),
              author: r.author,
            }))}
          />
        </div>

        <div className="space-y-4">
          <Card className="sticky top-24">
            <div className="space-y-3 text-sm">
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Location"
                value={[profile.addressArea, formatLocation(profile.city, profile.country)]
                  .filter(Boolean)
                  .join(" · ")}
              />
              {languages.length > 0 && <Row label="Languages at home" value={languages.join(", ")} />}
              {profile.startDate && (
                <Row
                  icon={<Calendar className="h-4 w-4" />}
                  label="Start date"
                  value={format(new Date(profile.startDate), "MMM d, yyyy")}
                />
              )}
              {profile.durationMonths && (
                <Row label="Duration" value={`${profile.durationMonths} months`} />
              )}
              {profile.weeklyHours && (
                <Row icon={<Clock className="h-4 w-4" />} label="Hours / week" value={`${profile.weeklyHours}h`} />
              )}
              {profile.pocketMoney != null && (
                <Row label="Pocket money" value={`$${profile.pocketMoney}/wk`} />
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
