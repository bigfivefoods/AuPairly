import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { MapBrowse } from "@/components/map-browse";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map & regions" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; region?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type === "families" ? "families" : "aupairs";

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
        where: { status: "ACTIVE" },
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
        where: { status: "ACTIVE" },
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
    <Shell type={type}>
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
  children,
}: {
  type: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Explore"
        title="Map & regions"
        description="Property24-style browse: pick a region, open the map tab, and 👋 wave to connect. Pins are city centres only — never exact home addresses."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/map?type=aupairs"
          className={
            type !== "families"
              ? "btn-primary !py-2 !px-4 text-sm"
              : "btn-secondary !py-2 !px-4 text-sm"
          }
        >
          Au pairs & sitters
        </Link>
        <Link
          href="/map?type=families"
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
      {children}
    </div>
  );
}
