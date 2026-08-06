import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for AuPairly.me — marketplace platform rules, disclaimers, and limitation of liability.",
};

const LAST_UPDATED = "6 August 2026";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Legal"
        title="Terms of Service"
        description={`Last updated: ${LAST_UPDATED}. By using AuPairly you agree to these terms in full.`}
      />

      <Card className="space-y-6 text-sm leading-relaxed text-stone-600">
        <Section title="1. Who we are">
          <p>
            These Terms of Service (&quot;Terms&quot;) govern access to and use of the website,
            applications, and services operated under the name <strong>{BRAND.name}</strong> at{" "}
            <strong>{BRAND.domain}</strong> (the &quot;Platform&quot;, &quot;we&quot;,
            &quot;us&quot;, &quot;our&quot;). Contact:{" "}
            <a href={BRAND.emailHref} className="font-semibold text-teal-700 hover:underline">
              {BRAND.email}
            </a>
            .
          </p>
          <p className="mt-2">
            By creating an account, browsing, messaging, paying for a plan, or otherwise using the
            Platform, you agree to be bound by these Terms, our{" "}
            <Link href="/privacy" className="font-semibold text-teal-700 hover:underline">
              Privacy Policy
            </Link>
            , and our{" "}
            <Link href="/disclaimer" className="font-semibold text-teal-700 hover:underline">
              Platform Disclaimer
            </Link>
            . If you do not agree, do not use the Platform.
          </p>
        </Section>

        <Section title="2. Marketplace only — not an employer, agency, or guarantor">
          <p>
            <strong>
              AuPairly is an online marketplace and technology platform that enables users to create
              profiles, browse listings, express interest, message, and arrange their own care,
              sitting, or placement relationships.
            </strong>
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              We are <strong>not</strong> an employment agency, recruitment agency, au pair agency,
              staffing company, or domestic worker employer.
            </li>
            <li>
              We do <strong>not</strong> employ sitters, au pairs, caregivers, house sitters, or pet
              sitters, and we do <strong>not</strong> employ host families or households.
            </li>
            <li>
              We do <strong>not</strong> control, supervise, or direct how users perform services for
              each other, set work hours, pay wages, or structure household arrangements.
            </li>
            <li>
              Any agreement for services, pay, pocket money, board, hours, duties, or placement is{" "}
              <strong>solely between the users involved</strong>. AuPairly is not a party to those
              agreements and has no obligation to enforce them.
            </li>
          </ul>
        </Section>

        <Section title="3. No warranty of safety, suitability, or outcomes">
          <p>
            Verification tools, badges, reviews, references, safety scores, ID checks, and similar
            features are <strong>optional aids only</strong>. They do not guarantee identity,
            character, criminal history, immigration status, skills, health, insurance cover, or
            suitability.
          </p>
          <p className="mt-2">
            You use the Platform and interact with other users{" "}
            <strong>entirely at your own risk</strong>. You are solely responsible for:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Verifying identity, references, and legal right to work or host;</li>
            <li>Background checks, interviews, trial periods, and references beyond our tools;</li>
            <li>Safety of children, elderly persons, pets, property, and premises;</li>
            <li>Complying with all applicable labour, immigration, tax, housing, and child-protection laws;</li>
            <li>Any money, gifts, transfers, or contracts you arrange outside the Platform.</li>
          </ul>
        </Section>

        <Section title="4. User conduct and prohibited use">
          <p>You agree not to:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Post false, misleading, defamatory, illegal, or harmful content;</li>
            <li>Harass, exploit, threaten, or endanger any person (including minors);</li>
            <li>Use the Platform for trafficking, illegal work, fraud, scams, or money laundering;</li>
            <li>Solicit users to leave the Platform solely to evade fees in bad faith where prohibited;</li>
            <li>Scrape, reverse engineer, or abuse the Platform or other users&apos; data;</li>
            <li>Impersonate others or misuse verification or payment systems.</li>
          </ul>
          <p className="mt-2">
            We may suspend or terminate accounts, remove content, or report activity to authorities
            without notice where we reasonably believe these Terms or the law are breached. We have
            no duty to monitor all content but reserve the right to do so.
          </p>
        </Section>

        <Section title="5. User-generated content">
          <p>
            You retain ownership of content you post, but grant AuPairly a worldwide,
            non-exclusive, royalty-free licence to host, display, and process that content to operate
            the Platform. You represent that you have all rights needed to post it and that it does
            not infringe others&apos; rights. We may remove content at our discretion.
          </p>
        </Section>

        <Section title="6. Payments, plans, and refunds">
          <p>
            Paid memberships, boosts, and marketplace features are billed as described at checkout
            (e.g. via Paystack). Fees are for access to Platform features,{" "}
            <strong>not</strong> for a guarantee of matches, hires, placements, or income. Except
            where required by mandatory consumer law, payments are non-refundable once access is
            granted. Demo or promotional access may differ.
          </p>
        </Section>

        <Section title="7. Third-party services">
          <p>
            The Platform may link to or integrate third parties (payments, hosting, maps, messaging,
            identity tools). We are not responsible for third-party services, outages, or their terms
            and privacy practices.
          </p>
        </Section>

        <Section title="8. Disclaimer of warranties">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE PLATFORM IS PROVIDED{" "}
            <strong>&quot;AS IS&quot; AND &quot;AS AVAILABLE&quot;</strong> WITHOUT WARRANTIES OF ANY
            KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, TITLE, NON-INFRINGEMENT, ACCURACY, OR UNINTERRUPTED AVAILABILITY.
          </p>
          <p className="mt-2">
            We do not warrant that users are who they claim to be, that any care arrangement will be
            successful or safe, or that the Platform will be free of errors, viruses, or security
            incidents.
          </p>
        </Section>

        <Section title="9. Limitation of liability">
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {BRAND.name.toUpperCase()}, ITS OWNERS,
            DIRECTORS, EMPLOYEES, CONTRACTORS, AND AFFILIATES SHALL{" "}
            <strong>NOT BE LIABLE</strong> FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            PUNITIVE, OR EXEMPLARY DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OPPORTUNITY, OR
            BUSINESS INTERRUPTION, ARISING OUT OF OR RELATED TO:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Your use of, or inability to use, the Platform;</li>
            <li>Conduct, statements, acts, or omissions of any user or third party;</li>
            <li>Any placement, employment, care, sitting, or household arrangement;</li>
            <li>Injury, death, property damage, theft, abuse, or neglect involving users;</li>
            <li>Disputes between users over pay, duties, hours, or termination;</li>
            <li>Unauthorised access to or alteration of your transmissions or data.</li>
          </ul>
          <p className="mt-2">
            OUR TOTAL AGGREGATE LIABILITY FOR ALL CLAIMS RELATING TO THE PLATFORM SHALL NOT EXCEED
            THE GREATER OF (A) THE AMOUNTS YOU PAID TO US FOR PLATFORM ACCESS IN THE THREE (3)
            MONTHS BEFORE THE CLAIM, OR (B) ZAR 500 (FIVE HUNDRED SOUTH AFRICAN RAND).
          </p>
          <p className="mt-2">
            Nothing in these Terms excludes liability that cannot be excluded under applicable law
            (including fraud or gross negligence where such exclusion is void).
          </p>
        </Section>

        <Section title="10. Indemnification">
          <p>
            You agree to indemnify, defend, and hold harmless AuPairly and its owners, directors,
            employees, and agents from and against any claims, damages, losses, costs, and expenses
            (including reasonable legal fees) arising out of or related to: (a) your use of the
            Platform; (b) your content; (c) your interactions or agreements with other users; (d)
            your breach of these Terms or the law; or (e) injury or loss suffered by any person
            (including minors) in connection with services arranged via the Platform.
          </p>
        </Section>

        <Section title="11. Release">
          <p>
            If you have a dispute with one or more users, you release AuPairly from claims, demands,
            and damages of every kind arising out of or in any way connected with such disputes, to
            the fullest extent permitted by law.
          </p>
        </Section>

        <Section title="12. Suspension and termination">
          <p>
            We may suspend or terminate your access at any time, with or without cause or notice.
            You may stop using the Platform at any time. Provisions that by nature should survive
            (including disclaimers, limitation of liability, indemnities, and intellectual property)
            survive termination.
          </p>
        </Section>

        <Section title="13. Governing law and disputes">
          <p>
            These Terms are governed by the laws of the <strong>Republic of South Africa</strong>,
            without regard to conflict-of-law rules. Subject to mandatory consumer rights, courts of
            competent jurisdiction in South Africa shall have exclusive jurisdiction, unless we elect
            arbitration or mediation in writing.
          </p>
        </Section>

        <Section title="14. Changes">
          <p>
            We may update these Terms at any time by posting a revised version on the Platform. Continued
            use after changes constitutes acceptance. Material changes may be highlighted on the site
            or by notice where practicable.
          </p>
        </Section>

        <Section title="15. Entire agreement">
          <p>
            These Terms, the Privacy Policy, and the Platform Disclaimer constitute the entire
            agreement between you and us regarding the Platform and supersede prior understandings
            on that subject. If any provision is unenforceable, the remainder remains in effect.
          </p>
        </Section>

        <p className="border-t border-stone-100 pt-4 text-xs text-stone-400">
          This document is provided for platform protection and transparency. It is not a substitute
          for formal legal advice tailored to your jurisdiction. For questions:{" "}
          <a href={BRAND.emailHref} className="text-teal-700 hover:underline">
            {BRAND.email}
          </a>
          .
        </p>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/disclaimer" className="font-semibold text-teal-700 hover:underline">
          Platform Disclaimer →
        </Link>
        <Link href="/privacy" className="font-semibold text-teal-700 hover:underline">
          Privacy (POPIA) →
        </Link>
        <Link href="/safety" className="font-semibold text-teal-700 hover:underline">
          Safety tips →
        </Link>
        <Link href="/contact" className="font-semibold text-teal-700 hover:underline">
          Contact us →
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
