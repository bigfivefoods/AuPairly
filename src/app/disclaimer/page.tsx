import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, Scale, ShieldOff, Users } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";
import { BRAND } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Platform Disclaimer",
  description:
    "AuPairly platform disclaimer — we are not liable for how users use the site or for arrangements between members.",
};

export default function DisclaimerPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Legal · Trust & safety"
        title="Platform Disclaimer"
        description="Important limits on AuPairly’s role and liability. Read this before using the marketplace."
      />

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
        <p className="flex items-start gap-2 font-semibold">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          AuPairly does not employ, supervise, or guarantee any user.
        </p>
        <p className="mt-2 text-amber-900/90">
          All introductions, messages, placements, payments between users, childcare,
          caregiving, house sitting, and pet sitting arrangements are{" "}
          <strong>solely between the people involved</strong>. You use the Platform entirely at
          your own risk.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          {
            icon: Users,
            title: "Independent users only",
            body: "Hosts, families, sitters, and caregivers are independent third parties. We do not control their conduct offline or online.",
          },
          {
            icon: ShieldOff,
            title: "No guarantee of safety",
            body: "Verification badges and tools reduce risk but cannot eliminate it. Always do your own checks before inviting anyone into your home or accepting work.",
          },
          {
            icon: Scale,
            title: "You are responsible for the law",
            body: "Labour, immigration, tax, child protection, and housing rules apply to you. We do not give legal advice or ensure compliance.",
          },
          {
            icon: AlertTriangle,
            title: "No liability for user harm",
            body: "We are not liable for injury, loss, theft, abuse, fraud, or disputes arising from how people use the site or meet each other.",
          },
        ].map((x) => (
          <Card key={x.title} className="!p-5">
            <x.icon className="h-5 w-5 text-teal-700" />
            <h3 className="mt-3 font-display text-base font-semibold text-stone-900">{x.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{x.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-6 space-y-4 text-sm leading-relaxed text-stone-600">
        <h2 className="font-display text-lg font-semibold text-stone-900">
          Full disclaimer (binding)
        </h2>
        <p>
          To the fullest extent permitted by applicable law, {BRAND.name} ({BRAND.domain}), its
          owners, operators, affiliates, directors, employees, and agents:
        </p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Provide the Platform solely as a <strong>neutral venue for user-generated profiles
            and communications</strong>, not as a provider of care, employment, or placement
            services;
          </li>
          <li>
            Make <strong>no representation or warranty</strong> regarding any user, listing,
            message, review, verification result, or outcome of any introduction;
          </li>
          <li>
            Accept <strong>no responsibility or liability</strong> for any act, omission, crime,
            negligence, or misconduct of any user or third party, whether online or offline;
          </li>
          <li>
            Accept <strong>no liability</strong> for damages to persons (including children and
            vulnerable adults), animals, property, reputation, or finances arising from use of
            the Platform or arrangements made through it;
          </li>
          <li>
            Limit aggregate liability as set out in our{" "}
            <Link href="/terms" className="font-semibold text-teal-700 hover:underline">
              Terms of Service
            </Link>
            , which form part of this disclaimer by reference.
          </li>
        </ol>
        <p>
          By using AuPairly you acknowledge that you have read this Disclaimer and the Terms of
          Service, understand them, and agree that{" "}
          <strong>
            you will not bring any claim against AuPairly arising from other users&apos; use of the
            Platform or from any care, sitting, or household arrangement
          </strong>
          , except to the extent such waiver is prohibited by mandatory law.
        </p>
        <p className="text-xs text-stone-400">
          This page is designed to allocate risk clearly between the Platform and users. It does
          not replace advice from a qualified attorney. Contact:{" "}
          <a href={BRAND.emailHref} className="text-teal-700 hover:underline">
            {BRAND.email}
          </a>
          .
        </p>
      </Card>

      <div className="mt-8 flex flex-wrap gap-3 text-sm">
        <Link href="/terms" className="btn-primary text-sm">
          Read full Terms of Service
        </Link>
        <Link href="/privacy" className="btn-secondary text-sm">
          Privacy (POPIA)
        </Link>
        <Link href="/safety" className="btn-secondary text-sm">
          Safety tips
        </Link>
      </div>
    </div>
  );
}
