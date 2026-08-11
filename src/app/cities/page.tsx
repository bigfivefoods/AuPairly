import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { SA_CITIES, uniqueSaCitiesForNav } from "@/lib/sa-cities";
import { SERVICE_LIST } from "@/lib/services";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  itemListJsonLd,
} from "@/lib/seo";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  title: "Cities — find care near you in South Africa",
  description:
    "Browse AuPairly by city: Cape Town, Johannesburg, Pretoria, Durban, Sandton, Stellenbosch, and more. Au pairs, tutors, house sitters, dog sitters, and house swaps.",
  path: "/cities",
  keywords: [
    "au pair near me",
    "babysitter Cape Town",
    "nanny Johannesburg",
    "house sitter Durban",
    "tutor Pretoria",
    "cities South Africa care",
  ],
});

export default function CitiesHubPage() {
  const cities = uniqueSaCitiesForNav();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Cities", path: "/cities" },
          ]),
          itemListJsonLd({
            name: "AuPairly cities South Africa",
            description: "City landings for hosts and sitters",
            path: "/cities",
            items: cities.map((c) => ({
              name: `${c.name} care marketplace`,
              path: `/cities/${c.slug}`,
            })),
          }),
        ]}
      />
      <PageHeader
        eyebrow="Local · SEO hub"
        title="Find care by city"
        description="South African city pages for verified sitters and host families — childcare, tutoring, house sitting, house swap, and pet care."
      />

      <div className="mb-8 flex flex-wrap gap-2">
        {SERVICE_LIST.map((s) => (
          <Link
            key={s.id}
            href={`/${s.slug}`}
            className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-teal-300 hover:text-teal-800"
          >
            {s.shortName}
          </Link>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((c) => (
          <Card key={c.slug} className="flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              {c.province}
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-stone-900">
              <Link
                href={`/cities/${c.slug}`}
                className="hover:text-teal-800 hover:underline"
              >
                {c.name}
              </Link>
            </h2>
            {c.blurb && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">
                {c.blurb}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
              <Link
                href={`/cities/${c.slug}`}
                className="text-teal-700 hover:underline"
              >
                City guide →
              </Link>
              <Link
                href={`/childcare/${c.slug}`}
                className="text-stone-500 hover:text-teal-700"
              >
                Childcare
              </Link>
              <Link
                href={`/pet-sitting/${c.slug}`}
                className="text-stone-500 hover:text-teal-700"
              >
                Pets
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-8 text-center text-sm text-stone-500">
        {SA_CITIES.length}+ city URLs in the sitemap · service × city pages for long-tail
        search (e.g. /house-swap/cape-town).
      </p>
    </div>
  );
}
