import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveImageUpload } from "@/lib/uploads";
import { rateLimit, clientIp } from "@/lib/rate-limit";

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
      kind === "cover" ? "cover" : kind === "document" ? "document" : "avatar";

    const result = await saveImageUpload(file, session.user.id, uploadKind);

    if (uploadKind === "avatar") {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: result.url },
      });
    } else if (uploadKind === "cover") {
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user?.role === "AUPAIR") {
        await prisma.auPairProfile.updateMany({
          where: { userId: session.user.id },
          data: { coverImage: result.url },
        });
      } else if (user?.role === "PARENT") {
        await prisma.familyProfile.updateMany({
          where: { userId: session.user.id },
          data: { coverImage: result.url },
        });
      }
    }

    return NextResponse.json({ url: result.url, mime: result.mime, size: result.size });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
