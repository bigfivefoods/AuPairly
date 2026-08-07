/**
 * GET  — list gallery photos for current user
 * DELETE { url } — remove one gallery photo
 *
 * Adds/updates still go through POST /api/upload (kind=gallery)
 */

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function parsePhotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((u) => typeof u === "string" && u) : [];
  } catch {
    return [];
  }
}

async function resolveRole(userId: string, sessionRole?: string | null) {
  if (sessionRole === "AUPAIR" || sessionRole === "PARENT") return sessionRole;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  return user?.role ?? sessionRole ?? null;
}

async function loadPhotos(userId: string, role: string | null) {
  if (role === "AUPAIR") {
    const p = await prisma.auPairProfile.findUnique({
      where: { userId },
      select: { photos: true, coverImage: true },
    });
    return { photos: parsePhotos(p?.photos), coverImage: p?.coverImage || null };
  }
  if (role === "PARENT") {
    const p = await prisma.familyProfile.findUnique({
      where: { userId },
      select: { photos: true, coverImage: true },
    });
    return { photos: parsePhotos(p?.photos), coverImage: p?.coverImage || null };
  }
  // Role unknown — try both profile tables
  const a = await prisma.auPairProfile.findUnique({
    where: { userId },
    select: { photos: true, coverImage: true },
  });
  if (a) {
    return { photos: parsePhotos(a.photos), coverImage: a.coverImage || null };
  }
  const f = await prisma.familyProfile.findUnique({
    where: { userId },
    select: { photos: true, coverImage: true },
  });
  if (f) {
    return { photos: parsePhotos(f.photos), coverImage: f.coverImage || null };
  }
  return { photos: [] as string[], coverImage: null as string | null };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const role = await resolveRole(session.user.id, session.user.role);
  const data = await loadPhotos(session.user.id, role);
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url = "";
  try {
    const body = await req.json();
    url = String(body.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!url) {
    return NextResponse.json({ error: "url required" }, { status: 400 });
  }

  const userId = session.user.id;
  const role = await resolveRole(userId, session.user.role);

  if (role === "AUPAIR" || !role) {
    const profile = await prisma.auPairProfile.findUnique({ where: { userId } });
    if (profile) {
      const next = parsePhotos(profile.photos).filter((p) => p !== url);
      await prisma.auPairProfile.update({
        where: { id: profile.id },
        data: { photos: JSON.stringify(next) },
      });
      return NextResponse.json({ photos: next });
    }
    if (role === "AUPAIR") {
      return NextResponse.json({ photos: [] });
    }
  }

  if (role === "PARENT" || !role) {
    const profile = await prisma.familyProfile.findUnique({ where: { userId } });
    if (profile) {
      const next = parsePhotos(profile.photos).filter((p) => p !== url);
      await prisma.familyProfile.update({
        where: { id: profile.id },
        data: { photos: JSON.stringify(next) },
      });
      return NextResponse.json({ photos: next });
    }
  }

  return NextResponse.json({ photos: [] });
}
