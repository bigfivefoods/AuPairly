"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SERVICE_LIST, type ServiceId } from "@/lib/services";
import { cn } from "@/lib/utils";

/**
 * Category pills in the header — highlights the current page.
 * Client component only for usePathname (stable SERVICE_LIST data).
 */
export function CategoryNavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");

  function isActive(slug: string, id: ServiceId) {
    if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) return true;
    // Browse filtered to this category
    if (
      (pathname.startsWith("/browse/aupairs") || pathname.startsWith("/browse/families")) &&
      serviceParam === id
    ) {
      return true;
    }
    return false;
  }

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {SERVICE_LIST.map((s) => {
        const active = isActive(s.slug, s.id);
        return (
          <Link
            key={s.id}
            href={`/${s.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-semibold transition",
              active
                ? cn("border shadow-sm", s.activeTab)
                : "border border-transparent text-stone-600 hover:bg-stone-100 hover:text-teal-800"
            )}
          >
            {s.shortName}
          </Link>
        );
      })}
    </div>
  );
}
