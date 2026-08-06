"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { SERVICE_LIST, type ServiceId } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { serviceLabel } from "@/lib/i18n/dictionaries";

/**
 * Category pills — desktop row or mobile horizontal scroll.
 */
export function CategoryNavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "";
  const searchParams = useSearchParams();
  const serviceParam = searchParams.get("service");
  const { dict, locale } = useI18n();

  const isMobileStrip = className.includes("mobile-category-scroll");

  function isActive(slug: string, id: ServiceId) {
    if (pathname === `/${slug}` || pathname.startsWith(`/${slug}/`)) return true;
    if (
      (pathname.startsWith("/browse/aupairs") || pathname.startsWith("/browse/families")) &&
      serviceParam === id
    ) {
      return true;
    }
    return false;
  }

  return (
    <div
      className={cn(
        isMobileStrip
          ? "flex gap-1.5 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          : "flex items-center gap-0.5",
        className
      )}
      data-locale={locale}
    >
      {SERVICE_LIST.map((s) => {
        const active = isActive(s.slug, s.id);
        return (
          <Link
            key={s.id}
            href={`/${s.slug}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition",
              active
                ? cn("border shadow-sm", s.activeTab)
                : "border border-transparent text-stone-600 hover:bg-stone-100 hover:text-teal-800",
              isMobileStrip && "px-3 py-1.5"
            )}
          >
            {serviceLabel(dict, s.id)}
          </Link>
        );
      })}
    </div>
  );
}
