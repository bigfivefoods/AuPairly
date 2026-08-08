import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serviceBySlug, SERVICE_LIST, type ServiceId } from "@/lib/services";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { PageHeader } from "@/components/ui";
import { profileIdsForService } from "@/lib/service-tags";
import { SA_CITIES, cityFromSlug } from "@/lib/sa-cities";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
  serviceJsonLd,
} from "@/lib/seo";

export const revalidate = 3600;

type Props = { params: Promise<{ service: string; city: string }> };

function titleCaseCity(slug: string) {
  const known = cityFromSlug(slug);
  if (known) return known.name;
  return decodeURIComponent(slug)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function generateStaticParams() {
  const params: { service: string; city: string }[] = [];
  for (const s of SERVICE_LIST) {
    for (const c of SA_CITIES) {
      params.push({ service: s.slug, city: c.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service: serviceSlug, city: citySlug } = await params;
  const def = serviceBySlug(serviceSlug);
  if (!def) return { title: "Not found" };
  const city = titleCaseCity(citySlug);
  const known = cityFromSlug(citySlug);
  const province = known?.province ? `, ${known.province}` : "";
  return buildPageMetadata({
    title: `${def.name} in ${city}${province} — verified on AuPairly`,
    description: `Find verified ${def.shortName.toLowerCase()} sitters and hosts in ${city}${province}. ${def.seoDescription} Free to join · message safely on AuPairly.`,
    path: `/${def.slug}/${citySlug}`,
    keywords: [
      `${def.shortName.toLowerCase()} ${city}`,
      `${def.shortName.toLowerCase()} near ${city}`,
      `hire ${def.shortName.toLowerCase()} ${city}`,
      `find ${def.shortName.toLowerCase()} ${city}`,
      "AuPairly",
      "South Africa",
    ],
  });
}

export default async function ServiceCityPage({ params }: Props) {
  const { service: serviceSlug, city: citySlug } = await params;
  const def = serviceBySlug(serviceSlug);
  if (!def) notFound();

  const serviceId = def.id as ServiceId;
  const cityLabel = titleCaseCity(citySlug);
  const known = cityFromSlug(citySlug);
  const cityFilter = cityLabel;

  let sitters: Awaited<
    ReturnType<
      typeof prisma.auPairProfile.findMany<{
        include: {
          user: {
            select: {
              name: true;
              image: true;
              safetyScore: true;
              placementVerified: true;
            };
          };
        };
      }>
    >
  > = [];
  let hosts: Awaited<
    ReturnType<
      typeof prisma.familyProfile.findMany<{
        include: {
          user: {
            select: {
              name: true;
              image: true;
              safetyScore: true;
              placementVerified: true;
            };
          };
        };
      }>
    >
  > = [];

  try {
    const [sitterTags, hostTags] = await Promise.all([
      profileIdsForService("AUPAIR", serviceId),
      profileIdsForService("FAMILY", serviceId),
    ]);

    const cityContains = { contains: cityFilter, mode: "insensitive" as const };

    [sitters, hosts] = await Promise.all([
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
          user: {
            select: {
              name: true,
              image: true,
              safetyScore: true,
              placementVerified: true,
            },
          },
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
          user: {
            select: {
              name: true,
              image: true,
              safetyScore: true,
              placementVerified: true,
            },
          },
        },
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
        take: 12,
      }),
    ]);
  } catch (e) {
    console.error("[service/city] load failed", serviceSlug, citySlug, e);
  }

  const path = `/${def.slug}/${citySlug}`;
  const faqs = [
    {
      question: `How do I find ${def.shortName.toLowerCase()} in ${cityLabel}?`,
      answer: `Create a free AuPairly account, set your city to ${cityLabel}, choose ${def.shortName.toLowerCase()} as a service, and publish your listing. Browse sitters or hosts below and message in-app.`,
    },
    {
      question: `Is ${def.shortName.toLowerCase()} free to list in ${cityLabel}?`,
      answer:
        "Yes — joining and listing is free. Paid Plus plans unlock unlimited messages when you need more conversations.",
    },
    {
      question: "How does verification work?",
      answer:
        "Members can complete ID verification for a Verified badge. Prefer verified profiles and keep early chats on AuPairly.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: def.name, path: `/${def.slug}` },
            { name: cityLabel, path },
          ]),
          serviceJsonLd({
            name: `${def.name} in ${cityLabel}`,
            description: `${def.seoDescription} Local results for ${cityLabel}.`,
            path,
          }),
          faqJsonLd(faqs),
        ]}
      />

      <PageHeader
        eyebrow={`${def.name} · ${known?.province || "South Africa"}`}
        title={`${def.name} in ${cityLabel}`}
        description={`${def.description} Browse verified sitters and hosts near ${cityLabel}. Free to join — message safely on AuPairly.`}
      />

      <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
        <p className="font-semibold text-stone-900">
          {def.name} near {cityLabel}
        </p>
        <p className="mt-2 leading-relaxed">
          AuPairly connects hosts and sitters for {def.examples.slice(0, 4).join(", ").toLowerCase()}
          {def.examples.length > 4 ? ", and more" : ""}. Publish a complete profile (photo, city,
          bio) to rank higher in Discover and local search.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/register?role=PARENT" className="btn-primary">
            I need {def.shortName.toLowerCase()}
          </Link>
          <Link href="/register?role=AUPAIR" className="btn-secondary">
            I offer {def.shortName.toLowerCase()}
          </Link>
          <Link
            href={`/cities/${citySlug}`}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            All care in {cityLabel} →
          </Link>
        </div>
      </div>

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

      <section className="mb-12">
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

      <section className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
        <h2 className="font-display text-lg font-semibold text-stone-900">
          FAQ · {def.name} in {cityLabel}
        </h2>
        <dl className="mt-4 space-y-4">
          {faqs.map((f) => (
            <div key={f.question}>
              <dt className="text-sm font-semibold text-stone-900">{f.question}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-stone-600">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="mt-8 flex flex-wrap gap-2">
        {SA_CITIES.filter((c) => c.slug !== citySlug)
          .slice(0, 8)
          .map((c) => (
            <Link
              key={c.slug}
              href={`/${def.slug}/${c.slug}`}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-600 ring-1 ring-stone-200 hover:text-teal-800"
            >
              {def.shortName} in {c.name}
            </Link>
          ))}
      </div>
    </div>
  );
}
