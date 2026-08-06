import { prisma } from "@/lib/prisma";
import { AuPairCard } from "@/components/listing-cards";
import { EmptyState, PageHeader, Input } from "@/components/ui";
import { Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse au pairs" };

type SearchParams = Promise<{
  q?: string;
  country?: string;
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
  const country = sp.country?.trim() || "";
  const verifiedOnly = sp.verified === "1";
  const drivingOnly = sp.driving === "1";
  const liveInOnly = sp.liveIn === "1";
  const firstAidOnly = sp.firstAid === "1";

  const aupairs = await prisma.auPairProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(verifiedOnly ? { isVerified: true } : {}),
      ...(drivingOnly ? { drivingLicense: true } : {}),
      ...(liveInOnly ? { liveIn: true } : {}),
      ...(firstAidOnly ? { firstAid: true } : {}),
      ...(country
        ? {
            OR: [
              { country: { contains: country } },
              { preferredCountries: { contains: country } },
            ],
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
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Marketplace"
        title="Find your au pair"
        description="Browse verified caregivers by location, language, and experience."
      />

      <div className="mb-4">
        <Link href="/map?type=aupairs" className="text-sm font-semibold text-teal-700 hover:underline">
          Browse on map →
        </Link>
      </div>

      <form className="mb-8 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Search
          </label>
          <Input name="q" defaultValue={q} placeholder="Language, city, skill…" />
        </div>
        <div className="sm:w-48">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Country
          </label>
          <Input name="country" defaultValue={country} placeholder="e.g. Germany" />
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
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <Link href="/saved-searches" className="font-semibold text-teal-700 hover:underline">
          Save this search + alerts
        </Link>
        <Link href="/cities/cape-town" className="text-stone-500 hover:text-teal-700">
          City guides
        </Link>
      </div>

      {aupairs.length === 0 ? (
        <EmptyState
          icon={<Users className="h-7 w-7" />}
          title="No au pairs found"
          description="Try adjusting filters, or check back soon — new profiles go live every day."
          action={
            <Link href="/browse/aupairs" className="btn-secondary">
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {aupairs.length} au pair{aupairs.length === 1 ? "" : "s"} available
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {aupairs.map((a) => (
              <AuPairCard
                key={a.id}
                id={a.id}
                name={a.user.name}
                image={a.user.image}
                headline={a.headline}
                city={a.city}
                country={a.country}
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
