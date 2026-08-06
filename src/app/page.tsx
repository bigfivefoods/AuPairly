import { prisma } from "@/lib/prisma";
import { HomeHeroI18n } from "@/components/home-hero-i18n";
import { HomeBodyI18n } from "@/components/home-body-i18n";

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
      <HomeHeroI18n
        stats={{
          aupairs: stats.aupairs || "50+",
          families: stats.families || "40+",
          verified: stats.verified || "90%",
        }}
      />
      <HomeBodyI18n
        featuredAupairs={featuredAupairs}
        featuredFamilies={featuredFamilies}
      />
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
  const verifiedPct =
    total > 0 ? `${Math.round((verified / Math.max(total, 1)) * 100)}%` : "90%";
  return { aupairs, families, verified: verifiedPct };
}
