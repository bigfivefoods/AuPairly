import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import {
  breadcrumbJsonLd,
  buildPageMetadata,
  faqJsonLd,
} from "@/lib/seo";

export const revalidate = 86400;

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "What is AuPairly?",
    answer:
      "AuPairly is a trusted marketplace for au pairs and childcare, tutors, caregivers, house sitters, house swaps, and dog/pet sitters. Hosts and sitters create verified profiles, message safely, and move into placements.",
  },
  {
    question: "Is AuPairly free to join?",
    answer:
      "Yes. You can register, publish a listing, browse, and start matching on the free plan. Plus memberships unlock unlimited messages and Discover when you need more volume.",
  },
  {
    question: "Which services can I list?",
    answer:
      "Childcare / au pair, tutoring, caregiving, house sitting, house swap (hosts), and dog / pet sitting. One profile can offer multiple services.",
  },
  {
    question: "How does verification work?",
    answer:
      "Members can complete ID and selfie checks. South African users may use VerifyNow; others use international document flows. Verified badges help hosts and sitters trust each other.",
  },
  {
    question: "When can we share phone numbers?",
    answer:
      "Phone numbers, emails, and social handles stay private in chat until shortlist (or accepted interest / later placement stages). Keep early conversations on AuPairly.",
  },
  {
    question: "Do I need a video intro?",
    answer:
      "Sitters applying for jobs need a minimum 1-minute intro video (record in-app, upload, or paste a YouTube link). It unlocks application packets.",
  },
  {
    question: "What is house swap on AuPairly?",
    answer:
      "Mutual home exchange between host families — different from one-way house sitting. List dates and destinations; matches score date and location fit.",
  },
  {
    question: "Where does AuPairly operate?",
    answer:
      "Worldwide, with strong focus and SEO landings across South African cities such as Cape Town, Johannesburg, Pretoria, Durban, Sandton, and more.",
  },
  {
    question: "How do reviews work?",
    answer:
      "Members leave star ratings and written reviews. AuPairly moderates them before they go public on profiles.",
  },
  {
    question: "How do I get help?",
    answer:
      "Email hello@aupairly.me, check How it works and Safety pages, or open Support when logged in.",
  },
];

export const metadata: Metadata = buildPageMetadata({
  title: "FAQ — AuPairly hosts, sitters & house swap",
  description:
    "Frequently asked questions about AuPairly: free plans, verification, video intros, contact privacy, house swap, tutoring, and placements in South Africa.",
  path: "/faq",
  keywords: [
    "AuPairly FAQ",
    "au pair questions South Africa",
    "is AuPairly free",
    "house swap FAQ",
  ],
});

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          faqJsonLd(FAQS),
        ]}
      />
      <PageHeader
        eyebrow="Help"
        title="Frequently asked questions"
        description="Straight answers for hosts and sitters. Ready to match? Join free and publish a city-complete profile."
      />

      <div className="space-y-3">
        {FAQS.map((f) => (
          <Card key={f.question} className="!p-5">
            <h2 className="font-display text-lg font-semibold text-stone-900">
              {f.question}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{f.answer}</p>
          </Card>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link href="/register" className="btn-primary">
          Join free
        </Link>
        <Link href="/guides" className="btn-secondary">
          Read guides
        </Link>
        <Link href="/how-it-works" className="btn-ghost text-sm font-semibold text-teal-700">
          How it works →
        </Link>
      </div>
    </div>
  );
}
