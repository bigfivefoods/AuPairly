"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home, match: ["/dashboard"] },
  { href: "/discover", label: "Discover", icon: Compass, match: ["/discover"] },
  {
    href: "/browse/aupairs",
    label: "Browse",
    icon: Search,
    match: ["/browse", "/map", "/cities"],
  },
  { href: "/messages", label: "Chat", icon: MessageCircle, match: ["/messages"] },
  {
    href: "/profile/edit",
    label: "You",
    icon: User,
    match: ["/profile", "/settings", "/verification", "/trust"],
  },
];

export function MobileNav() {
  const path = usePathname() || "";
  // Hide on auth pages
  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  ) {
    return null;
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(28,25,23,0.06)] backdrop-blur-md md:hidden"
      aria-label="Primary"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {items.map(({ href, label, icon: Icon, match }) => {
          const active = match.some(
            (m) => path === m || path.startsWith(m + "/")
          );
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-semibold transition active:scale-95",
                  active ? "text-teal-700" : "text-stone-500 hover:text-stone-700"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition",
                    active ? "bg-teal-50 text-teal-700" : ""
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
