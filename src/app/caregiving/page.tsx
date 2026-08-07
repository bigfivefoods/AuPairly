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

const s = SERVICES.CAREGIVING;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — verified support`,
  description: s.seoDescription,
  path,
  keywords: [
    "elderly caregiver",
    "companion care",
    "disability support",
    "respite care",
  ],
});

export default function CaregivingPage() {
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
      <ServiceLanding serviceId="CAREGIVING" />
    </>
  );
}
