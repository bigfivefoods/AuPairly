import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toJsonArray } from "@/lib/utils";
import { serializeServices, type ServiceId } from "@/lib/services";
import { syncProfileServiceTags } from "@/lib/service-tags";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.familyProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true, email: true, image: true, phone: true } } },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Only parents can update this profile" }, { status: 403 });
  }

  const body = await req.json();

  const profile = await prisma.familyProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      headline: body.headline,
      bio: body.bio,
      familyName: body.familyName,
      city: body.city,
      region: body.region || null,
      country: body.country,
      continent: body.continent || null,
      addressArea: body.addressArea,
      childrenCount: Number(body.childrenCount ?? 1),
      childrenAges: toJsonArray((body.childrenAges ?? []).map(String)),
      childrenDetails: body.childrenDetails,
      languages: toJsonArray(body.languages ?? []),
      preferences: body.preferences,
      duties: toJsonArray(body.duties ?? []),
      offers: toJsonArray(body.offers ?? []),
      startDate: body.startDate ? new Date(body.startDate) : null,
      durationMonths: body.durationMonths ? Number(body.durationMonths) : null,
      weeklyHours: body.weeklyHours ? Number(body.weeklyHours) : null,
      pocketMoney: body.pocketMoney ? Number(body.pocketMoney) : null,
      liveIn: body.liveIn !== false,
      hasPets: Boolean(body.hasPets),
      petDetails: body.petDetails,
      ownRoom: body.ownRoom !== false,
      carProvided: Boolean(body.carProvided),
      schoolArea: body.schoolArea || null,
      drivingRequired: Boolean(body.drivingRequired),
      lifestyleNotes: body.lifestyleNotes || null,
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
      preferredAreas: Array.isArray(body.preferredAreas)
        ? toJsonArray(body.preferredAreas)
        : typeof body.preferredAreas === "string"
          ? toJsonArray(
              body.preferredAreas
                .split(",")
                .map((s: string) => s.trim())
                .filter(Boolean)
            )
          : "[]",
      isUrgent: Boolean(body.isUrgent),
      urgentUntil: body.isUrgent
        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        : null,
      status: body.status === "ACTIVE" ? "ACTIVE" : body.status === "PAUSED" ? "PAUSED" : "DRAFT",
    },
    update: {
      headline: body.headline,
      bio: body.bio,
      familyName: body.familyName,
      city: body.city,
      region: body.region !== undefined ? body.region || null : undefined,
      country: body.country,
      continent: body.continent !== undefined ? body.continent || null : undefined,
      addressArea: body.addressArea,
      childrenCount: body.childrenCount !== undefined ? Number(body.childrenCount) : undefined,
      childrenAges: body.childrenAges ? toJsonArray(body.childrenAges.map(String)) : undefined,
      childrenDetails: body.childrenDetails,
      languages: body.languages ? toJsonArray(body.languages) : undefined,
      preferences: body.preferences,
      duties: body.duties ? toJsonArray(body.duties) : undefined,
      offers: body.offers ? toJsonArray(body.offers) : undefined,
      startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
      durationMonths: body.durationMonths !== undefined ? (body.durationMonths ? Number(body.durationMonths) : null) : undefined,
      weeklyHours: body.weeklyHours !== undefined ? (body.weeklyHours ? Number(body.weeklyHours) : null) : undefined,
      pocketMoney: body.pocketMoney !== undefined ? (body.pocketMoney ? Number(body.pocketMoney) : null) : undefined,
      liveIn: body.liveIn !== undefined ? Boolean(body.liveIn) : undefined,
      hasPets: body.hasPets !== undefined ? Boolean(body.hasPets) : undefined,
      petDetails: body.petDetails,
      ownRoom: body.ownRoom !== undefined ? Boolean(body.ownRoom) : undefined,
      carProvided: body.carProvided !== undefined ? Boolean(body.carProvided) : undefined,
      schoolArea: body.schoolArea !== undefined ? body.schoolArea || null : undefined,
      drivingRequired:
        body.drivingRequired !== undefined ? Boolean(body.drivingRequired) : undefined,
      lifestyleNotes:
        body.lifestyleNotes !== undefined ? body.lifestyleNotes || null : undefined,
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
      preferredAreas:
        body.preferredAreas !== undefined
          ? Array.isArray(body.preferredAreas)
            ? toJsonArray(body.preferredAreas)
            : typeof body.preferredAreas === "string"
              ? toJsonArray(
                  body.preferredAreas
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                )
              : "[]"
          : undefined,
      isUrgent: body.isUrgent !== undefined ? Boolean(body.isUrgent) : undefined,
      urgentUntil:
        body.isUrgent !== undefined
          ? body.isUrgent
            ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
            : null
          : undefined,
      status: body.status,
    },
  });

  await syncProfileServiceTags({
    profileRole: "FAMILY",
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

  return NextResponse.json({ profile });
}
