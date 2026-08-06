import Link from "next/link";
import { ShieldCheck, Eye, MessageCircleWarning, UserCheck, FileCheck } from "lucide-react";
import { PageHeader, Card } from "@/components/ui";

export const metadata = { title: "Safety & verification" };

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Trust center"
        title="Safety & verification"
        description="AuPairly is designed so every introduction starts with identity confidence — not just a nice bio."
      />

      <div className="grid gap-6 sm:grid-cols-2">
        {[
          {
            icon: <UserCheck className="h-6 w-6" />,
            title: "Identity verification",
            body: "Members submit government ID and a live selfie. We match them so the person behind the profile is real.",
          },
          {
            icon: <FileCheck className="h-6 w-6" />,
            title: "Background & references",
            body: "Optional background checks and personal references strengthen profiles and earn stronger trust signals.",
          },
          {
            icon: <Eye className="h-6 w-6" />,
            title: "Privacy-first listings",
            body: "Exact addresses stay private. Families share city and neighborhood only until both parties are ready.",
          },
          {
            icon: <MessageCircleWarning className="h-6 w-6" />,
            title: "In-app messaging",
            body: "Keep early conversations on AuPairly. Never wire money or share sensitive documents off-platform.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              {item.icon}
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.body}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-8 bg-gradient-to-br from-teal-50 to-white">
        <div className="flex items-start gap-4">
          <ShieldCheck className="h-8 w-8 shrink-0 text-teal-600" />
          <div>
            <h3 className="font-display text-xl font-semibold text-stone-900">Get verified today</h3>
            <p className="mt-2 text-stone-600">
              Verified members appear with a green badge and rank higher in search. It takes a few minutes
              and dramatically improves match quality.
            </p>
            <Link href="/verification" className="btn-primary mt-5 inline-flex">
              Start verification
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
