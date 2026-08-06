import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const metadata = { title: "Privacy (POPIA)" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 prose-stone">
      <PageHeader
        eyebrow="Legal"
        title="Privacy & POPIA"
        description="How AuPairly handles personal information for South African and international users."
      />
      <Card className="space-y-4 text-sm leading-relaxed text-stone-600">
        <p>
          <strong>Responsible party:</strong> AuPairly ({BRAND.domain}). Contact us at{" "}
          <a href={BRAND.emailHref} className="font-semibold text-teal-700 hover:underline">
            {BRAND.email}
          </a>
          {" · "}
          <a
            href={BRAND.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-teal-700 hover:underline"
          >
            WhatsApp {BRAND.whatsapp}
          </a>
          {" · "}
          <Link href="/contact" className="font-semibold text-teal-700 hover:underline">
            Contact page
          </Link>
          .
        </p>
        <p>
          <strong>What we collect:</strong> account details, profile content, verification documents
          you upload, messages, payment references (via Paystack), device/session data for security.
        </p>
        <p>
          <strong>Why:</strong> to operate the marketplace, verify identity, process payments, prevent
          fraud, and improve matching. Legal bases include contract, legitimate interests, and consent
          where required.
        </p>
        <p>
          <strong>Sharing:</strong> other members see what you publish on your profile. Processors
          include hosting (e.g. Vercel), database (Supabase), and payments (Paystack). We do not sell
          personal data.
        </p>
        <p>
          <strong>Your rights (POPIA):</strong> access, correction, deletion (subject to legal holds),
          objection to certain processing, and complaints to the Information Regulator (South Africa).
        </p>
        <p>
          <strong>Security:</strong> passwords hashed, HTTPS, role-based admin access, document vault
          links controlled by you. Report incidents via{" "}
          <Link href="/contact" className="font-semibold text-teal-700 hover:underline">
            Contact us
          </Link>{" "}
          or Priority support (Plus/Premium).
        </p>
        <p className="text-xs text-stone-400">
          This summary is not formal legal advice. Update with counsel before processing large volumes
          of children’s data or expanding jurisdictions.
        </p>
      </Card>
    </div>
  );
}
