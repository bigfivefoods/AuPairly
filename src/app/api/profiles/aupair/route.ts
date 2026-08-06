import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toJsonArray } from "@/lib/utils";

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
      drivingLicense: Boolean(body.drivingLicense),
      firstAid: Boolean(body.firstAid),
      swimming: Boolean(body.swimming),
      nonSmoker: body.nonSmoker !== false,
      preferredCountries: toJsonArray(body.preferredCountries ?? []),
      availableFrom: body.availableFrom ? new Date(body.availableFrom) : null,
      durationMonths: body.durationMonths ? Number(body.durationMonths) : null,
      weeklyHours: body.weeklyHours ? Number(body.weeklyHours) : null,
      pocketMoneyMin: body.pocketMoneyMin ? Number(body.pocketMoneyMin) : null,
      liveIn: body.liveIn !== false,
      city: body.city,
      country: body.country,
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
      drivingLicense: body.drivingLicense !== undefined ? Boolean(body.drivingLicense) : undefined,
      firstAid: body.firstAid !== undefined ? Boolean(body.firstAid) : undefined,
      swimming: body.swimming !== undefined ? Boolean(body.swimming) : undefined,
      nonSmoker: body.nonSmoker !== undefined ? Boolean(body.nonSmoker) : undefined,
      preferredCountries: body.preferredCountries ? toJsonArray(body.preferredCountries) : undefined,
      availableFrom: body.availableFrom !== undefined ? (body.availableFrom ? new Date(body.availableFrom) : null) : undefined,
      durationMonths: body.durationMonths !== undefined ? (body.durationMonths ? Number(body.durationMonths) : null) : undefined,
      weeklyHours: body.weeklyHours !== undefined ? (body.weeklyHours ? Number(body.weeklyHours) : null) : undefined,
      pocketMoneyMin: body.pocketMoneyMin !== undefined ? (body.pocketMoneyMin ? Number(body.pocketMoneyMin) : null) : undefined,
      liveIn: body.liveIn !== undefined ? Boolean(body.liveIn) : undefined,
      city: body.city,
      country: body.country,
      status: body.status,
    },
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
