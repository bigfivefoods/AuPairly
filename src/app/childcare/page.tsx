import type { Metadata } from "next";
import { ServiceLanding } from "@/components/service-landing";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

const s = SERVICES.CHILDCARE;

export const metadata: Metadata = {
  title: s.seoTitle,
  description: `${s.seoDescription} Including ${s.examples.join(", ").toLowerCase()}.`,
  openGraph: {
    title: `${s.seoTitle} · AuPairly`,
    description: s.seoDescription,
    url: "https://www.aupairly.me/childcare",
  },
  alternates: { canonical: "/childcare" },
};

export default function ChildcarePage() {
  return <ServiceLanding serviceId="CHILDCARE" />;
}
