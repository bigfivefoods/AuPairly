import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { SEO_GUIDES } from "@/lib/seo-guides";
import {
  absoluteUrl,
  breadcrumbJsonLd,
  buildPageMetadata,
  itemListJsonLd,
} from "@/lib/seo";
import { SA_CITIES } from "@/lib/sa-cities";
import { SERVICE_LIST } from "@/lib/services";

export const revalidate = 86400;

export const metadata: Metadata = buildPageMetadata({
  title: "Guides: au pairs, childcare, caregiving & sitting",
  description:
    "Practical guides for hosts and sitters — find an au pair in South Africa, babysitter vs nanny, elderly care, house sitting checklists, and city tips on AuPairly.",
  path: "/guides",
  keywords: [
    "au pair guide",
    "childcare tips South Africa",
    "how to hire babysitter",
    "house sitting checklist",
  ],
});

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
          ]),
          itemListJsonLd({
            name: "AuPairly guides",
            description: "Guides for hosts and sitters",
            path: "/guides",
            items: SEO_GUIDES.map((g) => ({
              name: g.title,
              path: `/guides/${g.slug}`,
            })),
          }),
        ]}
      />
      <PageHeader
        eyebrow="Learn · SEO hub"
        title="Guides for hosts & sitters"
        description="Long-form advice for hiring and offering care — childcare, caregiving, house sitting, and pet sitting. Free to join AuPairly when you’re ready to match."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {SEO_GUIDES.map((g) => (
          <Card key={g.slug} className="flex flex-col">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-teal-700">
              {g.minutes} min read
            </p>
            <h2 className="mt-1 font-display text-lg font-semibold text-stone-900">
              <Link
                href={`/guides/${g.slug}`}
                className="hover:text-teal-800 hover:underline"
              >
                {g.title}
              </Link>
            </h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-500">
              {g.description}
            </p>
            <Link
              href={`/guides/${g.slug}`}
              className="mt-3 text-sm font-semibold text-teal-700 hover:underline"
            >
              Read guide →
            </Link>
          </Card>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-stone-900">
          Browse by city
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Local landing pages for hosts and sitters across South Africa.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SA_CITIES.slice(0, 16).map((c) => (
            <Link
              key={c.slug}
              href={`/cities/${c.slug}`}
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-teal-50 hover:text-teal-800"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-stone-900">
          Browse by service
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {SERVICE_LIST.map((s) => (
            <Link
              key={s.id}
              href={`/${s.slug}`}
              className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-stone-400">
        Also read{" "}
        <Link href="/safety" className="font-medium text-teal-700 hover:underline">
          safety
        </Link>
        ,{" "}
        <Link
          href="/how-it-works"
          className="font-medium text-teal-700 hover:underline"
        >
          how it works
        </Link>
        , and{" "}
        <Link href="/pricing" className="font-medium text-teal-700 hover:underline">
          pricing
        </Link>
        . Sitemap:{" "}
        <a
          href={absoluteUrl("/sitemap.xml")}
          className="font-medium text-teal-700 hover:underline"
        >
          sitemap.xml
        </a>
      </p>
    </div>
  );
}
