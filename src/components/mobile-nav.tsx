"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Compass,
  Home,
  MessageCircle,
  Search,
  User,
  LogIn,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";
import { UserAvatar } from "@/components/user-avatar";

export function MobileNav() {
  const path = usePathname() || "";
  const { t, locale } = useI18n();
  const { data: session, status } = useSession();
  const loggedIn = status === "authenticated" && Boolean(session?.user);

  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/forgot-password") ||
    path.startsWith("/reset-password")
  ) {
    return null;
  }

  type Item = {
    href: string;
    label: string;
    icon: typeof Home;
    match: string[];
    profile?: boolean;
  };

  const appItems: Item[] = [
    { href: "/dashboard", label: t("nav_home"), icon: Home, match: ["/dashboard"] },
    { href: "/discover", label: t("nav_discover"), icon: Compass, match: ["/discover"] },
    {
      href: "/browse/aupairs",
      label: t("nav_browse"),
      icon: Search,
      match: ["/browse", "/map", "/cities", "/community"],
    },
    {
      href: "/messages",
      label: t("nav_chat"),
      icon: MessageCircle,
      match: ["/messages"],
    },
    {
      href: "/account",
      label: t("nav_you"),
      icon: User,
      match: ["/account", "/profile", "/settings", "/verification", "/trust"],
      profile: true,
    },
  ];

  const guestItems: Item[] = [
    { href: "/", label: t("nav_home"), icon: Home, match: ["/"] },
    {
      href: "/how-it-works",
      label: "How it works",
      icon: HelpCircle,
      match: ["/how-it-works"],
    },
    {
      href: "/browse/aupairs",
      label: t("nav_browse"),
      icon: Search,
      match: ["/browse", "/map"],
    },
    {
      href: "/pricing",
      label: t("nav_pricing"),
      icon: Sparkles,
      match: ["/pricing"],
    },
    {
      href: "/login?callbackUrl=/dashboard",
      label: t("nav_login"),
      icon: LogIn,
      match: ["/login", "/register"],
    },
  ];

  const items = loggedIn ? appItems : guestItems;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-[90] border-t border-stone-200/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_24px_rgba(28,25,23,0.06)] backdrop-blur-md md:hidden"
      aria-label={loggedIn ? "App navigation" : "Site navigation"}
      data-locale={locale}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-1 pt-1">
        {items.map(({ href, label, icon: Icon, match, profile }) => {
          const active =
            href === "/"
              ? path === "/"
              : match.some((m) => path === m || path.startsWith(m + "/"));
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1.5 text-[11px] font-semibold leading-tight transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600",
                  active ? "text-teal-700" : "text-stone-600 hover:text-stone-800"
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-xl transition",
                    active && !profile ? "bg-teal-50 text-teal-700" : "",
                    active && profile ? "ring-2 ring-teal-500 ring-offset-1" : ""
                  )}
                >
                  {profile && loggedIn ? (
                    <UserAvatar
                      name={session?.user?.name || "You"}
                      image={session?.user?.image}
                      size="sm"
                      className="!h-8 !w-8 !text-[10px]"
                    />
                  ) : (
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 2} />
                  )}
                </span>
                <span className="max-w-full truncate px-0.5">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
