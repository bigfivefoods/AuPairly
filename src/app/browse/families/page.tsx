import { prisma } from "@/lib/prisma";
import { FamilyCard } from "@/components/listing-cards";
import { EmptyState, PageHeader, Input } from "@/components/ui";
import { Home } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Browse families" };

type SearchParams = Promise<{ q?: string; country?: string; verified?: string }>;

export default async function BrowseFamiliesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || "";
  const country = sp.country?.trim() || "";
  const verifiedOnly = sp.verified === "1";

  const families = await prisma.familyProfile.findMany({
    where: {
      status: "ACTIVE",
      ...(verifiedOnly ? { isVerified: true } : {}),
      ...(country ? { country: { contains: country } } : {}),
      ...(q
        ? {
            OR: [
              { headline: { contains: q } },
              { bio: { contains: q } },
              { familyName: { contains: q } },
              { city: { contains: q } },
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Marketplace"
        title="Find a host family"
        description="Explore families looking for caring au pairs around the world."
      />

      <div className="mb-4">
        <Link href="/map?type=families" className="text-sm font-semibold text-teal-700 hover:underline">
          Browse on map →
        </Link>
      </div>

      <form className="mb-8 flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Search
          </label>
          <Input name="q" defaultValue={q} placeholder="City, preferences…" />
        </div>
        <div className="sm:w-48">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Country
          </label>
          <Input name="country" defaultValue={country} placeholder="e.g. United States" />
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
        <button type="submit" className="btn-primary shrink-0">
          Search
        </button>
      </form>

      {families.length === 0 ? (
        <EmptyState
          icon={<Home className="h-7 w-7" />}
          title="No families found"
          description="Try different filters or come back soon for new listings."
          action={
            <Link href="/browse/families" className="btn-secondary">
              Clear filters
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-4 text-sm text-stone-500">
            {families.length} famil{families.length === 1 ? "y" : "ies"} seeking au pairs
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
                country={f.country}
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
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
