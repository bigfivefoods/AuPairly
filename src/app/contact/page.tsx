import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { ContactUs } from "@/components/contact-us";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Contact AuPairly at hello@aupairly.me or WhatsApp +27 82 581 4215.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="AuPairly"
        title="Contact us"
        description="We're here for hosts, sitters, and partners. Reach us by email or WhatsApp."
      />
      <ContactUs />
      <p className="mt-8 text-center text-sm text-stone-500">
        Prefer an in-app ticket?{" "}
        <Link href="/support" className="font-semibold text-teal-700 hover:underline">
          Open support
        </Link>
      </p>
    </div>
  );
}
