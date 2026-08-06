import Link from "next/link";
import { PageHeader, Card } from "@/components/ui";

const GUIDES = [
  {
    title: "Cape Town host families",
    body: "Neighbourhoods, transport, and what au pairs love about the Mother City.",
  },
  {
    title: "Johannesburg & Pretoria",
    body: "Safety tips, school calendars, and suburb fit for live-in arrangements.",
  },
  {
    title: "Durban & coast",
    body: "Climate, languages, and summer availability peaks.",
  },
  {
    title: "Visas & cultural exchange (overview)",
    body: "Not legal advice — checklist of questions to ask immigration advisors before you travel.",
  },
  {
    title: "Pocket money norms in ZA",
    body: "Typical weekly ranges and what “all inclusive” usually covers.",
  },
  {
    title: "First week checklist",
    body: "House rules, emergency contacts, Wi‑Fi, and settling in.",
  },
];

export const metadata = { title: "Guides" };

export default function GuidesPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Community"
        title="Guides for South Africa & beyond"
        description="Practical notes for families and au pairs — seeded for Cape Town, Joburg, Durban, Pretoria."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <Card key={g.title}>
            <h3 className="font-display text-lg font-semibold">{g.title}</h3>
            <p className="mt-2 text-sm text-stone-500 leading-relaxed">{g.body}</p>
          </Card>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-stone-400">
        Also read our{" "}
        <Link href="/safety" className="text-teal-700 font-medium hover:underline">
          safety
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-teal-700 font-medium hover:underline">
          privacy (POPIA)
        </Link>{" "}
        pages.
      </p>
    </div>
  );
}
