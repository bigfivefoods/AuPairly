import Link from "next/link";
import { Suspense } from "react";
import { auth, signOut } from "@/lib/auth";
import { Avatar } from "@/components/ui";
import { NotificationBell } from "@/components/notification-bell";
import { CategoryNavLinks } from "@/components/category-nav-links";
import { MainNavLinks } from "@/components/nav-links";
import { BrandWordmark } from "@/components/brand-wordmark";
import { Heart, MessageCircle, Menu } from "lucide-react";

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
          {user ? (
            <>
              <NotificationBell />
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
                  Admin
                </Link>
              )}
              <Link
                href="/dashboard"
                className="hidden items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition hover:border-teal-300 sm:flex"
              >
                <Avatar name={user.name} image={user.image} size="sm" />
                <span className="text-sm font-medium text-stone-800">{user.name.split(" ")[0]}</span>
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
                  Sign out
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
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm !py-2 !px-4">
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-stone-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
                A
              </span>
              <BrandWordmark className="text-lg font-semibold text-stone-900" />
            </div>
            <p className="mt-3 text-sm leading-relaxed text-stone-500">
              Trusted care for your family, loved ones, home &amp; pets — childcare, caregiving,
              house sitting &amp; pet sitting on one marketplace.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li><Link href="/childcare" className="hover:text-teal-700">Childcare</Link></li>
              <li><Link href="/caregiving" className="hover:text-teal-700">Caregiving</Link></li>
              <li><Link href="/house-sitting" className="hover:text-teal-700">House sitting</Link></li>
              <li><Link href="/pet-sitting" className="hover:text-teal-700">Pet sitting</Link></li>
              <li><Link href="/browse/aupairs" className="hover:text-teal-700">All sitters</Link></li>
              <li><Link href="/how-it-works" className="hover:text-teal-700">How it works</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Trust & safety</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li><Link href="/trust" className="hover:text-teal-700">Trust centre</Link></li>
              <li><Link href="/safety" className="hover:text-teal-700">Safety tips</Link></li>
              <li><Link href="/privacy" className="hover:text-teal-700">Privacy (POPIA)</Link></li>
              <li><Link href="/verification" className="hover:text-teal-700">Get verified</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-stone-500">
              <li><Link href="/pricing" className="hover:text-teal-700">Pricing</Link></li>
              <li><Link href="/guides" className="hover:text-teal-700">Guides</Link></li>
              <li><Link href="/support" className="hover:text-teal-700">Support</Link></li>
              <li><Link href="/register" className="hover:text-teal-700">Join free</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-stone-100 pt-6 text-sm text-stone-400 sm:flex-row">
          <p>© {new Date().getFullYear()} AuPairly. Made with care for families & au pairs.</p>
          <p className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-rose-400" /> Family · loved ones · home · pets
          </p>
        </div>
      </div>
    </footer>
  );
}
