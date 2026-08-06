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
import { ReviewSection } from "@/components/review-section";
import { ReportButton } from "@/components/report-button";
import { formatLocation, parseJsonArray } from "@/lib/utils";
import { responseTimeLabel } from "@/lib/completeness";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

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

  const languages = parseJsonArray(profile.languages);
  const skills = parseJsonArray(profile.childcareSkills);
  const preferred = parseJsonArray(profile.preferredCountries);
  const photos = parseJsonArray(profile.photos);
  const isOwn = session?.user?.id === profile.userId;

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
      <Link
        href="/browse/aupairs"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to au pairs
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="!p-0 overflow-hidden">
            <div className="h-36 bg-gradient-to-br from-teal-100 via-teal-50 to-orange-50" />
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
                    {replyLabel && (
                      <p className="mt-1 text-xs font-medium text-teal-700">{replyLabel}</p>
                    )}
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
              {profile.bio || "This au pair has not added a bio yet."}
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

          <ReviewSection
            targetId={profile.userId}
            targetName={profile.user.name}
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
              <Row icon={<MapPin className="h-4 w-4" />} label="Location" value={formatLocation(profile.city, profile.country)} />
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
              {profile.weeklyHours && (
                <Row icon={<Clock className="h-4 w-4" />} label="Hours / week" value={`${profile.weeklyHours}h`} />
              )}
              {profile.pocketMoneyMin && (
                <Row label="Pocket money from" value={`$${profile.pocketMoneyMin}/wk`} />
              )}
              <Row label="Live-in" value={profile.liveIn ? "Preferred" : "Live-out OK"} />
              {preferred.length > 0 && (
                <Row label="Preferred countries" value={preferred.join(", ")} />
              )}
            </div>

            <div className="mt-6 space-y-3 border-t border-stone-100 pt-5">
              {isOwn ? (
                <Link href="/profile/edit" className="btn-secondary w-full">
                  Edit your profile
                </Link>
              ) : session?.user ? (
                <>
                  {session.user.role === "PARENT" && (
                    <InterestButton
                      toUserId={profile.userId}
                      toName={profile.user.name}
                      initialStatus={myInterest?.status}
                    />
                  )}
                  <ContactButton recipientId={profile.userId} recipientName={profile.user.name} />
                  <ShortlistButton targetUserId={profile.userId} />
                  <StartPlacementButton otherUserId={profile.userId} />
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
