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

const s = SERVICES.TUTORING;
const path = `/${s.slug}`;

export const metadata: Metadata = buildPageMetadata({
  title: `${s.seoTitle} — find verified tutors`,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  path,
  keywords: [
    "tutor",
    "tutoring",
    "homework help",
    "exam prep",
    "maths tutor",
    "language tutor South Africa",
  ],
});

export default function TutoringPage() {
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
      <ServiceLanding serviceId="TUTORING" />
    </>
  );
}
