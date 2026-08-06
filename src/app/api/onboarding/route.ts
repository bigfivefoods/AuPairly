import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeServices, type ServiceId } from "@/lib/services";
import { syncProfileServiceTags } from "@/lib/service-tags";
import { continentForCountry } from "@/lib/locations";
import { createNotification } from "@/lib/notifications";

const serviceEnum = z.enum([
  "CHILDCARE",
  "CAREGIVING",
  "HOUSE_SITTING",
  "PET_SITTING",
]);

const schema = z.object({
  services: z.array(serviceEnum).min(1).max(4),
  city: z.string().min(1).max(80),
  country: z.string().min(2).max(80),
  region: z.string().max(80).optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  publish: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = schema.parse(await req.json());
    const userId = session.user.id;
    const role = session.user.role;
    const servicesJson = serializeServices(body.services as ServiceId[]);
    const continent = continentForCountry(body.country) || null;
    const status = body.publish ? "ACTIVE" : "DRAFT";

    if (role === "AUPAIR") {
      const headline =
        body.headline?.trim() ||
        defaultSitterHeadline(session.user.name || "Sitter", body.services);
      const profile = await prisma.auPairProfile.upsert({
        where: { userId },
        create: {
          userId,
          city: body.city,
          country: body.country,
          region: body.region || null,
          continent,
          services: servicesJson,
          headline,
          status,
        },
        update: {
          city: body.city,
          country: body.country,
          region: body.region || null,
          continent,
          services: servicesJson,
          headline,
          ...(body.publish ? { status: "ACTIVE" } : {}),
        },
      });
      await syncProfileServiceTags({
        profileRole: "AUPAIR",
        profileId: profile.id,
        servicesJson,
      });
    } else if (role === "PARENT") {
      const headline =
        body.headline?.trim() ||
        defaultHostHeadline(body.services);
      const profile = await prisma.familyProfile.upsert({
        where: { userId },
        create: {
          userId,
          city: body.city,
          country: body.country,
          region: body.region || null,
          continent,
          services: servicesJson,
          headline,
          status,
        },
        update: {
          city: body.city,
          country: body.country,
          region: body.region || null,
          continent,
          services: servicesJson,
          headline,
          ...(body.publish ? { status: "ACTIVE" } : {}),
        },
      });
      await syncProfileServiceTags({
        profileRole: "FAMILY",
        profileId: profile.id,
        servicesJson,
      });
    } else {
      return NextResponse.json({ error: "Onboarding is for hosts and sitters" }, { status: 400 });
    }

    await createNotification({
      userId,
      type: "SYSTEM",
      title: "You're set up",
      body: body.publish
        ? "Your listing is live. Add a photo and bio to unlock Discover."
        : "Profile started. Add a photo and publish when ready.",
      href: "/profile/edit",
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      next: body.publish ? "/profile/edit?onboarded=1" : "/profile/edit",
    });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }
    console.error("[onboarding]", e);
    return NextResponse.json({ error: "Could not save onboarding" }, { status: 500 });
  }
}

function defaultSitterHeadline(name: string, services: string[]) {
  const first = name.split(" ")[0];
  const labels = services
    .map((s) =>
      s === "CHILDCARE"
        ? "childcare"
        : s === "CAREGIVING"
          ? "caregiving"
          : s === "HOUSE_SITTING"
            ? "house sitting"
            : "pet sitting"
    )
    .join(" · ");
  return `${first} — ${labels}`;
}

function defaultHostHeadline(services: string[]) {
  const labels = services
    .map((s) =>
      s === "CHILDCARE"
        ? "childcare"
        : s === "CAREGIVING"
          ? "a caregiver"
          : s === "HOUSE_SITTING"
            ? "a house sitter"
            : "a pet sitter"
    )
    .join(" / ");
  return `Looking for ${labels}`;
}
