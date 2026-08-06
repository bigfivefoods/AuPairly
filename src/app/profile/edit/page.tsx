import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { AuPairProfileForm } from "@/components/forms/aupair-form";
import { FamilyProfileForm } from "@/components/forms/family-form";
import { PageHeader } from "@/components/ui";
import { parseJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit profile" };

export default async function EditProfilePage() {
  const user = await requireUser();

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  if (user.role === "AUPAIR") {
    const profile = await prisma.auPairProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });

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
      durationMonths: profile?.durationMonths?.toString() ?? "",
      weeklyHours: profile?.weeklyHours?.toString() ?? "",
      pocketMoneyMin: profile?.pocketMoneyMin?.toString() ?? "",
      liveIn: profile?.liveIn ?? true,
      city: profile?.city ?? "",
      country: profile?.country ?? "",
      workRights: profile?.workRights ?? "",
      willingRelocate: profile?.willingRelocate ?? false,
      relocateCities: parseJsonArray(profile?.relocateCities),
      certificates: parseJsonArray(profile?.certificates),
      status: (profile?.status as "DRAFT" | "ACTIVE" | "PAUSED") ?? "DRAFT",
    };

    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <PageHeader
          eyebrow="Profile"
          title="Edit au pair profile"
          description="A complete, honest profile attracts the right families."
        />
        <AuPairProfileForm initial={initial} />
      </div>
    );
  }

  const profile = await prisma.familyProfile.findUnique({
    where: { userId: user.id },
    include: { user: true },
  });

  const initial = {
    name: user.name,
    phone: profile?.user.phone ?? "",
    image: profile?.user.image ?? user.image ?? null,
    headline: profile?.headline ?? "",
    bio: profile?.bio ?? "",
    familyName: profile?.familyName ?? "",
    city: profile?.city ?? "",
    country: profile?.country ?? "",
    addressArea: profile?.addressArea ?? "",
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
    status: (profile?.status as "DRAFT" | "ACTIVE" | "PAUSED") ?? "DRAFT",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Listing"
        title="Edit family listing"
        description="Share what makes your home special and what you need from an au pair."
      />
      <FamilyProfileForm initial={initial} />
    </div>
  );
}
