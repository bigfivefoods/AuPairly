"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export function MainNavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "";
  const { t } = useI18n();

  const MAIN_LINKS = [
    { href: "/discover", label: t("nav_discover") },
    { href: "/browse/aupairs", label: t("nav_sitters") },
    { href: "/browse/families", label: t("nav_hosts") },
    { href: "/pricing", label: t("nav_pricing") },
  ] as const;

  return (
    <nav className={cn("items-center gap-1", className)}>
      {MAIN_LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              active
                ? "bg-teal-600 text-white shadow-sm"
                : "text-stone-600 hover:bg-white hover:text-teal-700"
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
