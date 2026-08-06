import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { Avatar } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import { CategoryNavLinks } from "@/components/category-nav-links";
import { MainNavLinks } from "@/components/nav-links";
import { BrandWordmark } from "@/components/brand-wordmark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { NavbarAuthLabels, FooterI18n } from "@/components/chrome-i18n";
import { Heart, MessageCircle, Menu, Star } from "lucide-react";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 border-b border-stone-200/70 bg-[#faf8f5]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6 lg:gap-8">
          <Link href="/" className="group flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold text-white shadow-sm transition group-hover:scale-105">
              A
            </span>
            <BrandWordmark className="text-xl font-semibold text-stone-900" />
          </Link>
          <Suspense fallback={<div className="hidden h-7 w-64 sm:block" />}>
            <CategoryNavLinks className="hidden sm:flex" />
          </Suspense>
          <MainNavLinks className="hidden lg:flex" />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          {user ? (
            <>
              <NotificationBell />
              <Link
                href="/reviews"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title="Reviews"
              >
                <Star className="h-5 w-5" />
              </Link>
              <Link
                href="/interests"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title="Interests"
              >
                <Heart className="h-5 w-5" />
              </Link>
              <Link
                href="/messages"
                className="rounded-full p-2 text-stone-600 transition hover:bg-stone-100 hover:text-teal-700"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hidden rounded-full px-3 py-1.5 text-sm font-semibold text-amber-700 hover:bg-amber-50 sm:inline"
                >
                  <NavbarAuthLabels part="admin" />
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-teal-300 sm:flex"
              >
                <Avatar name={user.name} image={user.image} size="sm" />
                <span className="text-sm font-medium text-stone-800">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button
                  type="submit"
                  className="hidden text-sm font-medium text-stone-500 hover:text-stone-800 sm:inline"
                >
                  <NavbarAuthLabels part="signOut" />
                </button>
              </form>
              <Link href="/dashboard" className="rounded-full p-2 text-stone-600 md:hidden">
                <Menu className="h-5 w-5" />
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden text-sm font-semibold text-stone-700 hover:text-teal-700 sm:inline"
              >
                <NavbarAuthLabels part="login" />
              </Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4">
                <NavbarAuthLabels part="getStarted" />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return <FooterI18n />;
}
