"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Baby, Home, LayoutGrid, PawPrint } from "lucide-react";
import {
  SERVICE_LIST,
  type ServiceId,
  isServiceId,
} from "@/lib/services";
import { cn } from "@/lib/utils";

const ICONS = {
  baby: Baby,
  home: Home,
  paw: PawPrint,
} as const;

type Side = "sitters" | "hosts";

/**
 * Clear category tabs: All | Childcare | House Sitting | Pet Sitting
 * Works within browse (preserves other query params) or links to landing pages.
 */
export function CategoryTabs({
  side = "sitters",
  activeService,
  mode = "browse",
  className,
}: {
  side?: Side;
  /** When set, highlights this service (server-provided preferred) */
  activeService?: ServiceId | "" | null;
  /** browse = keep filters on /browse/* ; landing = use SEO paths */
  mode?: "browse" | "landing";
  className?: string;
}) {
  const path = usePathname() || "";
  const sp = useSearchParams();

  const fromQuery = sp.get("service") || "";
  const current: ServiceId | "" =
    activeService && isServiceId(activeService)
      ? activeService
      : isServiceId(fromQuery)
        ? fromQuery
        : path.includes("house-sitting")
          ? "HOUSE_SITTING"
          : path.includes("pet-sitting")
            ? "PET_SITTING"
            : path.includes("/childcare")
              ? "CHILDCARE"
              : "";

  function hrefFor(service: ServiceId | "") {
    if (mode === "landing") {
      if (!service) return side === "sitters" ? "/browse/aupairs" : "/browse/families";
      const slug = SERVICE_LIST.find((s) => s.id === service)?.slug;
      return `/${slug}`;
    }
    const base =
      side === "sitters" || path.includes("/browse/aupairs")
        ? "/browse/aupairs"
        : path.includes("/browse/families")
          ? "/browse/families"
          : side === "hosts"
            ? "/browse/families"
            : "/browse/aupairs";
    const params = new URLSearchParams(sp.toString());
    if (service) params.set("service", service);
    else params.delete("service");
    const q = params.toString();
    return q ? `${base}?${q}` : base;
  }

  const tabs: { id: ServiceId | ""; label: string; icon: typeof LayoutGrid }[] = [
    { id: "", label: "All services", icon: LayoutGrid },
    ...SERVICE_LIST.map((s) => ({
      id: s.id as ServiceId | "",
      label: s.shortName,
      icon: ICONS[s.icon],
    })),
  ];

  return (
    <div className={cn("w-full", className)}>
      <div
        role="tablist"
        aria-label="Service categories"
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
      >
        {tabs.map((tab) => {
          const active = current === tab.id;
          const Icon = tab.icon;
          const def = tab.id ? SERVICE_LIST.find((s) => s.id === tab.id) : null;
          return (
            <Link
              key={tab.id || "all"}
              role="tab"
              aria-selected={active}
              href={hrefFor(tab.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                active
                  ? def
                    ? def.activeTab
                    : "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Link>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-stone-500">
        {current
          ? `Showing ${SERVICE_LIST.find((s) => s.id === current)?.name} only. Sitters can still offer multiple services on one profile.`
          : "Search across all categories — or pick one tab to focus."}
      </p>
    </div>
  );
}

/** Compact nav pills for header: Childcare · House · Pets */
export function CategoryNavLinks({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {SERVICE_LIST.map((s) => (
        <Link
          key={s.id}
          href={`/${s.slug}`}
          className="rounded-full px-2.5 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-teal-800"
        >
          {s.shortName}
        </Link>
      ))}
    </div>
  );
}
