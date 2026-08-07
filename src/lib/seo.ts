/**
 * AuPairly SEO foundation — site URL, page metadata builder, JSON-LD helpers.
 */

import type { Metadata } from "next";
import { BRAND } from "@/lib/brand";
import { SERVICE_LIST } from "@/lib/services";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.AUTH_URL ||
  "https://www.aupairly.me"
)
  .trim()
  .replace(/\/$/, "");

/** Prefer production host for public SEO even if env is a preview URL */
export const PUBLIC_SITE_URL =
  SITE_URL.includes("aupairly.me")
    ? SITE_URL.replace("https://aupairly.me", "https://www.aupairly.me")
    : SITE_URL.includes("localhost")
      ? SITE_URL
      : "https://www.aupairly.me";

export const SEO = {
  siteName: BRAND.name,
  domain: "www.aupairly.me",
  defaultTitle: BRAND.ogTitle,
  titleTemplate: `%s · ${BRAND.name}`,
  defaultDescription: `${BRAND.tagline} ${BRAND.description}`,
  /** Primary keyword clusters */
  keywords: [
    "au pair",
    "au pairs",
    "childcare",
    "babysitter",
    "nanny",
    "caregiving",
    "elderly care",
    "house sitting",
    "house sitter",
    "pet sitting",
    "pet sitter",
    "verified care",
    "AuPairly",
    "South Africa au pair",
    "global childcare marketplace",
    "trusted caregiver",
  ],
  locale: "en_US",
  twitter: "@aupairly",
  ogImage: {
    url: "/og-share.png",
    width: 1200,
    height: 630,
    alt: BRAND.ogTitle,
  },
} as const;

/** Public routes that should be indexed (sitemap + robots allow) */
export const PUBLIC_INDEX_PATHS = [
  "/",
  "/pricing",
  "/how-it-works",
  "/safety",
  "/guides",
  "/contact",
  "/browse/aupairs",
  "/browse/families",
  "/map",
  "/childcare",
  "/caregiving",
  "/house-sitting",
  "/pet-sitting",
  "/privacy",
  "/terms",
  "/refunds",
  "/disclaimer",
  "/register",
  "/login",
] as const;

/** Prefixes that must stay out of search indexes */
export const NOINDEX_PREFIXES = [
  "/dashboard",
  "/account",
  "/admin",
  "/messages",
  "/settings",
  "/documents",
  "/billing",
  "/profile",
  "/onboarding",
  "/verification",
  "/applications",
  "/placements",
  "/interests",
  "/shortlist",
  "/matches",
  "/availability",
  "/household",
  "/connect",
  "/boost",
  "/coach",
  "/api",
  "/offline",
] as const;

export function absoluteUrl(path = "/"): string {
  if (path.startsWith("http")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${PUBLIC_SITE_URL}${p}`;
}

export type PageSeoInput = {
  title: string;
  description: string;
  path: string;
  /** Override OG image path */
  image?: string;
  keywords?: string[];
  noIndex?: boolean;
  type?: "website" | "article" | "profile";
};

/**
 * Build Next.js Metadata for a page (title, description, canonical, OG, Twitter).
 */
export function buildPageMetadata(input: PageSeoInput): Metadata {
  const url = absoluteUrl(input.path);
  const image = absoluteUrl(input.image || SEO.ogImage.url);
  const title = input.title;
  const description = input.description.slice(0, 320);
  const keywords = [...SEO.keywords, ...(input.keywords || [])];

  return {
    title,
    description,
    keywords: keywords.slice(0, 40),
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: title.includes(BRAND.name) ? title : `${title} · ${BRAND.name}`,
      description,
      url,
      siteName: SEO.siteName,
      locale: SEO.locale,
      type: input.type === "article" ? "article" : "website",
      images: [
        {
          url: image,
          width: SEO.ogImage.width,
          height: SEO.ogImage.height,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title.includes(BRAND.name) ? title : `${title} · ${BRAND.name}`,
      description,
      site: SEO.twitter,
      images: [image],
    },
    robots: input.noIndex
      ? { index: false, follow: false, googleBot: { index: false, follow: false } }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    legalName: BRAND.name,
    url: PUBLIC_SITE_URL,
    logo: absoluteUrl("/icons/icon-512.png"),
    image: absoluteUrl(SEO.ogImage.url),
    description: BRAND.description,
    email: BRAND.email,
    telephone: BRAND.whatsapp,
    sameAs: [
      BRAND.social.facebook,
      BRAND.social.tiktok,
    ].filter(Boolean),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: BRAND.email,
        telephone: BRAND.whatsapp,
        availableLanguage: [
          "English",
          "Chinese",
          "Hindi",
          "Spanish",
          "French",
          "Arabic",
          "Bengali",
          "Portuguese",
          "German",
        ],
      },
    ],
    areaServed: "Worldwide",
    knowsAbout: [
      "Au pair placement",
      "Childcare",
      "Caregiving",
      "House sitting",
      "Pet sitting",
      "Identity verification",
    ],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: PUBLIC_SITE_URL,
    description: BRAND.description,
    inLanguage: ["en", "zh", "hi", "es", "fr", "ar", "bn", "pt", "de"],
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      url: PUBLIC_SITE_URL,
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${PUBLIC_SITE_URL}/browse/aupairs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function serviceJsonLd(input: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    provider: {
      "@type": "Organization",
      name: BRAND.name,
      url: PUBLIC_SITE_URL,
    },
    areaServed: "Worldwide",
    serviceType: input.name,
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function personProfileJsonLd(input: {
  name: string;
  description?: string;
  path: string;
  image?: string | null;
  jobTitle?: string;
  city?: string | null;
  country?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    description: input.description,
    url: absoluteUrl(input.path),
    image: input.image ? absoluteUrl(input.image) : undefined,
    jobTitle: input.jobTitle,
    address:
      input.city || input.country
        ? {
            "@type": "PostalAddress",
            addressLocality: input.city || undefined,
            addressCountry: input.country || undefined,
          }
        : undefined,
  };
}

export function faqJsonLd(
  faqs: Array<{ question: string; answer: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };
}

export function serviceLandingPaths() {
  return SERVICE_LIST.map((s) => `/${s.slug}`);
}
