import Link from "next/link";
import { BadgeCheck, Search, MessageSquare, Handshake, Shield } from "lucide-react";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "How it works" };

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Guide"
        title="How AuPairly works"
        description="A clear path from signup to a successful match — for parents and au pairs."
      />

      <div className="space-y-8">
        {[
          {
            icon: <Handshake className="h-6 w-6" />,
            title: "1. Choose your role",
            body: "Sign up as a parent (host family) or as an au pair. Your role shapes your profile, listing, and browse experience.",
          },
          {
            icon: <BadgeCheck className="h-6 w-6" />,
            title: "2. Build & verify your profile",
            body: "Add photos, bio, languages, children or experience details. Complete verification steps (ID, selfie, references) to earn a Verified badge that builds trust.",
          },
          {
            icon: <Search className="h-6 w-6" />,
            title: "3. Browse the marketplace",
            body: "Filter by country, languages, dates, and lifestyle. Save favorites and open rich profile pages with everything you need to decide.",
          },
          {
            icon: <MessageSquare className="h-6 w-6" />,
            title: "4. Message securely",
            body: "Start a conversation in-app. Share schedules, pocket money expectations, and cultural fit before committing.",
          },
          {
            icon: <Shield className="h-6 w-6" />,
            title: "5. Match with confidence",
            body: "Agree on terms privately. Keep communication on AuPairly for safety. Report anything that feels off — our community standards protect both sides.",
          },
        ].map((item) => (
          <div key={item.title} className="flex gap-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-[var(--shadow)]">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              {item.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-stone-900">{item.title}</h2>
              <p className="mt-2 text-stone-500 leading-relaxed">{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap justify-center gap-3">
        <Link href="/register?role=PARENT" className="btn-primary">
          Join as a parent
        </Link>
        <Link href="/register?role=AUPAIR" className="btn-accent">
          Join as an au pair
        </Link>
      </div>
    </div>
  );
}
