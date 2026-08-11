"use client";

/**
 * Property24-style browse: map tab + region chips + list with 👋 connect.
 * Pins are city centres only (never street addresses).
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin, List, Map as MapIcon } from "lucide-react";
import { clusterByCity, projectToPercent, type MapCluster } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { WaveConnectButton } from "@/components/wave-connect-button";

export type MapListing = {
  id: string;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  name: string;
  href: string;
  subtitle?: string;
  /** User id for 👋 connect (when known) */
  userId?: string | null;
  /** peer | host interest path */
  connectMode?: "peer" | "interest" | "profile";
};

export function MapBrowse({
  listings,
  typeLabel,
  type,
}: {
  listings: MapListing[];
  typeLabel: string;
  type: "aupairs" | "families";
}) {
  const [view, setView] = useState<"map" | "list">("map");
  const [region, setRegion] = useState<string>("");

  const regions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of listings) {
      const r = (l.region || l.city || "Other").trim() || "Other";
      counts.set(r, (counts.get(r) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [listings]);

  const filtered = useMemo(() => {
    if (!region) return listings;
    return listings.filter((l) => {
      const r = (l.region || l.city || "Other").trim() || "Other";
      return r === region;
    });
  }, [listings, region]);

  const clusters = useMemo(
    () =>
      clusterByCity(
        filtered.map((l) => ({ id: l.id, city: l.city, country: l.country }))
      ),
    [filtered]
  );

  const [active, setActive] = useState<MapCluster | null>(null);

  // Reset active city when filter changes
  const activeSafe =
    active && clusters.some(
      (c) =>
        c.pin.city === active.pin.city && c.pin.country === active.pin.country
    )
      ? active
      : clusters[0] ?? null;

  const activeListings = useMemo(() => {
    if (!activeSafe) return [];
    const ids = new Set(activeSafe.profileIds);
    return filtered.filter((l) => ids.has(l.id));
  }, [activeSafe, filtered]);

  const unmapped = filtered.filter((l) => !matchInClusters(l, clusters)).length;

  const listHref =
    type === "families"
      ? region
        ? `/browse/families?q=${encodeURIComponent(region)}`
        : "/browse/families"
      : region
        ? `/browse/aupairs?q=${encodeURIComponent(region)}`
        : "/browse/aupairs";

  return (
    <div className="space-y-4">
      {/* View tabs — Property24 style */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-full border border-stone-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setView("map")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              view === "map"
                ? "bg-teal-600 text-white"
                : "text-stone-600 hover:bg-stone-50"
            )}
          >
            <MapIcon className="h-4 w-4" />
            Map
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold transition",
              view === "list"
                ? "bg-teal-600 text-white"
                : "text-stone-600 hover:bg-stone-50"
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
        </div>
        <Link href={listHref} className="btn-ghost text-sm font-semibold text-stone-600">
          Full browse →
        </Link>
      </div>

      {/* Region chips */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Regions
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setRegion("")}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
              !region
                ? "border-teal-600 bg-teal-600 text-white"
                : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
            )}
          >
            All ({listings.length})
          </button>
          {regions.map((r) => (
            <button
              key={r.name}
              type="button"
              onClick={() => setRegion(r.name === region ? "" : r.name)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-sm font-semibold transition",
                region === r.name
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
              )}
            >
              {r.name} ({r.count})
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-stone-500">
          {type === "families"
            ? "Select a region to find host families nearby."
            : "Select a region to connect with au pairs & sitters nearby — use 👋 to say hi."}
        </p>
      </div>

      {view === "list" ? (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((l) => (
            <li
              key={l.id}
              className="flex flex-col justify-between rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div>
                <Link href={l.href} className="font-semibold text-stone-900 hover:text-teal-800">
                  {l.name}
                </Link>
                <p className="mt-0.5 text-xs text-stone-500">
                  {[l.city, l.region, l.country].filter(Boolean).join(", ") || "Location TBD"}
                </p>
                {l.subtitle && (
                  <p className="mt-1 text-sm text-stone-600 line-clamp-2">{l.subtitle}</p>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link href={l.href} className="btn-secondary !py-1.5 !px-3 text-xs">
                  View profile
                </Link>
                {l.userId && (
                  <WaveConnectButton
                    toUserId={l.userId}
                    toName={l.name}
                    mode={l.connectMode || (type === "aupairs" ? "peer" : "interest")}
                  />
                )}
              </div>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="col-span-full text-sm text-stone-400">
              No listings in this region yet.
            </li>
          )}
        </ul>
      ) : (
        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-teal-50 via-sky-50 to-stone-100 shadow-[var(--shadow)]">
              <div
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, #d6d3d1 1px, transparent 1px), linear-gradient(to bottom, #d6d3d1 1px, transparent 1px)",
                  backgroundSize: "8% 10%",
                }}
              />
              <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-stone-600 shadow-sm">
                City centres only · never exact addresses
              </div>

              {clusters.map((c) => {
                const { x, y } = projectToPercent(c.pin.lat, c.pin.lng);
                const isActive =
                  activeSafe?.pin.city === c.pin.city &&
                  activeSafe?.pin.country === c.pin.country;
                return (
                  <button
                    key={`${c.pin.city}-${c.pin.country}`}
                    type="button"
                    onClick={() => setActive(c)}
                    className={cn(
                      "absolute z-10 flex -translate-x-1/2 -translate-y-full flex-col items-center transition hover:scale-110",
                      isActive && "z-20 scale-110"
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`${c.pin.city}: ${c.count}`}
                  >
                    <span
                      className={cn(
                        "flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-bold text-white shadow-lg",
                        isActive ? "bg-teal-700 ring-2 ring-teal-300" : "bg-teal-600"
                      )}
                    >
                      {c.count}
                    </span>
                    <MapPin
                      className={cn(
                        "h-5 w-5 -mt-1",
                        isActive
                          ? "text-teal-800 fill-teal-700"
                          : "text-teal-600 fill-teal-500"
                      )}
                    />
                  </button>
                );
              })}

              {clusters.length === 0 && (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-500">
                  No profiles mapped yet. Listings need a recognised city (e.g. Cape Town,
                  Johannesburg, London).
                </div>
              )}
            </div>
            {unmapped > 0 && (
              <p className="mt-2 text-xs text-stone-400">
                {unmapped} listing{unmapped === 1 ? "" : "s"} without a known city pin (still in
                list browse).
              </p>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="font-display text-lg font-semibold text-stone-900">
                {activeSafe
                  ? `${activeSafe.pin.city}, ${activeSafe.pin.country}`
                  : `Select a city`}
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                {activeSafe
                  ? `${activeSafe.count} ${typeLabel}${activeSafe.count === 1 ? "" : "s"} near city centre`
                  : "Tap a pin on the map"}
              </p>
              <ul className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
                {activeListings.map((l) => (
                  <li
                    key={l.id}
                    className="rounded-xl border border-stone-100 px-3 py-2.5 transition hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <Link href={l.href} className="block">
                      <p className="font-medium text-stone-900">{l.name}</p>
                      {l.subtitle && (
                        <p className="text-xs text-stone-500 line-clamp-1">{l.subtitle}</p>
                      )}
                    </Link>
                    {l.userId && (
                      <div className="mt-2">
                        <WaveConnectButton
                          toUserId={l.userId}
                          toName={l.name}
                          mode={l.connectMode || (type === "aupairs" ? "peer" : "interest")}
                          compact
                        />
                      </div>
                    )}
                  </li>
                ))}
                {activeSafe && activeListings.length === 0 && (
                  <li className="text-sm text-stone-400">No listings in this city.</li>
                )}
              </ul>
              {activeSafe && (
                <Link
                  href={
                    type === "aupairs"
                      ? `/browse/aupairs?q=${encodeURIComponent(activeSafe.pin.city)}`
                      : `/browse/families?q=${encodeURIComponent(activeSafe.pin.city)}`
                  }
                  className="btn-secondary mt-4 w-full text-sm"
                >
                  Open full list for {activeSafe.pin.city}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function matchInClusters(l: MapListing, clusters: MapCluster[]) {
  return clusters.some((c) => c.profileIds.includes(l.id));
}
