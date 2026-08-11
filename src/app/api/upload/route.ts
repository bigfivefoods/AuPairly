import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageUpload } from "@/lib/uploads";
import { rateLimit, clientIp } from "@/lib/rate-limit";

function parsePhotos(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string" && !!u) : [];
  } catch {
    return [];
  }
}

function appendPhoto(existing: string | null | undefined, url: string): string[] {
  const photos = parsePhotos(existing);
  if (!photos.includes(url)) {
    return [...photos, url].slice(-12);
  }
  return photos.slice(-12);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`upload:${session.user.id}:${clientIp(req)}`, {
    limit: 20,
    windowMs: 60_000,
  });
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many uploads. Retry in ${rl.retryAfterSec}s.` },
      { status: 429 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    const kind = (form.get("kind") as string) || "avatar";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required" }, { status: 400 });
    }

    const uploadKind =
      kind === "cover"
        ? "cover"
        : kind === "document"
          ? "document"
          : kind === "gallery"
            ? "gallery"
            : kind === "video"
              ? "video"
              : "avatar";

    const result = await saveImageUpload(file, session.user.id, uploadKind);

    // Always prefer DB role so JWT lag cannot drop gallery saves
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    const role = dbUser?.role || session.user.role;

    if (uploadKind === "avatar") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: result.url },
      });
    } else if (uploadKind === "cover" || uploadKind === "gallery") {
      if (role === "AUPAIR") {
        if (uploadKind === "cover") {
          await prisma.auPairProfile.upsert({
            where: { userId: session.user.id },
            create: {
              userId: session.user.id,
              coverImage: result.url,
              status: "DRAFT",
              services: '["CHILDCARE"]',
            },
            update: { coverImage: result.url },
          });
        } else {
          const existing = await prisma.auPairProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true, photos: true },
          });
          const photos = appendPhoto(existing?.photos, result.url);
          if (existing) {
            await prisma.auPairProfile.update({
              where: { id: existing.id },
              data: { photos: JSON.stringify(photos) },
            });
          } else {
            await prisma.auPairProfile.create({
              data: {
                userId: session.user.id,
                photos: JSON.stringify(photos),
                status: "DRAFT",
                services: '["CHILDCARE"]',
              },
            });
          }
        }
      } else if (role === "PARENT") {
        if (uploadKind === "cover") {
          await prisma.familyProfile.upsert({
            where: { userId: session.user.id },
            create: {
              userId: session.user.id,
              coverImage: result.url,
              status: "DRAFT",
              services: '["CHILDCARE"]',
            },
            update: { coverImage: result.url },
          });
        } else {
          const existing = await prisma.familyProfile.findUnique({
            where: { userId: session.user.id },
            select: { id: true, photos: true },
          });
          const photos = appendPhoto(existing?.photos, result.url);
          if (existing) {
            await prisma.familyProfile.update({
              where: { id: existing.id },
              data: { photos: JSON.stringify(photos) },
            });
          } else {
            await prisma.familyProfile.create({
              data: {
                userId: session.user.id,
                photos: JSON.stringify(photos),
                status: "DRAFT",
                services: '["CHILDCARE"]',
              },
            });
          }
        }
      }
    }

    // Return full gallery after gallery upload so clients can rehydrate
    let photosOut: string[] | undefined;
    if (uploadKind === "gallery") {
      if (role === "AUPAIR") {
        const p = await prisma.auPairProfile.findUnique({
          where: { userId: session.user.id },
          select: { photos: true },
        });
        photosOut = parsePhotos(p?.photos);
        if (photosOut.length === 0) photosOut = [result.url];
      } else if (role === "PARENT") {
        const p = await prisma.familyProfile.findUnique({
          where: { userId: session.user.id },
          select: { photos: true },
        });
        photosOut = parsePhotos(p?.photos);
        if (photosOut.length === 0) photosOut = [result.url];
      } else {
        photosOut = [result.url];
      }
    }

    return NextResponse.json({
      url: result.url,
      mime: result.mime,
      size: result.size,
      path: result.path,
      ...(photosOut ? { photos: photosOut } : {}),
      saved: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
