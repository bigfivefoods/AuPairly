import type { Metadata } from "next";
import { ServiceLanding } from "@/components/service-landing";
import { JsonLd } from "@/components/json-ld";
import { SERVICES } from "@/lib/services";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  serviceJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

const s = SERVICES.HOUSE_SITTING;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — trusted home care`,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  path,
  keywords: ["house sitter", "home sitting", "holiday house sitter"],
});

export default function HouseSittingPage() {
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
      <ServiceLanding serviceId="HOUSE_SITTING" />
    </>
  );
}
