import type { Metadata } from "next";
import { ServiceLanding } from "@/components/service-landing";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

const s = SERVICES.CAREGIVING;

export const metadata: Metadata = {
  title: s.seoTitle,
  description: s.seoDescription,
  openGraph: {
    title: `${s.seoTitle} · AuPairly`,
    description: s.seoDescription,
    url: "https://www.aupairly.me/caregiving",
  },
  alternates: { canonical: "/caregiving" },
};

export default function CaregivingPage() {
  return <ServiceLanding serviceId="CAREGIVING" />;
}
