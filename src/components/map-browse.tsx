"use client";

/**
 * Privacy-safe city map: pins at city centres only (never street addresses).
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { clusterByCity, projectToPercent, type MapCluster } from "@/lib/geo";
import { cn } from "@/lib/utils";

export type MapListing = {
  id: string;
  city?: string | null;
  country?: string | null;
  name: string;
  href: string;
  subtitle?: string;
};

export function MapBrowse({
  listings,
  typeLabel,
}: {
  listings: MapListing[];
  typeLabel: string;
}) {
  const clusters = useMemo(
    () =>
      clusterByCity(
        listings.map((l) => ({ id: l.id, city: l.city, country: l.country }))
      ),
    [listings]
  );

  const [active, setActive] = useState<MapCluster | null>(clusters[0] ?? null);

  const activeListings = useMemo(() => {
    if (!active) return [];
    const ids = new Set(active.profileIds);
    return listings.filter((l) => ids.has(l.id));
  }, [active, listings]);

  const unmapped = listings.filter((l) => !matchInClusters(l, clusters)).length;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-stone-200 bg-gradient-to-br from-teal-50 via-sky-50 to-stone-100 shadow-[var(--shadow)]">
          {/* Soft world grid */}
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
              active?.pin.city === c.pin.city && active?.pin.country === c.pin.country;
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
                    isActive ? "text-teal-800 fill-teal-700" : "text-teal-600 fill-teal-500"
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
            {active
              ? `${active.pin.city}, ${active.pin.country}`
              : `Select a city`}
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            {active
              ? `${active.count} ${typeLabel}${active.count === 1 ? "" : "s"} near city centre`
              : "Tap a pin on the map"}
          </p>
          <ul className="mt-4 max-h-[360px] space-y-2 overflow-y-auto">
            {activeListings.map((l) => (
              <li key={l.id}>
                <Link
                  href={l.href}
                  className="block rounded-xl border border-stone-100 px-3 py-2.5 transition hover:border-teal-200 hover:bg-teal-50/50"
                >
                  <p className="font-medium text-stone-900">{l.name}</p>
                  {l.subtitle && (
                    <p className="text-xs text-stone-500 line-clamp-1">{l.subtitle}</p>
                  )}
                </Link>
              </li>
            ))}
            {active && activeListings.length === 0 && (
              <li className="text-sm text-stone-400">No listings in this city.</li>
            )}
          </ul>
          {active && (
            <Link
              href={
                typeLabel.includes("au pair")
                  ? `/browse/aupairs?q=${encodeURIComponent(active.pin.city)}`
                  : `/browse/families?q=${encodeURIComponent(active.pin.city)}`
              }
              className="btn-secondary mt-4 w-full text-sm"
            >
              Open full list for {active.pin.city}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function matchInClusters(l: MapListing, clusters: MapCluster[]) {
  return clusters.some((c) => c.profileIds.includes(l.id));
}
