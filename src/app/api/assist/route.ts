import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { coachProfile, suggestFirstMessage } from "@/lib/ai-assist";
import { parseJsonArray } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { aupairProfile: true, familyProfile: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const profile = user.aupairProfile || user.familyProfile;
  const coach = coachProfile({
    role: user.role,
    bio: profile?.bio,
    headline: profile?.headline,
    city: profile?.city,
    languages: parseJsonArray(profile?.languages),
    experienceYears: user.aupairProfile?.experienceYears,
    childrenCount: user.familyProfile?.childrenCount,
  });

  return NextResponse.json({ coach });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const theirName = String(body.theirName || "there");
  const city = body.city ? String(body.city) : null;
  const sharedLanguages = Array.isArray(body.sharedLanguages)
    ? body.sharedLanguages.map(String)
    : [];

  const message = suggestFirstMessage({
    myRole: session.user.role,
    theirName,
    city,
    sharedLanguages,
  });

  return NextResponse.json({ message });
}
