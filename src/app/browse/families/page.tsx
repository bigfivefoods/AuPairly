import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { Home } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { FamilyCard } from "@/components/listing-cards";
import { EmptyState, PageHeader, Input } from "@/components/ui";
import { LocationFilterFields } from "@/components/location-fields";
import { CategoryTabs } from "@/components/category-tabs";
import { continentName } from "@/lib/locations";
import { serviceFromParam, SERVICES } from "@/lib/services";
import { profileIdsForService } from "@/lib/service-tags";
import { buildPageMetadata } from "@/lib/seo";
import { SaveSearchButton } from "@/components/save-search-button";
import { auth } from "@/lib/auth";

export const revalidate = 60;

export const metadata: Metadata = buildPageMetadata({
  title: "Find hosts & care jobs",
  description:
    "Browse hosts seeking childcare, caregiving, house sitting, or pet sitting. Apply and message securely on AuPairly.",
  path: "/browse/families",
  keywords: ["au pair jobs", "babysitting jobs", "house sitting jobs", "find host family"],
});

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
  const session = await auth();
  const q = sp.q?.trim() || "";
  const continent = sp.continent?.trim() || "";
  const country = sp.country?.trim() || "";
  const region = sp.region?.trim() || "";
  const city = sp.city?.trim() || "";
  const service = serviceFromParam(sp.service);
  const verifiedOnly = sp.verified === "1";

  let families: Awaited<
    ReturnType<
      typeof prisma.familyProfile.findMany<{
        include: {
          user: {
            select: {
              name: true;
              image: true;
              avgResponseMinutes: true;
              safetyScore: true;
              lastActiveAt: true;
            };
          };
        };
      }>
    >
  > = [];
  let dbOk = true;

  try {
    const taggedIds = service
      ? await profileIdsForService("FAMILY", service)
      : null;

    families = await prisma.familyProfile.findMany({
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
      include: {
        user: {
          select: {
            name: true,
            image: true,
            avgResponseMinutes: true,
            safetyScore: true,
            lastActiveAt: true,
          },
        },
      },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }, { createdAt: "desc" }],
      take: 48,
    });
  } catch (e) {
    console.error("[browse/families] load failed", e);
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

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
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
        <SaveSearchButton
          isLoggedIn={Boolean(session?.user)}
          name={
            city
              ? `Hosts in ${city}`
              : service
                ? `${SERVICES[service].shortName} hosts`
                : "Host search"
          }
          filters={{
            target: "families",
            ...(city ? { city } : {}),
            ...(country ? { country } : {}),
            ...(verifiedOnly ? { verified: "1" } : {}),
            ...(service ? { service } : {}),
          }}
        />
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

      {!dbOk && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Listings are temporarily unavailable. Please try again shortly.
        </div>
      )}

      {families.length === 0 ? (
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          title="No hosts found yet"
          description={
            dbOk
              ? "Be first in this area — post a free host listing, or invite a family. Widen filters to see more."
              : "Database is temporarily unavailable — page still works, listings will appear once configured."
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/register?role=PARENT" className="btn-primary">
                List as a host
              </Link>
              <Link href="/register?role=AUPAIR" className="btn-secondary">
                I offer care
              </Link>
              <Link href="/browse/families" className="btn-secondary">
                Clear filters
              </Link>
            </div>
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
                safetyScore={f.user.safetyScore}
                lastActiveAt={f.user.lastActiveAt}
                responseLabel={
                  f.user.avgResponseMinutes != null
                    ? `Usually replies in ~${Math.max(1, Math.round(f.user.avgResponseMinutes))}m`
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
