import type { Metadata } from "next";
import { ServiceLanding } from "@/components/service-landing";
import { SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

const s = SERVICES.PET_SITTING;

export const metadata: Metadata = {
  title: s.seoTitle,
  description: s.seoDescription,
  openGraph: {
    title: `${s.seoTitle} · AuPairly`,
    description: s.seoDescription,
    url: "https://www.aupairly.me/pet-sitting",
  },
  alternates: { canonical: "/pet-sitting" },
};

export default function PetSittingPage() {
  return <ServiceLanding serviceId="PET_SITTING" />;
}
