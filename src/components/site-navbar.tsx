"use client";

import Link from "next/link";
import { Suspense } from "react";
import { Avatar } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import { CategoryNavLinks } from "@/components/category-nav-links";
import { MainNavLinks } from "@/components/nav-links";
import { BrandWordmark } from "@/components/brand-wordmark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/components/i18n-provider";
import { Heart, MessageCircle, Menu, Star } from "lucide-react";

type NavUser = {
  name: string;
  image?: string | null;
  role?: string;
} | null;

/**
 * Fully client-driven navbar so every label updates instantly when the
 * language changes (no stale server English).
 */
export function SiteNavbar({
  user,
  signOutAction,
}: {
  user: NavUser;
  signOutAction: () => Promise<void>;
}) {
  const { t, locale } = useI18n();

  return (
    <header
      className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf8f5]/90 backdrop-blur-md"
      data-locale={locale}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-4 lg:gap-8">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold text-white shadow-sm transition group-hover:scale-105">
              A
            </span>
            <BrandWordmark className="text-xl font-semibold text-stone-900" />
          </Link>
          <Suspense fallback={<div className="hidden h-7 w-48 sm:block" />}>
            <CategoryNavLinks className="hidden sm:flex" />
          </Suspense>
          <MainNavLinks className="hidden lg:flex" />
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <NotificationBell />
              <Link
                href="/reviews"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title={t("nav_reviews")}
                aria-label={t("nav_reviews")}
              >
                <Star className="h-5 w-5" />
              </Link>
              <Link
                href="/interests"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title={t("nav_interests")}
                aria-label={t("nav_interests")}
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/messages"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title={t("nav_messages")}
                aria-label={t("nav_messages")}
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 sm:inline"
                >
                  {t("nav_admin")}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-teal-300 sm:flex"
                title={t("nav_dashboard")}
              >
                <Avatar name={user.name} image={user.image} size="sm" />
                <span className="text-sm font-medium text-stone-800">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="hidden text-sm font-medium text-stone-500 hover:text-stone-800 sm:inline"
                >
                  {t("nav_sign_out")}
                </button>
              </form>
              <Link
                href="/dashboard"
                className="rounded-full p-2 text-stone-600 md:hidden"
                aria-label={t("nav_dashboard")}
              >
                <Menu className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-stone-700 hover:text-teal-700 sm:inline"
              >
                {t("nav_login")}
              </Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4">
                {t("nav_get_started")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
