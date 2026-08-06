import type { Metadata } from "next";
import { ServiceLanding } from "@/components/service-landing";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

const s = SERVICES.HOUSE_SITTING;

export const metadata: Metadata = {
  title: s.seoTitle,
  description: s.seoDescription,
  openGraph: {
    title: `${s.seoTitle} · AuPairly`,
    description: s.seoDescription,
    url: "https://www.aupairly.me/house-sitting",
  },
  alternates: { canonical: "/house-sitting" },
};

export default function HouseSittingPage() {
  return <ServiceLanding serviceId="HOUSE_SITTING" />;
}
