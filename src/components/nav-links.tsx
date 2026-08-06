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
        const active =
          pathname === href ||
          (href !== "/" && pathname.startsWith(href + "/")) ||
          // Sitters browse without treating service landings as sitters
          (href === "/browse/aupairs" && pathname.startsWith("/browse/aupairs"));
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
