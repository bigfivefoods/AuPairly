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

const s = SERVICES.CHILDCARE;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — find verified care`,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  path,
  keywords: [
    "au pair",
    "babysitter",
    "nanny",
    "childcare marketplace",
    "after school care",
  ],
});

export default function ChildcarePage() {
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
      <ServiceLanding serviceId="CHILDCARE" />
    </>
  );
}
