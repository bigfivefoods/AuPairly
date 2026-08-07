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

const s = SERVICES.PET_SITTING;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — trusted pet care`,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  path,
  keywords: ["pet sitter", "dog sitter", "cat sitter", "pet boarding alternative"],
});

export default function PetSittingPage() {
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
      <ServiceLanding serviceId="PET_SITTING" />
    </>
  );
}
