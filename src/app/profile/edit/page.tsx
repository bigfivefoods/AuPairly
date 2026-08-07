import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AuPairProfileForm } from "@/components/forms/aupair-form";
import { FamilyProfileForm } from "@/components/forms/family-form";
import { parseJsonArray } from "@/lib/utils";
import { parseServices } from "@/lib/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile" };

/**
 * Full-viewport profile editor (same shell pattern as /onboarding).
 */
export default async function EditProfilePage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "AUPAIR") {
    const [profile, documentCount, referenceCount, me] = await Promise.all([
      prisma.auPairProfile.findUnique({
        where: { userId: user.id },
        include: { user: true },
      }),
      prisma.secureDocument.count({ where: { userId: user.id } }),
      prisma.referenceRequest.count({
        where: { subjectId: user.id, status: "SUBMITTED" },
      }),
      prisma.user.findUnique({
        where: { id: user.id },
        select: { videoIntroUrl: true },
      }),
    ]);

    const initial = {
      name: user.name,
      phone: profile?.user.phone ?? "",
      image: profile?.user.image ?? user.image ?? null,
      headline: profile?.headline ?? "",
      bio: profile?.bio ?? "",
      nationality: profile?.nationality ?? "",
      languages: parseJsonArray(profile?.languages),
      age: profile?.age?.toString() ?? "",
      gender: profile?.gender ?? "",
      experienceYears: profile?.experienceYears?.toString() ?? "0",
      childcareSkills: parseJsonArray(profile?.childcareSkills),
      education: profile?.education ?? "",
      drivingLicense: profile?.drivingLicense ?? false,
      firstAid: profile?.firstAid ?? false,
      swimming: profile?.swimming ?? false,
      nonSmoker: profile?.nonSmoker ?? true,
      preferredCountries: parseJsonArray(profile?.preferredCountries),
      availableFrom: profile?.availableFrom
        ? new Date(profile.availableFrom).toISOString().slice(0, 10)
        : "",
      availableTo: profile?.availableTo
        ? new Date(profile.availableTo).toISOString().slice(0, 10)
        : "",
      durationMonths: profile?.durationMonths?.toString() ?? "",
      weeklyHours: profile?.weeklyHours?.toString() ?? "",
      pocketMoneyMin: profile?.pocketMoneyMin?.toString() ?? "",
      liveIn: profile?.liveIn ?? true,
      city: profile?.city ?? "",
      region: profile?.region ?? "",
      country: profile?.country ?? "",
      continent: profile?.continent ?? "",
      workRights: profile?.workRights ?? "",
      willingRelocate: profile?.willingRelocate ?? false,
      relocateCities: parseJsonArray(profile?.relocateCities),
      certificates: parseJsonArray(profile?.certificates),
      scheduleJson: profile?.scheduleJson ?? null,
      services: parseServices(profile?.services),
      petTypes: parseJsonArray(profile?.petTypes),
      houseSittingNotes: profile?.houseSittingNotes ?? "",
      openToPeerConnect: profile?.openToPeerConnect ?? true,
      peerIntro: profile?.peerIntro ?? "",
      photos: parseJsonArray(profile?.photos),
      coverImage: profile?.coverImage ?? null,
      status: (profile?.status as "DRAFT" | "ACTIVE" | "PAUSED") ?? "DRAFT",
      isVerified: Boolean(profile?.isVerified),
      documentCount,
      referenceCount,
      videoIntroUrl: me?.videoIntroUrl ?? null,
    };

    return (
      <AuPairProfileForm initial={initial} fullscreen userName={user.name} />
    );
  }

  const [profile, documentCount, referenceCount, me] = await Promise.all([
    prisma.familyProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    }),
    prisma.secureDocument.count({ where: { userId: user.id } }),
    prisma.referenceRequest.count({
      where: { subjectId: user.id, status: "SUBMITTED" },
    }),
    prisma.user.findUnique({
      where: { id: user.id },
      select: { videoIntroUrl: true },
    }),
  ]);

  const initial = {
    name: user.name,
    phone: profile?.user.phone ?? "",
    image: profile?.user.image ?? user.image ?? null,
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    familyName: profile?.familyName ?? "",
    city: profile?.city ?? "",
    region: profile?.region ?? "",
    country: profile?.country ?? "",
    continent: profile?.continent ?? "",
    addressArea: profile?.addressArea ?? "",
    preferredAreas: parseJsonArray(
      (profile as { preferredAreas?: string | null } | null)?.preferredAreas
    ).join(", "),
    isUrgent: Boolean((profile as { isUrgent?: boolean } | null)?.isUrgent),
    childrenCount: profile?.childrenCount?.toString() ?? "1",
    childrenAges: parseJsonArray(profile?.childrenAges),
    childrenDetails: profile?.childrenDetails ?? "",
    languages: parseJsonArray(profile?.languages),
    preferences: profile?.preferences ?? "",
    duties: parseJsonArray(profile?.duties),
    offers: parseJsonArray(profile?.offers),
    startDate: profile?.startDate
      ? new Date(profile.startDate).toISOString().slice(0, 10)
      : "",
    durationMonths: profile?.durationMonths?.toString() ?? "",
    weeklyHours: profile?.weeklyHours?.toString() ?? "",
    pocketMoney: profile?.pocketMoney?.toString() ?? "",
    liveIn: profile?.liveIn ?? true,
    hasPets: profile?.hasPets ?? false,
    petDetails: profile?.petDetails ?? "",
    ownRoom: profile?.ownRoom ?? true,
    carProvided: profile?.carProvided ?? false,
    schoolArea: profile?.schoolArea ?? "",
    drivingRequired: profile?.drivingRequired ?? false,
    lifestyleNotes: profile?.lifestyleNotes ?? "",
    scheduleJson: profile?.scheduleJson ?? null,
    services: parseServices(profile?.services),
    petTypes: parseJsonArray(profile?.petTypes),
    houseSittingNotes: profile?.houseSittingNotes ?? "",
    photos: parseJsonArray(profile?.photos),
    coverImage: profile?.coverImage ?? null,
    status: (profile?.status as "DRAFT" | "ACTIVE" | "PAUSED") ?? "DRAFT",
    isVerified: Boolean(profile?.isVerified),
    documentCount,
    referenceCount,
    videoIntroUrl: me?.videoIntroUrl ?? null,
  };

  return <FamilyProfileForm initial={initial} fullscreen userName={user.name} />;
}
