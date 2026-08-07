"use client";

import Link from "next/link";
import { Suspense } from "react";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notification-bell";
import { CategoryNavLinks } from "@/components/category-nav-links";
import { MainNavLinks } from "@/components/nav-links";
import { BrandLogo } from "@/components/brand-logo";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MobileMenu } from "@/components/mobile-menu";
import { useI18n } from "@/components/i18n-provider";
import { Heart, MessageCircle, Star } from "lucide-react";

type NavUser = {
  name: string;
  image?: string | null;
  role?: string;
} | null;

/**
 * Fully client-driven navbar so every label updates instantly when the
 * language changes (no stale server English). Mobile uses a drawer menu.
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
    <>
      {/* Only the top bar sticks — category strip scrolls away so it does not cover page titles */}
      <header
        className="sticky top-0 z-[100] border-b border-stone-200/70 bg-[#faf8f5]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]"
        data-locale={locale}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6 lg:gap-4 lg:px-8">
          {/* Left: logo + one nav set only (never stack categories + Discover in one tight row) */}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 lg:gap-4">
            <Link
              href="/"
              className="group flex min-w-0 shrink-0 items-center transition hover:opacity-90"
              aria-label="AuPairly home"
            >
              <BrandLogo priority className="max-w-[9.5rem] sm:max-w-[11rem]" />
            </Link>
            {/* md–lg: service categories only (Childcare … Pet sitting) */}
            <Suspense fallback={null}>
              <CategoryNavLinks className="hidden min-w-0 md:flex lg:hidden" />
            </Suspense>
            {/* lg+: Discover / Sitters / Hosts / Pricing — room for logged-in right icons */}
            <MainNavLinks className="hidden shrink-0 lg:flex" />
          </div>

          {/* Right: actions */}
          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5 lg:gap-2">
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="sm:hidden">
              <LanguageSwitcher compact />
            </div>

            {user ? (
              <>
                <div className="hidden sm:contents">
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
                    className="hidden rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700 md:inline-flex"
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
                </div>
                {user.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 lg:inline"
                  >
                    {t("nav_admin")}
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-teal-300 sm:flex"
                  title={t("nav_dashboard")}
                >
                  <UserAvatar name={user.name} image={user.image} size="sm" />
                  <span className="max-w-[5.5rem] truncate text-sm font-medium text-stone-800">
                    {user.name.split(" ")[0]}
                  </span>
                </Link>
                <form action={signOutAction} className="hidden lg:block">
                  <button
                    type="submit"
                    className="text-sm font-medium text-stone-500 hover:text-stone-800"
                  >
                    {t("nav_sign_out")}
                  </button>
                </form>
                <Link
                  href="/dashboard"
                  className="rounded-full p-1 sm:hidden"
                  aria-label={t("nav_dashboard")}
                >
                  <UserAvatar name={user.name} image={user.image} size="sm" />
                </Link>
                <MobileMenu user={user} signOutAction={signOutAction} />
              </>
            ) : (
              <>
                <Link
                  href="/login?callbackUrl=/dashboard"
                  className="hidden text-sm font-semibold text-stone-700 hover:text-teal-700 sm:inline"
                >
                  {t("nav_login")}
                </Link>
                <Link
                  href="/register"
                  className="btn-primary !px-3 !py-2 text-xs sm:!px-4 sm:text-sm"
                >
                  {t("nav_get_started")}
                </Link>
                <MobileMenu user={user} signOutAction={signOutAction} />
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile category strip: not sticky, so page titles stay clear while scrolling */}
      <div className="border-b border-stone-100/80 bg-[#faf8f5] md:hidden">
        <Suspense fallback={null}>
          <CategoryNavLinks className="mobile-category-scroll" />
        </Suspense>
      </div>
    </>
  );
}
