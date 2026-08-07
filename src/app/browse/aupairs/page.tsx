import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuPairCard } from "@/components/listing-cards";
import { EmptyState, PageHeader, Input } from "@/components/ui";
import { LocationFilterFields } from "@/components/location-fields";
import { CategoryTabs } from "@/components/category-tabs";
import { continentName } from "@/lib/locations";
import { serviceFromParam, SERVICES } from "@/lib/services";
import { profileIdsForService } from "@/lib/service-tags";
import { buildPageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Find verified sitters & care providers",
  description:
    "Browse verified sitters, babysitters, caregivers, house sitters, and pet sitters. Filter by city, services, and availability on AuPairly.",
  path: "/browse/aupairs",
  keywords: ["find au pair", "hire babysitter", "caregiver listings", "find sitter"],
});

type SearchParams = Promise<{
  q?: string;
  continent?: string;
  country?: string;
  region?: string;
  city?: string;
  service?: string;
  verified?: string;
  driving?: string;
  liveIn?: string;
  firstAid?: string;
}>;

export default async function BrowseAupairsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const continent = sp.continent?.trim() || "";
  const country = sp.country?.trim() || "";
  const region = sp.region?.trim() || "";
  const city = sp.city?.trim() || "";
  const service = serviceFromParam(sp.service);
  const verifiedOnly = sp.verified === "1";
  const drivingOnly = sp.driving === "1";
  const liveInOnly = sp.liveIn === "1";
  const firstAidOnly = sp.firstAid === "1";

  let aupairs: Awaited<
    ReturnType<
      typeof prisma.auPairProfile.findMany<{
        include: {
          user: {
            select: {
              name: true;
              image: true;
              avgResponseMinutes: true;
              safetyScore: true;
            };
          };
        };
      }>
    >
  > = [];
  let dbOk = true;

  try {
    const taggedIds = service
      ? await profileIdsForService("AUPAIR", service)
      : null;

    aupairs = await prisma.auPairProfile.findMany({
      where: {
        status: "ACTIVE",
        ...(verifiedOnly ? { isVerified: true } : {}),
        ...(drivingOnly ? { drivingLicense: true } : {}),
        ...(liveInOnly ? { liveIn: true } : {}),
        ...(firstAidOnly ? { firstAid: true } : {}),
        ...(service
          ? taggedIds && taggedIds.length > 0
            ? {
                OR: [
                  { id: { in: taggedIds } },
                  { services: { contains: service } },
                ],
              }
            : { services: { contains: service } }
          : {}),
        ...(continent ? { continent } : {}),
        ...(country
          ? {
              OR: [
                { country: { equals: country } },
                { country: { contains: country } },
                { preferredCountries: { contains: country } },
              ],
            }
          : {}),
        ...(region
          ? {
              OR: [
                { region: { equals: region } },
                { region: { contains: region } },
              ],
            }
          : {}),
        ...(city
          ? {
              OR: [{ city: { contains: city } }, { city: { equals: city } }],
            }
          : {}),
        ...(q
          ? {
              OR: [
                { headline: { contains: q } },
                { bio: { contains: q } },
                { nationality: { contains: q } },
                { languages: { contains: q } },
                { city: { contains: q } },
                { region: { contains: q } },
                { country: { contains: q } },
                { user: { name: { contains: q } } },
              ],
            }
          : {}),
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
            avgResponseMinutes: true,
            safetyScore: true,
          },
        },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      take: 48,
    });
  } catch (e) {
    console.error("[browse/aupairs] load failed", e);
    dbOk = false;
  }

  const filterBits = [
    continent ? continentName(continent) : null,
    country || null,
    region || null,
    city || null,
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Marketplace · AuPairly.me"
        title={
          service
            ? `${SERVICES[service].shortName} sitters`
            : "Find sitters"
        }
        description={
          service
            ? SERVICES[service].description
            : "Search across childcare, house sitting & pet sitting — or pick a category tab."
        }
      />

      <div className="mb-6">
        <Suspense fallback={<div className="h-12 animate-pulse rounded-full bg-stone-100" />}>
          <CategoryTabs side="sitters" activeService={service} mode="browse" />
        </Suspense>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/map?type=aupairs" className="font-semibold text-teal-700 hover:underline">
          Browse on map →
        </Link>
        {service && (
          <Link
            href={`/${SERVICES[service].slug}`}
            className="text-stone-500 hover:text-teal-700"
          >
            {SERVICES[service].shortName} landing page →
          </Link>
        )}
      </div>

      <form className="mb-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        {/* Keep service in form when using other filters with GET submit */}
        {service ? <input type="hidden" name="service" value={service} /> : null}
        <LocationFilterFields
          continent={continent}
          country={country}
          region={region}
          city={city}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Keywords
            </label>
            <Input name="q" defaultValue={q} placeholder="Language, skill, name…" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={verifiedOnly}
              className="h-4 w-4 rounded border-stone-300 text-teal-600"
            />
            Verified
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="driving"
              value="1"
              defaultChecked={drivingOnly}
              className="h-4 w-4 rounded border-stone-300 text-teal-600"
            />
            Drives
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="firstAid"
              value="1"
              defaultChecked={firstAidOnly}
              className="h-4 w-4 rounded border-stone-300 text-teal-600"
            />
            First aid
          </label>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="liveIn"
              value="1"
              defaultChecked={liveInOnly}
              className="h-4 w-4 rounded border-stone-300 text-teal-600"
            />
            Live-in
          </label>
          <button type="submit" className="btn-primary btn-inline w-full shrink-0 sm:w-auto">
            Search
          </button>
        </div>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/saved-searches" className="font-semibold text-teal-700 hover:underline">
          Save this search + alerts
        </Link>
        <Link href="/cities/cape-town" className="text-stone-500 hover:text-teal-700">
          City guides
        </Link>
        {filterBits.length > 0 && (
          <span className="text-stone-500">
            Filters: {filterBits.join(" · ")}
          </span>
        )}
      </div>

      {!dbOk && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Listings are temporarily unavailable. Please try again shortly.
        </div>
      )}

      {aupairs.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No sitters found"
          description={
            dbOk
              ? "Try a wider continent or country, or clear service / location filters."
              : "Database is temporarily unavailable — page still works, listings will appear once configured."
          }
          action={
            <Link href="/browse/aupairs" className="btn-secondary">
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {aupairs.length} sitter{aupairs.length === 1 ? "" : "s"} available
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aupairs.map((a) => (
              <AuPairCard
                key={a.id}
                id={a.id}
                name={a.user.name}
                image={a.user.image}
                coverImage={a.coverImage}
                photos={a.photos}
                headline={a.headline}
                city={a.city}
                region={a.region}
                country={a.country}
                continent={a.continent}
                nationality={a.nationality}
                languages={a.languages}
                experienceYears={a.experienceYears}
                age={a.age}
                isVerified={a.isVerified}
                rating={a.rating}
                reviewCount={a.reviewCount}
                pocketMoneyMin={a.pocketMoneyMin}
                availableFrom={a.availableFrom}
                weeklyHours={a.weeklyHours}
                scheduleJson={a.scheduleJson}
                services={a.services}
                safetyScore={a.user.safetyScore}
                responseLabel={
                  a.user.avgResponseMinutes != null
                    ? `Usually replies in ~${Math.max(1, Math.round(a.user.avgResponseMinutes))}m`
                    : null
                }
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
