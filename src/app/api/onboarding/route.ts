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
  "TUTORING",
  "CAREGIVING",
  "HOUSE_SITTING",
  "HOUSE_SWAP",
  "PET_SITTING",
]);

const schema = z.object({
  services: z.array(serviceEnum).min(1).max(6),
  city: z.string().min(1).max(80),
  country: z.string().min(2).max(80),
  region: z.string().max(80).optional().nullable(),
  headline: z.string().max(120).optional().nullable(),
  /** Required for go-live path */
  imageUrl: z.string().url().optional().nullable(),
  /** Always true from ruthless wizard; draft only if explicit false */
  publish: z.boolean().optional().default(true),
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
    const publish = body.publish !== false;
    const status = publish ? "ACTIVE" : "DRAFT";

    // Photo required to publish
    const imageUrl = body.imageUrl?.trim() || null;
    if (publish && !imageUrl) {
      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
      });
      if (!existing?.image) {
        return NextResponse.json(
          { error: "Add a profile photo before publishing." },
          { status: 400 }
        );
      }
    }

    if (imageUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: { image: imageUrl },
      });
    }

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
          status,
        },
      });
      await syncProfileServiceTags({
        profileRole: "AUPAIR",
        profileId: profile.id,
        servicesJson,
      });
    } else if (role === "PARENT") {
      const headline = body.headline?.trim() || defaultHostHeadline(body.services);
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
          status,
        },
      });
      await syncProfileServiceTags({
        profileRole: "FAMILY",
        profileId: profile.id,
        servicesJson,
      });
    } else {
      return NextResponse.json(
        { error: "Onboarding is for hosts and sitters" },
        { status: 400 }
      );
    }

    await createNotification({
      userId,
      type: "SYSTEM",
      title: publish ? "You're live!" : "Profile started",
      body: publish
        ? "Your listing is published. Get verified to earn the trust badge and message more people."
        : "Add a photo and publish when ready.",
      href: publish ? "/discover" : "/profile/edit",
    }).catch(() => null);

    return NextResponse.json({
      ok: true,
      next: publish ? "/dashboard?live=1" : "/profile/edit",
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
        ? "au pair / childcare"
        : s === "TUTORING"
          ? "tutoring"
          : s === "CAREGIVING"
            ? "caregiving"
            : s === "HOUSE_SITTING"
              ? "house sitting"
              : s === "HOUSE_SWAP"
                ? "house swap"
                : "dog / pet sitting"
    )
    .join(" · ");
  return `${first} — ${labels}`;
}

function defaultHostHeadline(services: string[]) {
  const labels = services
    .map((s) =>
      s === "CHILDCARE"
        ? "an au pair"
        : s === "TUTORING"
          ? "a tutor"
          : s === "CAREGIVING"
            ? "a caregiver"
            : s === "HOUSE_SITTING"
              ? "a house sitter"
              : s === "HOUSE_SWAP"
                ? "a house swap"
                : "a dog / pet sitter"
    )
    .join(" / ");
  return `Looking for ${labels}`;
}
