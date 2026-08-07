import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SA_CITIES } from "@/lib/sa-cities";
import { SERVICE_LIST } from "@/lib/services";
import { absoluteUrl, PUBLIC_INDEX_PATHS } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // refresh hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_INDEX_PATHS.map(
    (path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency:
        path === "/"
          ? "daily"
          : path.startsWith("/browse")
            ? "hourly"
            : path === "/pricing" || path === "/how-it-works"
              ? "weekly"
              : "monthly",
      priority:
        path === "/"
          ? 1
          : path.startsWith("/browse") || path === "/pricing"
            ? 0.9
            : path === "/how-it-works" || path === "/safety"
              ? 0.85
              : 0.7,
    })
  );

  const serviceEntries: MetadataRoute.Sitemap = SERVICE_LIST.map((s) => ({
    url: absoluteUrl(`/${s.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  const cityEntries: MetadataRoute.Sitemap = SA_CITIES.map((c) => ({
    url: absoluteUrl(`/cities/${c.slug}`),
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Active public profiles (cap for sitemap size)
  let aupairEntries: MetadataRoute.Sitemap = [];
  let familyEntries: MetadataRoute.Sitemap = [];
  try {
    const [aupairs, families] = await Promise.all([
      prisma.auPairProfile.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      }),
      prisma.familyProfile.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 2000,
      }),
    ]);
    aupairEntries = aupairs.map((p) => ({
      url: absoluteUrl(`/browse/aupairs/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
    familyEntries = families.map((p) => ({
      url: absoluteUrl(`/browse/families/${p.id}`),
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.75,
    }));
  } catch {
    // DB unavailable during build — static routes still published
  }

  // Deduplicate service paths already in PUBLIC_INDEX_PATHS
  const seen = new Set(staticEntries.map((e) => e.url));
  const extra = [...serviceEntries, ...cityEntries, ...aupairEntries, ...familyEntries].filter(
    (e) => {
      if (seen.has(e.url)) return false;
      seen.add(e.url);
      return true;
    }
  );

  return [...staticEntries, ...extra];
}
