import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { PageHeader } from "@/components/ui";
import { CityWaitlistForm } from "@/components/city-waitlist-form";
import { cityFromSlug, SA_CITIES } from "@/lib/sa-cities";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return SA_CITIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = cityFromSlug(slug);
  if (!city) return { title: "City" };
  const { buildPageMetadata } = await import("@/lib/seo");
  return buildPageMetadata({
    title: `Au pairs & families in ${city.name}, ${city.province}`,
    description: `Find verified au pairs, babysitters, caregivers, house sitters, pet sitters, and host families in ${city.name}, ${city.province}. Browse, match, and message on AuPairly.`,
    path: `/cities/${slug}`,
    keywords: [
      `au pair ${city.name}`,
      `babysitter ${city.name}`,
      `childcare ${city.name}`,
      city.province,
    ],
  });
}

export default async function CityLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const city = cityFromSlug(slug);
  if (!city) notFound();

  let aupairs: Awaited<
    ReturnType<
      typeof prisma.auPairProfile.findMany<{
        include: { user: { select: { name: true; image: true } } };
      }>
    >
  > = [];
  let families: Awaited<
    ReturnType<
      typeof prisma.familyProfile.findMany<{
        include: { user: { select: { name: true; image: true } } };
      }>
    >
  > = [];

  try {
    [aupairs, families] = await Promise.all([
      prisma.auPairProfile.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { city: { contains: city.name, mode: "insensitive" } },
            { country: { contains: "South Africa", mode: "insensitive" } },
          ],
        },
        include: { user: { select: { name: true, image: true } } },
        take: 12,
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      }),
      prisma.familyProfile.findMany({
        where: {
          status: "ACTIVE",
          OR: [
            { city: { contains: city.name, mode: "insensitive" } },
            { country: { contains: "South Africa", mode: "insensitive" } },
          ],
        },
        include: { user: { select: { name: true, image: true } } },
        take: 12,
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      }),
    ]);
  } catch (e) {
    console.error("[cities] load failed", city.slug, e);
  }

  // Prefer exact city match first in display
  const aupairsLocal = aupairs.filter(
    (a) => a.city?.toLowerCase().includes(city.name.toLowerCase())
  );
  const familiesLocal = families.filter((f) =>
    f.city?.toLowerCase().includes(city.name.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow={`${city.province} · South Africa`}
        title={`Au pairs, babysitters & hosts in ${city.name}`}
        description={`Find verified childcare, caregiving, house sitters, and pet sitters in ${city.name}, ${city.province}. Free to join — publish a profile, message safely, and hire with confidence on AuPairly.`}
      />

      <div className="mb-8 rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
        <p className="font-semibold text-stone-900">Why {city.name} on AuPairly?</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>
            Local hosts and sitters for childcare, elderly care, house sitting &amp; pet sitting
          </li>
          <li>ID verification options (SA VerifyNow / international Didit) for trust</li>
          <li>In-app messaging first — meet in public places when you&apos;re ready</li>
          <li>
            Free to browse and list; Plus unlocks unlimited messages when you&apos;re ready to hire
          </li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/register?role=PARENT" className="btn-primary">
            I need help in {city.name}
          </Link>
          <Link href="/register?role=AUPAIR" className="btn-secondary">
            I offer care in {city.name}
          </Link>
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        {SA_CITIES.map((c) => (
          <Link
            key={c.slug}
            href={`/cities/${c.slug}`}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              c.slug === slug
                ? "bg-teal-600 text-white"
                : "bg-stone-100 text-stone-700 hover:bg-stone-200"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {(aupairsLocal.length === 0 || familiesLocal.length === 0) && (
        <div className="mb-10">
          <CityWaitlistForm city={city.name} slug={city.slug} />
        </div>
      )}

      <section className="mb-12">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Au pairs near {city.name}</h2>
          <Link href={`/browse/aupairs?q=${encodeURIComponent(city.name)}`} className="text-sm font-semibold text-teal-700">
            Browse all →
          </Link>
        </div>
        {(aupairsLocal.length ? aupairsLocal : aupairs).length === 0 ? (
          <p className="text-sm text-stone-500">
            No active sitters listed in {city.name} yet — join the waitlist above or check nearby
            cities.
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(aupairsLocal.length ? aupairsLocal : aupairs).map((a) => (
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
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold">Families in {city.name}</h2>
          <Link href={`/browse/families?q=${encodeURIComponent(city.name)}`} className="text-sm font-semibold text-teal-700">
            Browse all →
          </Link>
        </div>
        {(familiesLocal.length ? familiesLocal : families).length === 0 ? (
          <p className="text-sm text-stone-500">No active family listings yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {(familiesLocal.length ? familiesLocal : families).map((f) => (
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
        )}
      </section>
    </div>
  );
}
