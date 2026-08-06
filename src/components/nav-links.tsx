"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const MAIN_LINKS = [
  { href: "/discover", label: "Discover" },
  { href: "/browse/aupairs", label: "Sitters" },
  { href: "/browse/families", label: "Hosts" },
  { href: "/pricing", label: "Pricing" },
] as const;

export function MainNavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname() || "";

  return (
    <nav className={cn("items-center gap-1", className)}>
      {MAIN_LINKS.map(({ href, label }) => {
        // Exact match or nested path (e.g. /browse/aupairs/xyz)
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
