"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/browse/aupairs", label: "Browse", icon: Search },
  { href: "/messages", label: "Chat", icon: MessageCircle },
  { href: "/profile/edit", label: "Profile", icon: User },
];

export function MobileNav() {
  const path = usePathname() || "";
  // Hide on auth pages
  if (path.startsWith("/login") || path.startsWith("/register")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = path === href || path.startsWith(href + "/");
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[10px] font-semibold",
                  active ? "text-teal-700" : "text-stone-500"
                )}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
