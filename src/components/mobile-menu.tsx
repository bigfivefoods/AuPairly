"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Globe, ChevronRight } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { serviceLabel } from "@/lib/i18n/service-label";
import { SERVICE_LIST } from "@/lib/services";
import { LOCALES, LOCALE_META, type Locale } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

type NavUser = {
  name: string;
  image?: string | null;
  role?: string;
} | null;

/**
 * Hamburger + full-screen drawer for phones — categories, account, language.
 */
export function MobileMenu({
  user,
  signOutAction,
}: {
  user: NavUser;
  signOutAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const path = usePathname() || "";
  const { t, locale, setLocale, dict } = useI18n();

  useEffect(() => {
    setOpen(false);
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const links = [
    { href: "/discover", label: t("nav_discover") },
    { href: "/browse/aupairs", label: t("nav_sitters") },
    { href: "/browse/families", label: t("nav_hosts") },
    { href: "/pricing", label: t("nav_pricing") },
    { href: "/how-it-works", label: t("footer_how") },
    { href: "/safety", label: t("footer_safety") },
  ];

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-stone-700 transition hover:bg-stone-100"
        aria-label="Open menu"
        aria-expanded={open}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-stone-900/40 transition-opacity",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-2.5rem,20rem)] flex-col bg-white shadow-2xl transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <p className="font-display text-lg font-semibold text-stone-900">Menu</p>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-stone-100"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          {user && (
            <Link
              href="/dashboard"
              className="mb-4 flex items-center gap-3 rounded-2xl border border-stone-100 bg-stone-50 px-3 py-3"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-stone-900">
                  {user.name.split(" ")[0]}
                </span>
                <span className="text-xs text-stone-500">{t("nav_dashboard")}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-stone-400" />
            </Link>
          )}

          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            {t("footer_marketplace")}
          </p>
          <ul className="mb-4 space-y-0.5">
            {SERVICE_LIST.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${s.slug}`}
                  className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-teal-50 hover:text-teal-900"
                >
                  {serviceLabel(dict, s.id)}
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </Link>
              </li>
            ))}
          </ul>

          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            Explore
          </p>
          <ul className="mb-4 space-y-0.5">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-teal-50 hover:text-teal-900",
                    path === l.href || path.startsWith(l.href + "/")
                      ? "bg-teal-50 text-teal-900"
                      : "text-stone-800"
                  )}
                >
                  {l.label}
                  <ChevronRight className="h-4 w-4 text-stone-300" />
                </Link>
              </li>
            ))}
            {user && (
              <>
                <li>
                  <Link
                    href="/reviews"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-teal-50"
                  >
                    {t("nav_reviews")}
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/messages"
                    className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-stone-800 hover:bg-teal-50"
                  >
                    {t("nav_messages")}
                    <ChevronRight className="h-4 w-4 text-stone-300" />
                  </Link>
                </li>
                {user.role === "ADMIN" && (
                  <li>
                    <Link
                      href="/admin"
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-amber-800 hover:bg-amber-50"
                    >
                      {t("nav_admin")}
                      <ChevronRight className="h-4 w-4 text-stone-300" />
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <p className="mb-2 flex items-center gap-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
            <Globe className="h-3.5 w-3.5" />
            {t("nav_language")}
          </p>
          <div className="mb-4 grid grid-cols-2 gap-1.5 px-1">
            {LOCALES.map((code) => {
              const m = LOCALE_META[code as Locale];
              const active = code === locale;
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code as Locale)}
                  className={cn(
                    "rounded-xl border px-2 py-2 text-left text-xs font-semibold transition",
                    active
                      ? "border-teal-600 bg-teal-50 text-teal-900"
                      : "border-stone-200 bg-white text-stone-700 hover:border-teal-300"
                  )}
                >
                  <span className="mr-1">{m.flag}</span>
                  {m.nativeName}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-stone-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {user ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="btn-secondary w-full !min-h-11 text-sm"
              >
                {t("nav_sign_out")}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-2">
              <Link href="/login" className="btn-secondary w-full !min-h-11 text-sm">
                {t("nav_login")}
              </Link>
              <Link href="/register" className="btn-primary w-full !min-h-11 text-sm">
                {t("nav_get_started")}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
