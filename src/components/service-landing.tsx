import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BadgeCheck,
  HeartHandshake,
  Home,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AuPairCard, FamilyCard } from "@/components/listing-cards";
import { CategoryTabs } from "@/components/category-tabs";
import { PageHeader } from "@/components/ui";
import { SERVICE_LIST, SERVICES, type ServiceId } from "@/lib/services";
import { Suspense } from "react";

const ICONS = {
  baby: Baby,
  heart: HeartHandshake,
  home: Home,
  paw: PawPrint,
} as const;

export async function ServiceLanding({ serviceId }: { serviceId: ServiceId }) {
  const s = SERVICES[serviceId];
  const Icon = ICONS[s.icon];

  const [sitters, hosts] = await Promise.all([
    prisma.auPairProfile.findMany({
      where: { status: "ACTIVE", services: { contains: serviceId } },
      include: { user: { select: { name: true, image: true } } },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take: 6,
    }),
    prisma.familyProfile.findMany({
      where: { status: "ACTIVE", services: { contains: serviceId } },
      include: { user: { select: { name: true, image: true } } },
      orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
      take: 6,
    }),
  ]);

  return (
    <div>
      <section className={`border-b ${s.bg}`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Suspense fallback={null}>
            <CategoryTabs mode="landing" side="sitters" activeService={serviceId} />
          </Suspense>
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-white ${s.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <PageHeader
                  eyebrow="Trusted care for your family, home & pets"
                  title={s.seoTitle}
                  description={s.description}
                />
              </div>
              <ul className="mt-4 flex flex-wrap gap-2">
                {s.examples.map((ex) => (
                  <li
                    key={ex}
                    className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs font-medium text-stone-700 shadow-sm"
                  >
                    {ex}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-stone-600">
                Part of one trusted marketplace:{" "}
                {SERVICE_LIST.map((x, i) => (
                  <span key={x.id}>
                    {i > 0 ? ", " : ""}
                    <Link
                      href={`/${x.slug}`}
                      className="font-semibold text-teal-800 hover:underline"
                    >
                      {x.shortName}
                    </Link>
                  </span>
                ))}
                . Sitters can offer multiple services on a single profile.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/browse/aupairs?service=${serviceId}`}
                className="btn-primary"
              >
                Find sitters
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/browse/families?service=${serviceId}`}
                className="btn-secondary"
              >
                Find hosts
              </Link>
              <Link href="/register" className="btn-secondary">
                Join free
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              t: "Verified people",
              d: "ID, selfie, and reference checks so you know who you’re matching with.",
            },
            {
              icon: BadgeCheck,
              t: "One profile, multi-service",
              d: "Sitters list childcare, house sitting, and/or pets without separate accounts.",
            },
            {
              icon: Icon,
              t: s.tagline,
              d: "Search only this category — or switch tabs anytime to browse all of AuPairly.",
            },
          ].map((x) => (
            <div
              key={x.t}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <x.icon className={`h-5 w-5 ${s.color}`} />
              <p className="mt-3 font-semibold text-stone-900">{x.t}</p>
              <p className="mt-1 text-sm text-stone-500">{x.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Sitters for {s.shortName.toLowerCase()}
          </h2>
          <Link
            href={`/browse/aupairs?service=${serviceId}`}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        {sitters.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
            No active sitters listed for this service yet.{" "}
            <Link href="/register?role=AUPAIR" className="font-semibold text-teal-700">
              Be the first
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sitters.map((a) => (
              <AuPairCard
                key={a.id}
                id={a.id}
                name={a.user.name}
                image={a.user.image}
                headline={a.headline}
                city={a.city}
                region={a.region}
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
        )}

        <div className="mb-6 mt-16 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Hosts needing {s.shortName.toLowerCase()}
          </h2>
          <Link
            href={`/browse/families?service=${serviceId}`}
            className="text-sm font-semibold text-teal-700 hover:underline"
          >
            View all →
          </Link>
        </div>
        {hosts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-6 py-10 text-center text-sm text-stone-500">
            No host listings for this service yet.{" "}
            <Link href="/register?role=PARENT" className="font-semibold text-teal-700">
              Post a request
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hosts.map((f) => (
              <FamilyCard
                key={f.id}
                id={f.id}
                name={f.user.name}
                familyName={f.familyName}
                image={f.user.image}
                headline={f.headline}
                city={f.city}
                region={f.region}
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
        )}
      </section>
    </div>
  );
}
