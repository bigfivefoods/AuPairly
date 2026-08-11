"use client";

import Link from "next/link";
import {
  ShieldCheck,
  MessageSquareHeart,
  Search,
  BadgeCheck,
  Globe2,
  HeartHandshake,
  ArrowRight,
  ArrowLeftRight,
  Users,
  Home,
  Baby,
  BookOpen,
  PawPrint,
} from "lucide-react";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { SocialFollowStrip } from "@/components/social-follow-strip";
import { SERVICE_LIST } from "@/lib/services";
import { useI18n } from "@/components/i18n-provider";
import { serviceLabel } from "@/lib/i18n/service-label";

const SERVICE_ICONS = {
  baby: Baby,
  book: BookOpen,
  heart: HeartHandshake,
  home: Home,
  swap: ArrowLeftRight,
  paw: PawPrint,
} as const;

/* eslint-disable @typescript-eslint/no-explicit-any -- Prisma rows → listing cards */
export function HomeBodyI18n({
  featuredAupairs,
  featuredFamilies,
}: {
  featuredAupairs: any[];
  featuredFamilies: any[];
}) {
  const { t, dict, locale } = useI18n();

  return (
    <div data-locale={locale}>
      {/* All services */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 sm:text-sm">
            {t("brand_tagline")}
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-4xl">
            {t("home_four_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-stone-500 sm:text-base">
            {t("home_four_sub")}
          </p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
          {SERVICE_LIST.map((s) => {
            const Icon = SERVICE_ICONS[s.icon] || Home;
            const name = serviceLabel(dict, s.id);
            return (
              <Link
                key={s.id}
                href={`/${s.slug}`}
                className={`group flex h-full min-h-0 flex-col rounded-3xl border-2 p-5 transition hover:shadow-lg sm:p-5 ${s.bg}`}
              >
                <Icon className={`h-7 w-7 shrink-0 sm:h-8 sm:w-8 ${s.color}`} />
                <h3 className={`mt-3 font-display text-lg font-semibold sm:text-xl ${s.color}`}>
                  {name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-stone-600">
                  {s.description}
                </p>
                <p className="mt-2 text-[11px] font-medium leading-snug text-stone-500">
                  {s.examples.slice(0, 4).join(" · ")}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal-800 transition-all group-hover:gap-2">
                  {t("home_open_service", { name: name.toLowerCase() })}{" "}
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-6 text-center text-sm text-stone-500">
          {t("home_or")}{" "}
          <Link href="/browse/aupairs" className="font-semibold text-teal-700 hover:underline">
            {t("home_search_all")}
          </Link>{" "}
          {t("home_across")}
        </p>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
            {t("home_simple_safe")}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            {t("home_how_title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-stone-500">{t("home_how_sub")}</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            icon={<Users className="h-6 w-6" />}
            step="01"
            title={t("home_step1_title")}
            desc={t("home_step1_desc")}
          />
          <Step
            icon={<BadgeCheck className="h-6 w-6" />}
            step="02"
            title={t("home_step2_title")}
            desc={t("home_step2_desc")}
          />
          <Step
            icon={<Search className="h-6 w-6" />}
            step="03"
            title={t("home_step3_title")}
            desc={t("home_step3_desc")}
          />
          <Step
            icon={<MessageSquareHeart className="h-6 w-6" />}
            step="04"
            title={t("home_step4_title")}
            desc={t("home_step4_desc")}
          />
        </div>
      </section>

      {/* Dual audience */}
      <section className="border-y border-stone-200/80 bg-white">
        <div className="mx-auto grid max-w-7xl lg:grid-cols-2">
          <div className="border-b border-stone-200 p-10 sm:p-14 lg:border-b-0 lg:border-r">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Home className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">
              {t("home_for_hosts_title")}
            </h3>
            <p className="mt-3 leading-relaxed text-stone-500">{t("home_for_hosts_body")}</p>
            <ul className="mt-6 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> {t("home_for_hosts_b1")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> {t("home_for_hosts_b2")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-teal-600" /> {t("home_for_hosts_b3")}
              </li>
            </ul>
            <Link href="/register?role=PARENT" className="btn-primary mt-8">
              {t("home_for_hosts_cta")}
            </Link>
          </div>
          <div className="p-10 sm:p-14">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Globe2 className="h-6 w-6" />
            </div>
            <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">
              {t("home_for_sitters_title")}
            </h3>
            <p className="mt-3 leading-relaxed text-stone-500">{t("home_for_sitters_body")}</p>
            <ul className="mt-6 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> {t("home_for_sitters_b1")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> {t("home_for_sitters_b2")}
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> {t("home_for_sitters_b3")}
              </li>
            </ul>
            <Link href="/register?role=AUPAIR" className="btn-accent mt-8">
              {t("home_for_sitters_cta")}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured sitters — or invite first listings when empty */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
              {t("home_featured")}
            </p>
            <h2 className="mt-1 font-display text-3xl font-semibold text-stone-900">
              {t("home_featured_sitters")}
            </h2>
          </div>
          <Link
            href="/browse/aupairs"
            className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex"
          >
            {t("home_view_all")} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {featuredAupairs.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredAupairs.map((a) => (
              <AuPairCard
                key={a.id}
                id={a.id}
                name={a.user.name}
                image={a.user.image}
                coverImage={a.coverImage}
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
        ) : (
          <div className="rounded-3xl border border-dashed border-teal-200 bg-gradient-to-br from-teal-50 to-white px-6 py-12 text-center">
            <p className="font-display text-xl font-semibold text-stone-900">
              Be among the first verified sitters
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
              New marketplace — publish your listing, get verified, and meet hosts (and friends via
              AuPair Connect when you&apos;re abroad).
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Link href="/register?role=AUPAIR" className="btn-primary">
                Join as a sitter
              </Link>
              <Link href="/how-it-works" className="btn-secondary">
                How it works
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Featured hosts */}
      {featuredFamilies.length > 0 && (
        <section className="border-y border-stone-200/60 bg-stone-50/80">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
                  {t("home_featured")}
                </p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-stone-900">
                  {t("home_featured_hosts")}
                </h2>
              </div>
              <Link
                href="/browse/families"
                className="hidden items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-800 sm:inline-flex"
              >
                {t("home_view_all")} <ArrowRight className="h-4 w-4" />
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

      {/* Focus cities — density first */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Growing city by city
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Start where the community is densest
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-stone-500">
            Join free in these focus cities — more sitters and hosts nearby means faster matches
            and AuPair Connect friends.
          </p>
        </div>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { city: "Cape Town", q: "Cape Town", country: "South Africa" },
            { city: "Johannesburg", q: "Johannesburg", country: "South Africa" },
            { city: "Durban", q: "Durban", country: "South Africa" },
          ].map((c) => (
            <Link
              key={c.city}
              href={`/browse/aupairs?city=${encodeURIComponent(c.q)}&country=${encodeURIComponent(c.country)}`}
              className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm transition hover:border-teal-300 hover:shadow-md"
            >
              <p className="font-display text-lg font-semibold text-stone-900">{c.city}</p>
              <p className="mt-1 text-xs text-stone-500">{c.country} · Browse sitters</p>
            </Link>
          ))}
        </div>
      </section>

      <SocialFollowStrip />

      {/* Trust */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-stone-900 to-teal-950 px-8 py-14 text-center sm:px-14">
          <HeartHandshake className="mx-auto h-10 w-10 text-teal-300" />
          <h2 className="mt-5 font-display text-3xl font-semibold text-white sm:text-4xl">
            {t("brand_tagline")}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-stone-300">{t("home_trust_body")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/safety" className="btn-secondary">
              {t("home_learn_safety")}
            </Link>
            <Link href="/discover" className="btn-secondary">
              {t("home_open_discover")}
            </Link>
            <Link href="/pricing" className="btn-primary">
              {t("home_start_free")}
            </Link>
          </div>
        </div>
      </section>
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
