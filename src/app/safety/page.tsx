import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Eye,
  MessageCircleWarning,
  UserCheck,
  FileCheck,
  Home,
  PawPrint,
  HeartHandshake,
  Baby,
  Flag,
} from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { JsonLd } from "@/components/json-ld";
import { breadcrumbJsonLd, buildPageMetadata } from "@/lib/seo";

export const metadata: Metadata = buildPageMetadata({
  title: "Safety & verification — trust centre",
  description:
    "How AuPairly keeps childcare, caregiving, house sitting, and pet sitting safer: ID verification, VerifyNow, Didit, references, reporting, and best practices for hosts and sitters.",
  path: "/safety",
  keywords: ["verified au pair", "safe babysitter", "caregiver background check"],
});

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Safety & verification", path: "/safety" },
        ])}
      />
      <PageHeader
        eyebrow="Trust centre"
        title="Safety & verification"
        description="Every category on AuPairly — childcare, caregiving, house sitting, and pet sitting — starts with identity confidence, not just a nice bio."
      />

      <Card className="mb-8 border-stone-300 bg-stone-50">
        <p className="text-sm font-semibold text-stone-900">Legal notice</p>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          AuPairly is a marketplace platform only. We do not employ users, supervise placements,
          or guarantee safety or outcomes. You use the site and deal with other members at your
          own risk. See our{" "}
          <Link href="/terms" className="font-semibold text-teal-700 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/disclaimer" className="font-semibold text-teal-700 hover:underline">
            Platform Disclaimer
          </Link>{" "}
          for full limitation of liability and indemnities.
        </p>
      </Card>

      <div className="grid gap-6 sm:grid-cols-2">
        {[
          {
            icon: <UserCheck className="h-6 w-6" />,
            title: "Identity verification",
            body: "Members submit government ID and a selfie. Admins review when AUTO_VERIFY is off (recommended in production).",
          },
          {
            icon: <FileCheck className="h-6 w-6" />,
            title: "Background & references",
            body: "Request references and upload key documents (clearance, first aid). Stronger profiles rank higher for trust.",
          },
          {
            icon: <Eye className="h-6 w-6" />,
            title: "Privacy-first listings",
            body: "Exact addresses stay private. Share city and neighbourhood only until both sides are ready.",
          },
          {
            icon: <MessageCircleWarning className="h-6 w-6" />,
            title: "In-app messaging first",
            body: "Keep early conversations on AuPairly. Never wire money or share bank details off-platform.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              {item.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.body}</p>
          </Card>
        ))}
      </div>

      <h2 className="mt-14 font-display text-2xl font-semibold text-stone-900">
        Category-specific tips
      </h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Baby,
            title: "Childcare",
            tips: [
              "Video call before any live-in start",
              "Agree hours, duties, and pocket money in writing",
              "Meet in public with co-parent if possible",
            ],
          },
          {
            icon: HeartHandshake,
            title: "Caregiving",
            tips: [
              "Clarify medical limits (you are not a licensed nurse unless stated)",
              "Emergency contacts and medication lists on day one",
              "Discuss mobility, dementia, and respite boundaries early",
            ],
          },
          {
            icon: Home,
            title: "House sitting",
            tips: [
              "Never pay “holding deposits” to unknown sitters off-app",
              "Share alarm codes only after identity is verified",
              "Document plant/pet routines and emergency plumbers",
            ],
          },
          {
            icon: PawPrint,
            title: "Pet sitting",
            tips: [
              "Exchange vet details and medication instructions",
              "Trial meet-and-greet with the pet when possible",
              "Confirm multi-pet dynamics and house rules",
            ],
          },
        ].map((c) => (
          <Card key={c.title}>
            <div className="flex items-center gap-2 text-teal-800">
              <c.icon className="h-5 w-5" />
              <h3 className="font-display text-lg font-semibold">{c.title}</h3>
            </div>
            <ul className="mt-3 space-y-1.5 text-sm text-stone-600">
              {c.tips.map((t) => (
                <li key={t} className="flex gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
                  {t}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className="mt-10 border-amber-200 bg-amber-50/50">
        <div className="flex items-start gap-3">
          <Flag className="mt-0.5 h-5 w-5 text-amber-700" />
          <div>
            <h3 className="font-display text-lg font-semibold text-stone-900">Report concerns</h3>
            <p className="mt-2 text-sm text-stone-600">
              Use Report on any profile. Admins review open reports in the console. If someone asks
              you to leave the platform immediately or send money, stop and report.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/contact" className="btn-secondary text-sm">
                Contact us
              </Link>
              <Link href="/support" className="btn-secondary text-sm">
                Support tickets
              </Link>
              <Link href="/verification" className="btn-primary text-sm">
                Get verified
              </Link>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
