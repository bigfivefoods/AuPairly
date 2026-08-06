import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui";
import { MapBrowse } from "@/components/map-browse";

export const dynamic = "force-dynamic";
export const metadata = { title: "Map browse" };

export default async function MapPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const sp = await searchParams;
  const type = sp.type === "families" ? "families" : "aupairs";

  type Listing = {
    id: string;
    city: string | null;
    country: string | null;
    name: string;
    href: string;
    subtitle?: string;
  };

  let listings: Listing[] = [];

  try {
    if (type === "families") {
      const families = await prisma.familyProfile.findMany({
        where: { status: "ACTIVE" },
        include: { user: { select: { name: true } } },
        take: 200,
      });
      listings = families.map((f) => ({
        id: f.id,
        city: f.city,
        country: f.country,
        name: f.familyName || f.user.name || "Family",
        href: `/browse/families/${f.id}`,
        subtitle: f.headline || undefined,
      }));
    } else {
      const aupairs = await prisma.auPairProfile.findMany({
        where: { status: "ACTIVE" },
        include: { user: { select: { name: true } } },
        take: 200,
      });
      listings = aupairs.map((a) => ({
        id: a.id,
        city: a.city,
        country: a.country,
        name: a.user.name || "Sitter",
        href: `/browse/aupairs/${a.id}`,
        subtitle: a.headline || undefined,
      }));
    }
  } catch (e) {
    console.error("[map] load failed", e);
  }

  return (
    <Shell type={type}>
      <MapBrowse
        listings={listings}
        typeLabel={type === "families" ? "family" : "au pair"}
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
        title="Browse on the map"
        description="Pins are city centres only — we never show exact home addresses. Tap a pin to see listings."
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
          Au pairs
        </Link>
        <Link
          href="/map?type=families"
          className={
            type === "families"
              ? "btn-primary !py-2 !px-4 text-sm"
              : "btn-secondary !py-2 !px-4 text-sm"
          }
        >
          Families
        </Link>
        <Link href="/browse/aupairs" className="btn-ghost text-sm font-semibold text-stone-600">
          List view →
        </Link>
      </div>
      {children}
    </div>
  );
}
