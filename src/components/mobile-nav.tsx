"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Home, MessageCircle, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function MobileNav() {
  const path = usePathname() || "";
  const { t, locale } = useI18n();

  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  ) {
    return null;
  }

  const items: {
    href: string;
    labelKey: keyof Dictionary;
    icon: typeof Home;
    match: string[];
  }[] = [
    { href: "/dashboard", labelKey: "nav_home", icon: Home, match: ["/dashboard"] },
    { href: "/discover", labelKey: "nav_discover", icon: Compass, match: ["/discover"] },
    {
      href: "/browse/aupairs",
      labelKey: "nav_browse",
      icon: Search,
      match: ["/browse", "/map", "/cities"],
    },
    { href: "/messages", labelKey: "nav_chat", icon: MessageCircle, match: ["/messages"] },
    {
      href: "/profile/edit",
      labelKey: "nav_you",
      icon: User,
      match: ["/profile", "/settings", "/verification", "/trust"],
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-stone-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(28,25,23,0.06)] backdrop-blur-md md:hidden"
      aria-label={t("nav_home")}
      data-locale={locale}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {items.map(({ href, labelKey, icon: Icon, match }) => {
          const active = match.some((m) => path === m || path.startsWith(m + "/"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[10px] font-semibold leading-tight transition active:scale-95",
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
                <span className="max-w-full truncate px-0.5">{t(labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
