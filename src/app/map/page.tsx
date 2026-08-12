import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { MapBrowse } from "@/components/map-browse";
import { serviceFromParam, SERVICES, type ServiceId } from "@/lib/services";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map & regions" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string; service?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type === "families" ? "families" : "aupairs";
  const serviceRaw = serviceFromParam(sp.service);
  const service: ServiceId | null = serviceRaw || null;

  type Listing = {
    id: string;
    city: string | null;
    region: string | null;
    country: string | null;
    name: string;
    href: string;
    subtitle?: string;
    userId?: string | null;
    connectMode?: "peer" | "interest" | "profile";
  };

  let listings: Listing[] = [];

  try {
    if (type === "families") {
      const families = await prisma.familyProfile.findMany({
        where: {
          status: "ACTIVE",
          ...(service ? { services: { contains: service } } : {}),
        },
        include: { user: { select: { id: true, name: true } } },
        take: 300,
      });
      listings = families.map((f) => ({
        id: f.id,
        city: f.city,
        region: f.region,
        country: f.country,
        name: f.familyName || f.user.name || "Host family",
        href: `/browse/families/${f.id}`,
        subtitle: f.headline || undefined,
        userId: f.user.id,
        connectMode: "interest" as const,
      }));
    } else {
      const aupairs = await prisma.auPairProfile.findMany({
        where: {
          status: "ACTIVE",
          ...(service ? { services: { contains: service } } : {}),
        },
        include: { user: { select: { id: true, name: true } } },
        take: 300,
      });
      listings = aupairs.map((a) => ({
        id: a.id,
        city: a.city,
        region: a.region,
        country: a.country,
        name: a.user.name || "Sitter",
        href: `/browse/aupairs/${a.id}`,
        subtitle: a.headline || undefined,
        userId: a.user.id,
        connectMode: "peer" as const,
      }));
    }
  } catch (e) {
    console.error("[map] load failed", e);
  }

  return (
    <Shell type={type} service={service}>
      <MapBrowse
        listings={listings}
        typeLabel={type === "families" ? "host family" : "au pair / sitter"}
        type={type}
      />
    </Shell>
  );
}

function Shell({
  type,
  service,
  children,
}: {
  type: string;
  service?: ServiceId | null;
  children: React.ReactNode;
}) {
  const base = type === "families" ? "families" : "aupairs";
  const q = (svc?: string | null) => {
    const p = new URLSearchParams({ type: base });
    if (svc) p.set("service", svc);
    return `/map?${p.toString()}`;
  };
  const serviceOpts = Object.values(SERVICES);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Explore"
        title="Map & regions"
        description="Property24-style browse: pick a region, open the map tab, and 👋 wave to connect. Pins are city centres only — never exact home addresses."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link
          href={`/map?type=aupairs${service ? `&service=${service}` : ""}`}
          className={
            type !== "families"
              ? "btn-primary !py-2 !px-4 text-sm"
              : "btn-secondary !py-2 !px-4 text-sm"
          }
        >
          Au pairs & sitters
        </Link>
        <Link
          href={`/map?type=families${service ? `&service=${service}` : ""}`}
          className={
            type === "families"
              ? "btn-primary !py-2 !px-4 text-sm"
              : "btn-secondary !py-2 !px-4 text-sm"
          }
        >
          Host families
        </Link>
        <Link href="/community" className="btn-ghost text-sm font-semibold text-stone-600">
          AuPair Connect →
        </Link>
      </div>
      <div className="mb-6 flex flex-wrap gap-1.5">
        <Link
          href={q(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            !service
              ? "bg-teal-700 text-white"
              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All services
        </Link>
        {serviceOpts.map((s) => (
          <Link
            key={s.id}
            href={q(s.id)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              service === s.id
                ? "bg-teal-700 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {s.shortName}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
