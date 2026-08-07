import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, Search, MessageSquare, Handshake, Shield, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "How AuPairly works — signup to trusted match",
  description:
    "Step-by-step guide: sign up, verify identity, complete your profile, discover matches, message safely, and place care for childcare, caregiving, house sitting, and pet sitting.",
  path: "/how-it-works",
  keywords: ["how to find an au pair", "how to hire a babysitter online"],
});

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "How it works", path: "/how-it-works" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="Guide"
        title="How AuPairly works"
        description="A clear path from signup to a successful match — for hosts and sitters across four care categories."
      />

      <div className="space-y-8">
        {[
          {
            icon: <Handshake className="h-6 w-6" />,
            title: "1. Choose your role & services",
            body: "Sign up as a host (need care) or sitter (offer care). Pick childcare, caregiving, house sitting, pet sitting — or combine them in a 2-minute setup.",
          },
          {
            icon: <BadgeCheck className="h-6 w-6" />,
            title: "2. Complete & verify your profile",
            body: "Add a clear photo, bio, and city. Complete ID + selfie verification for a Verified badge. Reach ~70% completeness to unlock Discover and boosts.",
          },
          {
            icon: <Search className="h-6 w-6" />,
            title: "3. Browse or Discover",
            body: "Filter the marketplace by category and location, or swipe in Discover with service filters and match scores.",
          },
          {
            icon: <MessageSquare className="h-6 w-6" />,
            title: "4. Message, shortlist, place",
            body: "Express interest, chat in-app, shortlist favourites, and move serious matches into placements. Free tier applies; upgrade when you hit limits.",
          },
          {
            icon: <Sparkles className="h-6 w-6" />,
            title: "5. Upgrade when you're serious",
            body: "Plus and Premium (Paystack) unlock unlimited messages, interests, Discover swipes, and featured visibility — one clear upgrade path.",
          },
        ].map((step, i) => (
          <div
            key={step.title}
            className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              {step.icon}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
                Step {i + 1}
              </p>
              <h2 className="mt-1 font-display text-xl font-semibold text-stone-900">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-stone-500">{step.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
        <Link href="/register" className="btn-primary">
          Get started free
        </Link>
        <Link href="/safety" className="btn-secondary inline-flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Safety tips
        </Link>
        <Link href="/pricing" className="btn-secondary">
          See plans
        </Link>
      </div>
    </div>
  );
}
