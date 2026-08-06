import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { FamilyCard } from "@/components/listing-cards";
import { EmptyState, PageHeader, Input } from "@/components/ui";
import { LocationFilterFields } from "@/components/location-fields";
import { CategoryTabs } from "@/components/category-tabs";
import { continentName } from "@/lib/locations";
import { serviceFromParam, SERVICES } from "@/lib/services";
import { profileIdsForService } from "@/lib/service-tags";
import { Home } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Find hosts" };

type SearchParams = Promise<{
  q?: string;
  continent?: string;
  country?: string;
  region?: string;
  city?: string;
  service?: string;
  verified?: string;
}>;

export default async function BrowseFamiliesPage({
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

  const taggedIds = service
    ? await profileIdsForService("FAMILY", service)
    : null;

  const families = await prisma.familyProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(verifiedOnly ? { isVerified: true } : {}),
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
              { familyName: { contains: q } },
              { city: { contains: q } },
              { region: { contains: q } },
              { country: { contains: q } },
              { preferences: { contains: q } },
              { user: { name: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
  });

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
          service ? `Hosts needing ${SERVICES[service].shortName.toLowerCase()}` : "Find hosts"
        }
        description={
          service
            ? SERVICES[service].description
            : "Search hosts across all categories — or focus with a category tab."
        }
      />

      <div className="mb-6">
        <Suspense fallback={<div className="h-12 animate-pulse rounded-full bg-stone-100" />}>
          <CategoryTabs side="hosts" activeService={service} mode="browse" />
        </Suspense>
      </div>

      <div className="mb-4 flex flex-wrap gap-3 text-sm">
        <Link href="/map?type=families" className="font-semibold text-teal-700 hover:underline">
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
            <Input name="q" defaultValue={q} placeholder="Preferences, languages…" />
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-stone-600">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={verifiedOnly}
              className="h-4 w-4 rounded border-stone-300 text-teal-600"
            />
            Verified only
          </label>
          <button type="submit" className="btn-primary btn-inline w-full shrink-0 sm:w-auto">
            Search
          </button>
        </div>
      </form>

      {filterBits.length > 0 && (
        <p className="mb-4 text-sm text-stone-500">Filters: {filterBits.join(" · ")}</p>
      )}

      {families.length === 0 ? (
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          title="No hosts found"
          description="Try a wider continent or country, or clear service / location filters."
          action={
            <Link href="/browse/families" className="btn-secondary">
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {families.length} host{families.length === 1 ? "" : "s"} seeking help
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {families.map((f) => (
              <FamilyCard
                key={f.id}
                id={f.id}
                name={f.user.name}
                familyName={f.familyName}
                image={f.user.image}
                headline={f.headline}
                city={f.city}
                region={f.region}
                country={f.country}
                continent={f.continent}
                childrenCount={f.childrenCount}
                childrenAges={f.childrenAges}
                isVerified={f.isVerified}
                rating={f.rating}
                reviewCount={f.reviewCount}
                pocketMoney={f.pocketMoney}
                startDate={f.startDate}
                weeklyHours={f.weeklyHours}
                languages={f.languages}
                scheduleJson={f.scheduleJson}
                services={f.services}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
