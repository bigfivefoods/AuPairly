import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toJsonArray } from "@/lib/utils";
import { serializeServices, type ServiceId } from "@/lib/services";
import { syncProfileServiceTags } from "@/lib/service-tags";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.auPairProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, email: true, image: true, phone: true } } },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "AUPAIR") {
    return NextResponse.json({ error: "Only au pairs can update this profile" }, { status: 403 });
  }

  const body = await req.json();

  const profile = await prisma.auPairProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      headline: body.headline,
      bio: body.bio,
      nationality: body.nationality,
      languages: toJsonArray(body.languages ?? []),
      age: body.age ? Number(body.age) : null,
      gender: body.gender,
      experienceYears: Number(body.experienceYears ?? 0),
      childcareSkills: toJsonArray(body.childcareSkills ?? []),
      education: body.education,
      studyStatus: body.studyStatus || null,
      studyingTowards: body.studyingTowards?.trim()
        ? String(body.studyingTowards).slice(0, 200)
        : null,
      qualifications:
        typeof body.qualifications === "string"
          ? body.qualifications
          : Array.isArray(body.qualifications)
            ? JSON.stringify(body.qualifications)
            : "[]",
      drivingLicense: Boolean(body.drivingLicense),
      firstAid: Boolean(body.firstAid),
      swimming: Boolean(body.swimming),
      nonSmoker: body.nonSmoker !== false,
      preferredCountries: toJsonArray(body.preferredCountries ?? []),
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      availableTo: body.availableTo ? new Date(body.availableTo) : null,
      durationMonths: body.durationMonths ? Number(body.durationMonths) : null,
      weeklyHours: body.weeklyHours ? Number(body.weeklyHours) : null,
      pocketMoneyMin: body.pocketMoneyMin ? Number(body.pocketMoneyMin) : null,
      liveIn: body.liveIn !== false,
      city: body.city,
      region: body.region || null,
      country: body.country,
      continent: body.continent || null,
      workRights: body.workRights || null,
      willingRelocate: Boolean(body.willingRelocate),
      relocateCities: toJsonArray(body.relocateCities ?? []),
      certificates: toJsonArray(body.certificates ?? []),
      scheduleJson:
        body.scheduleJson != null
          ? typeof body.scheduleJson === "string"
            ? body.scheduleJson
            : JSON.stringify(body.scheduleJson)
          : null,
      services: Array.isArray(body.services)
        ? serializeServices(body.services as ServiceId[])
        : typeof body.services === "string"
          ? body.services
          : '["CHILDCARE"]',
      petTypes: toJsonArray(body.petTypes ?? []),
      houseSittingNotes: body.houseSittingNotes || null,
      careFocus: toJsonArray(body.careFocus ?? []),
      openToPeerConnect: body.openToPeerConnect !== false,
      peerIntro: body.peerIntro?.trim() ? String(body.peerIntro).slice(0, 280) : null,
      status: body.status === "ACTIVE" ? "ACTIVE" : body.status === "PAUSED" ? "PAUSED" : "DRAFT",
    },
    update: {
      headline: body.headline,
      bio: body.bio,
      nationality: body.nationality,
      languages: body.languages ? toJsonArray(body.languages) : undefined,
      age: body.age !== undefined ? (body.age ? Number(body.age) : null) : undefined,
      gender: body.gender,
      experienceYears: body.experienceYears !== undefined ? Number(body.experienceYears) : undefined,
      childcareSkills: body.childcareSkills ? toJsonArray(body.childcareSkills) : undefined,
      education: body.education,
      studyStatus:
        body.studyStatus !== undefined ? body.studyStatus || null : undefined,
      studyingTowards:
        body.studyingTowards !== undefined
          ? body.studyingTowards?.trim()
            ? String(body.studyingTowards).slice(0, 200)
            : null
          : undefined,
      qualifications:
        body.qualifications !== undefined
          ? typeof body.qualifications === "string"
            ? body.qualifications
            : Array.isArray(body.qualifications)
              ? JSON.stringify(body.qualifications)
              : "[]"
          : undefined,
      drivingLicense: body.drivingLicense !== undefined ? Boolean(body.drivingLicense) : undefined,
      firstAid: body.firstAid !== undefined ? Boolean(body.firstAid) : undefined,
      swimming: body.swimming !== undefined ? Boolean(body.swimming) : undefined,
      nonSmoker: body.nonSmoker !== undefined ? Boolean(body.nonSmoker) : undefined,
      preferredCountries: body.preferredCountries ? toJsonArray(body.preferredCountries) : undefined,
      availableFrom: body.availableFrom !== undefined ? (body.availableFrom ? new Date(body.availableFrom) : null) : undefined,
      availableTo:
        body.availableTo !== undefined
          ? body.availableTo
            ? new Date(body.availableTo)
            : null
          : undefined,
      durationMonths: body.durationMonths !== undefined ? (body.durationMonths ? Number(body.durationMonths) : null) : undefined,
      weeklyHours: body.weeklyHours !== undefined ? (body.weeklyHours ? Number(body.weeklyHours) : null) : undefined,
      pocketMoneyMin: body.pocketMoneyMin !== undefined ? (body.pocketMoneyMin ? Number(body.pocketMoneyMin) : null) : undefined,
      liveIn: body.liveIn !== undefined ? Boolean(body.liveIn) : undefined,
      city: body.city,
      region: body.region !== undefined ? body.region || null : undefined,
      country: body.country,
      continent: body.continent !== undefined ? body.continent || null : undefined,
      workRights: body.workRights !== undefined ? body.workRights || null : undefined,
      willingRelocate:
        body.willingRelocate !== undefined ? Boolean(body.willingRelocate) : undefined,
      relocateCities: body.relocateCities ? toJsonArray(body.relocateCities) : undefined,
      certificates: body.certificates ? toJsonArray(body.certificates) : undefined,
      scheduleJson:
        body.scheduleJson !== undefined
          ? body.scheduleJson == null
            ? null
            : typeof body.scheduleJson === "string"
              ? body.scheduleJson
              : JSON.stringify(body.scheduleJson)
          : undefined,
      services:
        body.services !== undefined
          ? Array.isArray(body.services)
            ? serializeServices(body.services as ServiceId[])
            : String(body.services)
          : undefined,
      petTypes: body.petTypes ? toJsonArray(body.petTypes) : undefined,
      houseSittingNotes:
        body.houseSittingNotes !== undefined ? body.houseSittingNotes || null : undefined,
      careFocus: body.careFocus ? toJsonArray(body.careFocus) : undefined,
      openToPeerConnect:
        body.openToPeerConnect !== undefined
          ? Boolean(body.openToPeerConnect)
          : undefined,
      peerIntro:
        body.peerIntro !== undefined
          ? body.peerIntro?.trim()
            ? String(body.peerIntro).slice(0, 280)
            : null
          : undefined,
      status: body.status,
    },
  });

  await syncProfileServiceTags({
    profileRole: "AUPAIR",
    profileId: profile.id,
    servicesJson: profile.services,
  });

  if (body.phone !== undefined || body.name) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(body.name ? { name: body.name } : {}),
        ...(body.phone !== undefined ? { phone: body.phone } : {}),
      },
    });
  }

  // When listing goes live, notify city waitlist (best-effort)
  if (profile.status === "ACTIVE" && profile.city) {
    void import("@/lib/waitlist-notify")
      .then(({ notifyWaitlistForCity }) =>
        notifyWaitlistForCity({
          city: profile.city!,
          rolePublished: "AUPAIR",
        })
      )
      .catch((e) => console.error("[waitlist-notify aupair]", e));
    void import("@/lib/city-liquidity")
      .then(({ notifyCityOfNewListing }) =>
        notifyCityOfNewListing({
          city: profile.city!,
          country: profile.country,
          rolePublished: "AUPAIR",
          publisherUserId: session.user!.id,
          publisherName: session.user!.name || "A sitter",
        })
      )
      .catch((e) => console.error("[city-liquidity aupair]", e));
    void import("@/lib/funnel").then(({ trackFunnel }) =>
      trackFunnel("publish_listing", { role: "AUPAIR", city: profile.city })
    );
  }

  return NextResponse.json({ profile });
}
