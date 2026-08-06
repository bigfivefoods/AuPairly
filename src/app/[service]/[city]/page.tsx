import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceBySlug, SERVICES, type ServiceId } from "@/lib/services";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { PageHeader } from "@/components/ui";
import { profileIdsForService } from "@/lib/service-tags";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ service: string; city: string }> };

function titleCaseCity(slug: string) {
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export async function generateMetadata({ params }: Props) {
  const { service: serviceSlug, city: citySlug } = await params;
  const def = serviceBySlug(serviceSlug);
  if (!def) return { title: "Not found" };
  const city = titleCaseCity(citySlug);
  return {
    title: `${def.name} in ${city}`,
    description: `${def.seoDescription} Local results for ${city}.`,
  };
}

export default async function ServiceCityPage({ params }: Props) {
  const { service: serviceSlug, city: citySlug } = await params;
  const def = serviceBySlug(serviceSlug);
  // Avoid stealing real top-level routes that aren't services
  if (!def) notFound();

  const serviceId = def.id as ServiceId;
  const cityLabel = titleCaseCity(citySlug);
  const cityFilter = cityLabel; // profiles store display city names

  const [sitterTags, hostTags] = await Promise.all([
    profileIdsForService("AUPAIR", serviceId),
    profileIdsForService("FAMILY", serviceId),
  ]);

  const cityContains = { contains: cityFilter, mode: "insensitive" as const };

  const [sitters, hosts] = await Promise.all([
    prisma.auPairProfile.findMany({
      where: {
        status: "ACTIVE",
        city: cityContains,
        OR:
          sitterTags.length > 0
            ? [{ id: { in: sitterTags } }, { services: { contains: serviceId } }]
            : [{ services: { contains: serviceId } }],
      },
      include: {
        user: { select: { name: true, image: true, safetyScore: true, placementVerified: true } },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take: 12,
    }),
    prisma.familyProfile.findMany({
      where: {
        status: "ACTIVE",
        city: cityContains,
        OR:
          hostTags.length > 0
            ? [{ id: { in: hostTags } }, { services: { contains: serviceId } }]
            : [{ services: { contains: serviceId } }],
      },
      include: {
        user: { select: { name: true, image: true, safetyScore: true, placementVerified: true } },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take: 12,
    }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`${def.name} · local`}
        title={`${def.name} in ${cityLabel}`}
        description={`${def.description} Browse verified sitters and hosts near ${cityLabel}.`}
      />

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Link href={`/${def.slug}`} className="font-semibold text-teal-700 hover:underline">
          ← All {def.shortName.toLowerCase()}
        </Link>
        <Link
          href={`/browse/aupairs?service=${serviceId}&city=${encodeURIComponent(cityLabel)}`}
          className="text-stone-500 hover:text-teal-700"
        >
          Full sitter search
        </Link>
      </div>

      <section className="mb-12">
        <h2 className="font-display text-xl font-semibold text-stone-900">
          Sitters · {cityLabel}
        </h2>
        {sitters.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            No active sitters yet in this city for {def.shortName.toLowerCase()}.{" "}
            <Link href="/register?role=AUPAIR" className="font-semibold text-teal-700">
              Offer services here
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sitters.map((p) => (
              <AuPairCard
                key={p.id}
                id={p.id}
                name={p.user.name}
                image={p.user.image}
                headline={p.headline}
                city={p.city}
                region={p.region}
                country={p.country}
                languages={p.languages}
                experienceYears={p.experienceYears}
                age={p.age}
                isVerified={p.isVerified}
                rating={p.rating}
                reviewCount={p.reviewCount}
                pocketMoneyMin={p.pocketMoneyMin}
                availableFrom={p.availableFrom}
                weeklyHours={p.weeklyHours}
                scheduleJson={p.scheduleJson}
                services={p.services}
                safetyScore={p.user.safetyScore}
                placementVerified={p.user.placementVerified}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-xl font-semibold text-stone-900">
          Hosts · {cityLabel}
        </h2>
        {hosts.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            No active hosts yet.{" "}
            <Link href="/register?role=PARENT" className="font-semibold text-teal-700">
              Post what you need
            </Link>
          </p>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hosts.map((p) => (
              <FamilyCard
                key={p.id}
                id={p.id}
                name={p.user.name}
                familyName={p.familyName}
                image={p.user.image}
                headline={p.headline}
                city={p.city}
                region={p.region}
                country={p.country}
                childrenCount={p.childrenCount}
                childrenAges={p.childrenAges}
                isVerified={p.isVerified}
                rating={p.rating}
                reviewCount={p.reviewCount}
                pocketMoney={p.pocketMoney}
                startDate={p.startDate}
                weeklyHours={p.weeklyHours}
                languages={p.languages}
                scheduleJson={p.scheduleJson}
                services={p.services}
                safetyScore={p.user.safetyScore}
                placementVerified={p.user.placementVerified}
              />
            ))}
          </div>
        )}
      </section>

      <p className="mt-12 text-center text-xs text-stone-400">
        Also explore:{" "}
        {Object.values(SERVICES)
          .filter((s) => s.id !== serviceId)
          .map((s) => (
            <Link
              key={s.id}
              href={`/${s.slug}/${citySlug}`}
              className="mx-1 font-medium text-teal-700 hover:underline"
            >
              {s.shortName}
            </Link>
          ))}
      </p>
    </div>
  );
}
