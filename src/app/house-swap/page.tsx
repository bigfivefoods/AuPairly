import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight, Home, ShieldCheck, CalendarRange } from "lucide-react";
import { ServiceLanding } from "@/components/service-landing";
import { JsonLd } from "@/components/json-ld";
import { SERVICES } from "@/lib/services";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  serviceJsonLd,
} from "@/lib/seo";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

const s = SERVICES.HOUSE_SWAP;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — verified families`,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  path,
  keywords: [
    "house swap",
    "home exchange",
    "holiday house swap South Africa",
    "swap homes",
    "family home exchange",
  ],
});

export default function HouseSwapPage() {
  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            name: s.name,
            description: s.seoDescription,
            path,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: s.name, path },
          ]),
        ]}
      />

      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6 lg:px-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Card className="space-y-2">
            <ArrowLeftRight className="h-5 w-5 text-violet-700" />
            <h3 className="font-semibold text-stone-900">Mutual exchange</h3>
            <p className="text-sm text-stone-600">
              You stay in their home while they stay in yours — or agree non-simultaneous windows.
              Not one-way house sitting.
            </p>
          </Card>
          <Card className="space-y-2">
            <CalendarRange className="h-5 w-5 text-violet-700" />
            <h3 className="font-semibold text-stone-900">Dates & destinations</h3>
            <p className="text-sm text-stone-600">
              List when your place is free and where you want to go (city, coast, school holidays).
            </p>
          </Card>
          <Card className="space-y-2">
            <ShieldCheck className="h-5 w-5 text-violet-700" />
            <h3 className="font-semibold text-stone-900">Same trust stack</h3>
            <p className="text-sm text-stone-600">
              Verified profiles, shortlist before sharing numbers, and owner-moderated reviews —
              built for safe family-to-family swaps.
            </p>
          </Card>
        </div>
        <p className="mb-6 text-sm text-stone-500">
          Looking for someone to <em>sit</em> your home (not swap)? See{" "}
          <Link href="/house-sitting" className="font-semibold text-teal-700 hover:underline">
            House sitting
          </Link>
          . Prefer a sitter for pets only?{" "}
          <Link href="/pet-sitting" className="font-semibold text-teal-700 hover:underline">
            Pet sitting
          </Link>
          .
        </p>
      </div>

      <ServiceLanding serviceId="HOUSE_SWAP" />

      <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Card className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Home className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
            <div>
              <p className="font-semibold text-stone-900">List your home for swap</p>
              <p className="text-sm text-stone-600">
                Host families: add <strong>House swap</strong> under services, set dates and where
                you want to go, then publish.
              </p>
            </div>
          </div>
          <Link href="/profile/edit" className="btn-primary shrink-0 text-sm">
            Edit host listing
          </Link>
        </Card>
      </div>
    </>
  );
}
