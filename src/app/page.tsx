import Link from "next/link";
import {
  ShieldCheck,
  MessageSquareHeart,
  Search,
  BadgeCheck,
  Globe2,
  HeartHandshake,
  ArrowRight,
  Sparkles,
  Users,
  Home,
  Baby,
  PawPrint,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { SERVICE_LIST } from "@/lib/services";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let featuredAupairs: Awaited<ReturnType<typeof getFeaturedAupairs>> = [];
  let featuredFamilies: Awaited<ReturnType<typeof getFeaturedFamilies>> = [];
  let stats: { aupairs: number; families: number; verified: string | number } = {
    aupairs: 0,
    families: 0,
    verified: 0,
  };

  try {
    [featuredAupairs, featuredFamilies, stats] = await Promise.all([
      getFeaturedAupairs(),
      getFeaturedFamilies(),
      getStats(),
    ]);
  } catch {
    // DB may be empty before seed
  }

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-orange-400 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-teal-400 blur-3xl" />
        </div>
        <div className="grain relative">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-teal-50 backdrop-blur">
                <Sparkles className="h-4 w-4 text-amber-300" />
                {BRAND.name} · family · home · pets
              </div>
              <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Trusted care for your
                <span className="block text-teal-200">
                  family, loved ones, home &amp; pets.
                </span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-teal-100/90">
                <strong className="font-semibold text-white">{BRAND.domain}</strong> — childcare,
                caregiving, house sitting, and pet sitting under one trusted brand. One account.
                Verified people. Match, message, and place with confidence.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/register?role=PARENT" className="btn-accent text-base !px-8 !py-3.5">
                  I need help
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/register?role=AUPAIR"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/20"
                >
                  I offer services
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-teal-100 transition hover:bg-white/10"
                >
                  See plans
                </Link>
              </div>
              <div className="mt-14 grid grid-cols-3 gap-4 border-t border-white/10 pt-10 text-center">
                <Stat value={stats.aupairs || "50+"} label="Sitters" />
                <Stat value={stats.families || "40+"} label="Hosts" />
                <Stat value={stats.verified || "90%"} label="Verified" suffix={typeof stats.verified === "number" && stats.verified > 0 ? "" : ""} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Three services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            {BRAND.tagline}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Four kinds of care. One AuPairly.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-500">
            Book or offer childcare, caregiving, house sitting, and pet sitting — on the same
            trusted marketplace.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {SERVICE_LIST.map((s) => {
            const Icon =
              s.icon === "baby"
                ? Baby
                : s.icon === "heart"
                  ? HeartHandshake
                  : s.icon === "home"
                    ? Home
                    : PawPrint;
            return (
              <Link
                key={s.id}
                href={`/${s.slug}`}
                className={`group flex h-full min-h-0 flex-col rounded-3xl border-2 p-5 transition hover:shadow-lg sm:p-5 ${s.bg}`}
              >
                <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${s.color}`} />
                <h3 className={`mt-3 font-display text-lg font-semibold sm:text-xl ${s.color}`}>
                  {s.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {s.description}
                </p>
                <p className="mt-2 text-[11px] font-medium leading-snug text-stone-500">
                  {s.examples.slice(0, 4).join(" · ")}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 transition-all group-hover:gap-2">
                  Open {s.shortName.toLowerCase()} <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">
          Or{" "}
          <Link href="/browse/aupairs" className="font-semibold text-teal-700 hover:underline">
            search all sitters
          </Link>{" "}
          across every category.
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Simple & safe</p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            How AuPairly works
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-500">
            From registration to your first booking conversation — designed for trust.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            icon={<Users className="h-6 w-6" />}
            step="01"
            title="Create your profile"
            desc="Sign up as a host or sitter. Pick childcare, caregiving, house sitting, pet sitting — or mix."
          />
          <Step
            icon={<BadgeCheck className="h-6 w-6" />}
            step="02"
            title="Verify yourself"
            desc="Complete ID, selfie, and reference checks so everyone can trust the match."
          />
          <Step
            icon={<Search className="h-6 w-6" />}
            step="03"
            title="Discover & swipe"
            desc="Filter by service and location. Mutual likes open a chat instantly."
          />
          <Step
            icon={<MessageSquareHeart className="h-6 w-6" />}
            step="04"
            title="Message or upgrade"
            desc="Free tier to try. Plus unlocks unlimited messages, interests, and boosts."
          />
        </div>
      </section>

      {/* Dual audience */}
      <section className="bg-white border-y border-stone-200/80">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="border-b border-stone-200 p-10 sm:p-14 lg:border-b-0 lg:border-r">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">For hosts</h3>
            <p className="mt-3 text-stone-500 leading-relaxed">
              Need childcare, a caregiver, a house sitter, or pet care? Post once, choose your
              categories, and message verified sitters.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-600" /> Host verification badge</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-600" /> Filter by service, location & skills</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-600" /> Private messaging & placements</li>
            </ul>
            <Link href="/register?role=PARENT" className="btn-primary mt-8">
              Post what I need
            </Link>
          </div>
          <div className="p-10 sm:p-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Globe2 className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">For sitters</h3>
            <p className="mt-3 text-stone-500 leading-relaxed">
              Offer childcare, caregiving, house sitting, pet sitting — or stack several on one
              profile. Get verified and connect with hosts worldwide.
            </p>
            <ul className="mt-6 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Identity & reference checks</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Multi-service profile</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-orange-500" /> Global hosts & local gigs</li>
            </ul>
            <Link href="/register?role=AUPAIR" className="btn-accent mt-8">
              Create sitter profile
            </Link>
          </div>
        </div>
      </section>

      {/* Featured sitters */}
      {featuredAupairs.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Featured</p>
              <h2 className="mt-1 font-display text-3xl font-semibold text-stone-900">Sitters ready to connect</h2>
            </div>
            <Link href="/browse/aupairs" className="hidden text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAupairs.map((a) => (
              <AuPairCard
                key={a.id}
                id={a.id}
                name={a.user.name}
                image={a.user.image}
                headline={a.headline}
                city={a.city}
                country={a.country}
                nationality={a.nationality}
                languages={a.languages}
                experienceYears={a.experienceYears}
                age={a.age}
                isVerified={a.isVerified}
                rating={a.rating}
                reviewCount={a.reviewCount}
                pocketMoneyMin={a.pocketMoneyMin}
                availableFrom={a.availableFrom}
                weeklyHours={a.weeklyHours}
                scheduleJson={a.scheduleJson}
                services={a.services}
              />
            ))}
          </div>
        </section>
      )}

      {/* Featured hosts */}
      {featuredFamilies.length > 0 && (
        <section className="bg-stone-50/80 border-y border-stone-200/60">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">Featured</p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-stone-900">Hosts looking for help</h2>
              </div>
              <Link href="/browse/families" className="hidden text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex items-center gap-1">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredFamilies.map((f) => (
                <FamilyCard
                  key={f.id}
                  id={f.id}
                  name={f.user.name}
                  familyName={f.familyName}
                  image={f.user.image}
                  headline={f.headline}
                  city={f.city}
                  country={f.country}
                  childrenCount={f.childrenCount}
                  childrenAges={f.childrenAges}
                  isVerified={f.isVerified}
                  rating={f.rating}
                  reviewCount={f.reviewCount}
                  pocketMoney={f.pocketMoney}
                  startDate={f.startDate}
                  weeklyHours={f.weeklyHours}
                  languages={f.languages}
                  scheduleJson={f.scheduleJson}
                  services={f.services}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-teal-950 px-8 py-14 text-center sm:px-14">
          <HeartHandshake className="mx-auto h-10 w-10 text-teal-300" />
          <h2 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            {BRAND.tagline}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-stone-300">
            Built on trust, not just profiles. Every member can complete multi-step verification —
            ID, selfie match, background check, and references — so you always know who you&apos;re
            talking to.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/safety" className="btn-secondary">
              Learn about safety
            </Link>
            <Link href="/discover" className="btn-secondary">
              Open Discover
            </Link>
            <Link href="/pricing" className="btn-primary">
              Start free · upgrade anytime
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string; suffix?: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold text-white sm:text-3xl">{value}</div>
      <div className="mt-1 text-sm text-teal-200/80">{label}</div>
    </div>
  );
}

function Step({
  icon,
  step,
  title,
  desc,
}: {
  icon: React.ReactNode;
  step: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="relative rounded-2xl border border-stone-200/80 bg-white p-6 shadow-[var(--shadow)]">
      <div className="flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {icon}
        </div>
        <span className="font-display text-2xl font-semibold text-stone-200">{step}</span>
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-500">{desc}</p>
    </div>
  );
}

async function getFeaturedAupairs() {
  return prisma.auPairProfile.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ isFeatured: "desc" }, { isVerified: "desc" }, { rating: "desc" }],
    take: 3,
  });
}

async function getFeaturedFamilies() {
  return prisma.familyProfile.findMany({
    where: { status: "ACTIVE" },
    include: { user: { select: { name: true, image: true } } },
    orderBy: [{ isFeatured: "desc" }, { isVerified: "desc" }, { rating: "desc" }],
    take: 3,
  });
}

async function getStats() {
  const [aupairs, families, verifiedA, verifiedF] = await Promise.all([
    prisma.auPairProfile.count({ where: { status: "ACTIVE" } }),
    prisma.familyProfile.count({ where: { status: "ACTIVE" } }),
    prisma.auPairProfile.count({ where: { isVerified: true } }),
    prisma.familyProfile.count({ where: { isVerified: true } }),
  ]);
  const total = aupairs + families;
  const verified = verifiedA + verifiedF;
  return {
    aupairs,
    families,
    verified: total > 0 ? `${Math.round((verified / total) * 100)}%` : "—",
  };
}
