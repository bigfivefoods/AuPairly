import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Refund Policy",
  description:
    "Refund and cancellation policy for AuPairly memberships, profile boosts, placement fees, and marketplace purchases.",
};

const LAST_UPDATED = "7 August 2026";

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Refund Policy"
        description={`Last updated: ${LAST_UPDATED}. How cancellations and refunds work for paid AuPairly products.`}
      />

      <Card className="space-y-6 text-sm leading-relaxed text-stone-600">
        <Section title="1. Overview">
          <p>
            This Refund Policy applies to digital products and fees sold on{" "}
            <strong>{BRAND.name}</strong> ({BRAND.domain}), including membership plans (Plus /
            Premium), profile boosts, placement success fees, and marketplace products paid via
            Paystack or other payment partners.
          </p>
          <p className="mt-2">
            By purchasing on the Platform you agree to this policy, our{" "}
            <Link href="/terms" className="font-semibold text-teal-700 hover:underline">
              Terms of Service
            </Link>
            , and our{" "}
            <Link href="/privacy" className="font-semibold text-teal-700 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
          <p className="mt-2">
            <strong>Contact for refund requests:</strong>{" "}
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
              Contact form
            </Link>
            .
          </p>
        </Section>

        <Section title="2. Nature of our products">
          <p>
            AuPairly sells <strong>digital access and platform tools</strong> (membership features,
            visibility boosts, and facilitation tools). We are a marketplace technology platform —
            not an employer or placement agency. Paid access typically begins immediately after
            successful payment.
          </p>
          <p className="mt-2">
            Where South African consumer law (including the Consumer Protection Act, 68 of 2008)
            applies, we honour mandatory rights that cannot be waived. This policy explains how we
            handle refunds in ordinary commercial cases.
          </p>
        </Section>

        <Section title="3. Membership plans (Plus & Premium)">
          <p>
            Paid memberships (for example week, 3-month, or annual access) unlock features such as
            higher messaging and matching limits, visibility tools, and related entitlements for the
            selected period.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              <strong>Cooling-off (unused digital access):</strong> If you purchase a paid plan and{" "}
              <em>have not</em> made material use of paid-only features (for example unlimited
              messaging, boosts included in the plan, or “see who liked you”), you may request a
              full refund within <strong>7 days</strong> of payment.
            </li>
            <li>
              <strong>After use of paid features:</strong> Once you have used paid-only features in
              a meaningful way, membership fees are generally{" "}
              <strong>non-refundable</strong> for the remainder of the period, because access is a
              digital service delivered immediately.
            </li>
            <li>
              <strong>Change of mind after 7 days:</strong> We do not refund unused days of a
              period already started, except where required by law or at our sole discretion
              (for example documented technical failure on our side).
            </li>
            <li>
              <strong>Duplicate charges:</strong> If you are charged twice for the same purchase,
              contact us with both payment references; we will refund the duplicate in full after
              verification with Paystack.
            </li>
            <li>
              <strong>Plan changes:</strong> Moving to a higher plan may involve a new checkout. We
              do not automatically pro-rate or refund the previous plan unless we expressly agree in
              writing.
            </li>
          </ul>
        </Section>

        <Section title="4. Profile boosts">
          <p>
            Profile boosts are <strong>once-off digital visibility products</strong>. When a boost
            is activated, featured placement and related ranking effects begin immediately.
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              If a boost payment succeeds but the boost <strong>fails to activate</strong> for
              technical reasons on our side, we will either re-apply the boost or refund the charge
              after investigation.
            </li>
            <li>
              Boosts that have already started (including demo or paid boosts that granted featured
              status) are <strong>not refundable</strong> for change of mind, dislike of results, or
              low match volume — marketplace outcomes vary.
            </li>
          </ul>
        </Section>

        <Section title="5. Placement success fees">
          <p>
            Success fees (if charged when a placement reaches an agreed status) relate to platform
            facilitation around a specific match pipeline. They are generally{" "}
            <strong>non-refundable</strong> once paid, unless:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>We charged you in error; or</li>
            <li>
              We cancel the fee product for that placement for documented platform error; or
            </li>
            <li>Applicable law requires a refund.</li>
          </ul>
          <p className="mt-2">
            Disputes between host and sitter about the underlying placement agreement are between
            those parties; a personal dispute does not automatically create a refund right against
            AuPairly.
          </p>
        </Section>

        <Section title="6. Marketplace / storefront products">
          <p>
            Products sold by users through Paystack-powered storefronts may be offered by third-party
            sellers. Where you buy from another member:
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5">
            <li>
              Refund requests for the <strong>seller’s goods or services</strong> should first be
              raised with that seller.
            </li>
            <li>
              AuPairly may assist with payment references and fraud investigation but is not the
              merchant of record for every third-party product.
            </li>
            <li>
              Platform fees retained by AuPairly (if any) are only refundable if the related
              charge is reversed in full and the law or our payment provider requires it.
            </li>
          </ul>
        </Section>

        <Section title="7. Demo / test mode charges">
          <p>
            When Paystack is not configured, the Platform may grant{" "}
            <strong>demo access with no real card charge</strong>. Demo activations are not
            payments and have no refund. If you see a R0 “demo” line on your{" "}
            <Link href="/account" className="font-semibold text-teal-700 hover:underline">
              account report
            </Link>
            , it is for record-keeping only.
          </p>
        </Section>

        <Section title="8. How to request a refund">
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Email <strong>{BRAND.email}</strong> or use{" "}
              <Link href="/contact" className="font-semibold text-teal-700 hover:underline">
                Contact us
              </Link>{" "}
              within the timeframes above.
            </li>
            <li>
              Include: account email, approximate payment date, amount, Paystack/reference number
              (from your email receipt or{" "}
              <Link href="/account" className="font-semibold text-teal-700 hover:underline">
                account report
              </Link>
              ), and reason for the request.
            </li>
            <li>
              We aim to acknowledge requests within <strong>2 business days</strong> and decide
              within <strong>7–14 business days</strong> after we verify the payment with our
              processor.
            </li>
            <li>
              Approved refunds are returned to the original payment method via Paystack (or the
              processor used). Bank timing varies (typically 5–10 business days after we submit the
              refund).
            </li>
          </ol>
        </Section>

        <Section title="9. Chargebacks and payment disputes">
          <p>
            If you open a chargeback with your bank or card issuer before contacting us, we may
            suspend paid features on the account while the dispute is investigated. Fraudulent or
            abusive chargebacks may result in account termination under our Terms.
          </p>
          <p className="mt-2">
            Please contact us first so we can resolve genuine errors quickly without a formal
            dispute.
          </p>
        </Section>

        <Section title="10. Free plan">
          <p>
            The Free (Starter) plan has no membership charge. There is nothing to refund for free
            access itself. Optional paid add-ons (boosts, upgrades) follow the sections above.
          </p>
        </Section>

        <Section title="11. Changes to this policy">
          <p>
            We may update this Refund Policy from time to time. The “Last updated” date at the top
            will change when we do. Material changes may also be announced by email or in-product
            notice. Continued use of paid features after an update constitutes acceptance of the
            revised policy for future purchases.
          </p>
        </Section>

        <Section title="12. Governing law">
          <p>
            This policy is intended for use with our South Africa–oriented marketplace and Paystack
            billing. Disputes are handled under the laws applicable to the Platform as set out in
            our Terms of Service, without prejudice to mandatory consumer protections in your
            country of residence.
          </p>
        </Section>

        <p className="border-t border-stone-100 pt-4 text-xs text-stone-400">
          This policy is a commercial summary for transparency. It is not personal legal advice.
          For high-value or complex disputes, obtain independent advice. Your statutory rights (if
          any) remain unaffected where they cannot be limited by contract.
        </p>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/account" className="btn-primary text-sm">
          Account &amp; transactions
        </Link>
        <Link href="/billing" className="btn-secondary text-sm">
          Billing
        </Link>
        <Link href="/contact" className="btn-secondary text-sm">
          Request a refund
        </Link>
        <Link href="/terms" className="btn-secondary text-sm">
          Terms of Service
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-base font-semibold text-stone-900">{title}</h2>
      <div className="mt-2">{children}</div>
    </section>
  );
}
