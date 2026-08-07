import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { HomeHeroI18n } from "@/components/home-hero-i18n";
import { HomeBodyI18n } from "@/components/home-body-i18n";
import { JsonLd } from "@/components/json-ld";
import { BRAND } from "@/lib/brand";
import {
  buildPageMetadata,
  faqJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildPageMetadata({
  title: BRAND.ogTitle,
  description: `${BRAND.tagline} Find verified au pairs, babysitters, caregivers, house sitters, and pet sitters worldwide. One account for childcare, caregiving, house sitting & pet sitting.`,
  path: "/",
  keywords: [
    "find au pair",
    "hire babysitter",
    "elderly caregiver",
    "house sitter near me",
    "pet sitter marketplace",
  ],
});

const HOME_FAQS = [
  {
    question: "What is AuPairly?",
    answer:
      "AuPairly is a global marketplace connecting families and hosts with verified au pairs, babysitters, caregivers, house sitters, and pet sitters — one account for four care categories.",
  },
  {
    question: "Is AuPairly only for au pairs?",
    answer:
      "No. AuPairly covers childcare, caregiving for adults and the elderly, house sitting, and pet sitting worldwide.",
  },
  {
    question: "How does verification work?",
    answer:
      "South African users can verify via VerifyNow (Home Affairs ID). International users can complete Didit document + liveness checks. Verified badges build trust on listings.",
  },
  {
    question: "Is AuPairly free to join?",
    answer:
      "Yes — create a free account to browse and build your profile. Paid plans unlock more messaging, boosts, and free identity checks depending on your plan.",
  },
];

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
      <JsonLd
        data={[
          organizationJsonLd(),
          websiteJsonLd(),
          faqJsonLd(HOME_FAQS),
        ]}
      />
      <HomeHeroI18n
        stats={{
          aupairs: stats.aupairs > 0 ? stats.aupairs : "New",
          families: stats.families > 0 ? stats.families : "Open",
          verified: stats.verified,
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
  // Only show a % when we have enough listings; never invent a fake rate
  const verifiedPct =
    total >= 5
      ? `${Math.round((verified / Math.max(total, 1)) * 100)}%`
      : total > 0
        ? `${verified} verified`
        : "Join free";
  return { aupairs, families, verified: verifiedPct };
}
