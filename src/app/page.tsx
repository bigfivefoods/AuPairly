import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { HomeHeroI18n } from "@/components/home-hero-i18n";
import { HomeBodyI18n } from "@/components/home-body-i18n";
import { HomepageReviews } from "@/components/homepage-reviews";
import { HomeCityStrip } from "@/components/home-city-strip";
import { JsonLd } from "@/components/json-ld";
import { BRAND } from "@/lib/brand";
import { topCitiesByDensity } from "@/lib/city-density";
import {
  buildPageMetadata,
  faqJsonLd,
  organizationJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

/** Public marketing — revalidate periodically (was force-dynamic). */
export const revalidate = 300;

export const metadata: Metadata = buildPageMetadata({
  title: BRAND.ogTitle,
  description: `${BRAND.tagline} Find verified au pairs, tutors, caregivers, house sitters, house swaps, and dog/pet sitters worldwide. One account for every kind of care.`,
  path: "/",
  keywords: [
    "find au pair",
    "hire babysitter",
    "find tutor",
    "elderly caregiver",
    "house sitter near me",
    "house swap South Africa",
    "dog sitter marketplace",
  ],
});

const HOME_FAQS = [
  {
    question: "What is AuPairly?",
    answer:
      "AuPairly is a global marketplace connecting families and hosts with verified au pairs, tutors, caregivers, house sitters, house-swap partners, and dog/pet sitters — one account for every care category.",
  },
  {
    question: "Is AuPairly only for au pairs?",
    answer:
      "No. AuPairly covers childcare/au pairs, tutoring, caregiving for adults and the elderly, house sitting, house swap (mutual home exchange), and dog/pet sitting worldwide.",
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
  {
    question: "Where does AuPairly work?",
    answer:
      "Worldwide. South Africa is a launch focus (Cape Town, Johannesburg, Pretoria, Durban and more), with hosts and sitters listing globally.",
  },
  {
    question: "What services can I list?",
    answer:
      "Au pair / childcare, tutoring, caregiving, house sitting, house swap (hosts), and dog/pet sitting — combine services on one profile.",
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
  let reviews: {
    id: string;
    rating: number;
    body: string;
    fromName: string;
    createdAt: string;
  }[] = [];
  let topCities: { city: string; sitters: number; hosts: number; total: number }[] =
    [];

  try {
    [featuredAupairs, featuredFamilies, stats, reviews, topCities] =
      await Promise.all([
        getFeaturedAupairs(),
        getFeaturedFamilies(),
        getStats(),
        getPublicReviews(),
        topCitiesByDensity(6),
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
          softwareApplicationJsonLd(),
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
      <HomeCityStrip cities={topCities} />
      <HomeBodyI18n
        featuredAupairs={featuredAupairs}
        featuredFamilies={featuredFamilies}
      />
      <HomepageReviews reviews={reviews} />
    </div>
  );
}

async function getPublicReviews() {
  const rows = await prisma.review.findMany({
    where: {
      publishedAt: { not: null },
      comment: { not: null },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 12,
    include: {
      author: { select: { name: true } },
    },
  });
  return rows
    .filter((r) => r.comment && r.comment.trim().length > 12)
    .slice(0, 6)
    .map((r) => ({
      id: r.id,
      rating: r.rating ?? 5,
      body: r.comment!.slice(0, 280),
      fromName: r.author?.name?.split(" ")[0] || "Member",
      createdAt: (r.publishedAt || r.createdAt).toISOString(),
    }));
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
