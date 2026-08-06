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
import { PageHeader } from "@/components/ui";
import { SERVICE_LIST, SERVICES, type ServiceId } from "@/lib/services";
import { profileIdsForService } from "@/lib/service-tags";

const ICONS = {
  baby: Baby,
  heart: HeartHandshake,
  home: Home,
  paw: PawPrint,
} as const;

type SitterRow = Awaited<
  ReturnType<
    typeof prisma.auPairProfile.findMany<{
      include: { user: { select: { name: true; image: true } } };
    }>
  >
>;
type HostRow = Awaited<
  ReturnType<
    typeof prisma.familyProfile.findMany<{
      include: { user: { select: { name: true; image: true } } };
    }>
  >
>;

async function loadListings(serviceId: ServiceId): Promise<{
  sitters: SitterRow;
  hosts: HostRow;
  dbOk: boolean;
}> {
  try {
    const [sitterTagIds, hostTagIds] = await Promise.all([
      profileIdsForService("AUPAIR", serviceId),
      profileIdsForService("FAMILY", serviceId),
    ]);

    const sitterWhere =
      sitterTagIds.length > 0
        ? {
            status: "ACTIVE" as const,
            OR: [{ id: { in: sitterTagIds } }, { services: { contains: serviceId } }],
          }
        : { status: "ACTIVE" as const, services: { contains: serviceId } };

    const hostWhere =
      hostTagIds.length > 0
        ? {
            status: "ACTIVE" as const,
            OR: [{ id: { in: hostTagIds } }, { services: { contains: serviceId } }],
          }
        : { status: "ACTIVE" as const, services: { contains: serviceId } };

    const [sitters, hosts] = await Promise.all([
      prisma.auPairProfile.findMany({
        where: sitterWhere,
        include: { user: { select: { name: true, image: true } } },
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
        take: 6,
      }),
      prisma.familyProfile.findMany({
        where: hostWhere,
        include: { user: { select: { name: true, image: true } } },
        orderBy: [{ isVerified: "desc" }, { rating: "desc" }],
        take: 6,
      }),
    ]);
    return { sitters, hosts, dbOk: true };
  } catch (e) {
    console.error("[service-landing] loadListings failed", serviceId, e);
    return { sitters: [], hosts: [], dbOk: false };
  }
}

export async function ServiceLanding({ serviceId }: { serviceId: ServiceId }) {
  const s = SERVICES[serviceId];
  const Icon = ICONS[s.icon];
  const { sitters, hosts, dbOk } = await loadListings(serviceId);

  return (
    <div>
      <section className={`border-b ${s.bg}`}>
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl border bg-white ${s.color}`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4">
                <PageHeader
                  eyebrow="Trusted care for your family, loved ones, home & pets"
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
              <Link href={`/browse/aupairs?service=${serviceId}`} className="btn-primary btn-inline">
                Find sitters
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={`/browse/families?service=${serviceId}`}
                className="btn-secondary btn-inline"
              >
                Find hosts
              </Link>
              <Link href="/register" className="btn-secondary btn-inline">
                Join free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {!dbOk && (
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Listings are temporarily unavailable (database not configured on this
            environment). Marketing pages still work — set{" "}
            <code className="rounded bg-white px-1">DATABASE_URL</code> on Vercel to show live
            sitters and hosts.
          </div>
        </div>
      )}

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
            {sitters.map((p) => (
              <AuPairCard
                key={p.id}
                id={p.id}
                name={p.user.name}
                image={p.user.image}
                headline={p.headline}
                city={p.city}
                region={p.region}
                country={p.country}
                languages={p.languages}
                experienceYears={p.experienceYears}
                age={p.age}
                isVerified={p.isVerified}
                rating={p.rating}
                reviewCount={p.reviewCount}
                pocketMoneyMin={p.pocketMoneyMin}
                availableFrom={p.availableFrom}
                weeklyHours={p.weeklyHours}
                scheduleJson={p.scheduleJson}
                services={p.services}
              />
            ))}
          </div>
        )}

        <div className="mb-6 mt-14 flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Hosts looking for {s.shortName.toLowerCase()}
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
            No active hosts yet.{" "}
            <Link href="/register?role=PARENT" className="font-semibold text-teal-700">
              Post what you need
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {hosts.map((p) => (
              <FamilyCard
                key={p.id}
                id={p.id}
                name={p.user.name}
                familyName={p.familyName}
                image={p.user.image}
                headline={p.headline}
                city={p.city}
                region={p.region}
                country={p.country}
                childrenCount={p.childrenCount}
                childrenAges={p.childrenAges}
                isVerified={p.isVerified}
                rating={p.rating}
                reviewCount={p.reviewCount}
                pocketMoney={p.pocketMoney}
                startDate={p.startDate}
                weeklyHours={p.weeklyHours}
                languages={p.languages}
                scheduleJson={p.scheduleJson}
                services={p.services}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
