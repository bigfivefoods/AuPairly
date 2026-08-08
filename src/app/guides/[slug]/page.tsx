import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { guideBySlug, SEO_GUIDES } from "@/lib/seo-guides";
import {
  articleJsonLd,
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
} from "@/lib/seo";

export const revalidate = 86400;

export function generateStaticParams() {
  return SEO_GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) return { title: "Guide" };
  return buildPageMetadata({
    title: g.title,
    description: g.description,
    path: `/guides/${g.slug}`,
    keywords: g.keywords,
    type: "article",
  });
}

export default async function GuideArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const g = guideBySlug(slug);
  if (!g) notFound();

  return (
    <article className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Guides", path: "/guides" },
            { name: g.title, path: `/guides/${g.slug}` },
          ]),
          articleJsonLd({
            title: g.title,
            description: g.description,
            path: `/guides/${g.slug}`,
          }),
          faqJsonLd(g.faqs),
        ]}
      />

      <PageHeader
        eyebrow={`Guide · ${g.minutes} min read`}
        title={g.title}
        description={g.description}
      />

      <div className="prose-stone space-y-8">
        {g.sections.map((s) => (
          <section key={s.h2}>
            <h2 className="font-display text-xl font-semibold text-stone-900">
              {s.h2}
            </h2>
            {s.body.map((p) => (
              <p
                key={p.slice(0, 40)}
                className="mt-3 text-sm leading-relaxed text-stone-600 sm:text-base"
              >
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>

      {g.faqs.length > 0 && (
        <section className="mt-12 rounded-2xl border border-stone-200 bg-stone-50 p-6">
          <h2 className="font-display text-lg font-semibold text-stone-900">
            FAQ
          </h2>
          <dl className="mt-4 space-y-4">
            {g.faqs.map((f) => (
              <div key={f.question}>
                <dt className="text-sm font-semibold text-stone-900">
                  {f.question}
                </dt>
                <dd className="mt-1 text-sm leading-relaxed text-stone-600">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/register" className="btn-primary">
          Join AuPairly free
        </Link>
        <Link href="/browse/aupairs" className="btn-secondary">
          Browse sitters
        </Link>
        <Link href="/guides" className="text-sm font-semibold text-teal-700 hover:underline">
          ← All guides
        </Link>
      </div>
    </article>
  );
}
