"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Compass,
  Users,
  Home,
  MessageCircle,
  Heart,
  UserCog,
  Calendar,
  FileText,
  ShieldCheck,
  Send,
  Briefcase,
  Star,
  CreditCard,
  Settings,
  Link2,
  Bell,
  Store,
  LifeBuoy,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import Image from "next/image";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { MainNavLinks } from "@/components/nav-links";
import { UnreadMessagesLink } from "@/components/unread-messages-badge";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import {
  APP_NAV_GROUPS,
  isNavActive,
  navItemVisible,
  type AppNavItem,
} from "@/lib/app-nav";

type ShellUser = {
  name: string;
  image?: string | null;
  role?: string;
};

const SIDEBAR_STORAGE_KEY = "aupairly_sidebar_expanded";

/** Expanded width aligns with AuPairly wordmark column */
export const APP_SIDEBAR_EXPANDED = "11.5rem";
/** Collapsed icon rail */
export const APP_SIDEBAR_COLLAPSED = "4.25rem";

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/discover": Compass,
  "/browse/aupairs": Users,
  "/browse/families": Home,
  "/messages": MessageCircle,
  "/interests": Heart,
  "/community": Users,
  "/profile/edit": UserCog,
  "/availability": Calendar,
  "/documents": FileText,
  "/verification": ShieldCheck,
  "/applications": Send,
  "/placements": Briefcase,
  "/reviews": Star,
  "/billing": CreditCard,
  "/account": Settings,
  "/settings/connections": Link2,
  "/settings/notifications": Bell,
  "/connect": Store,
  "/support": LifeBuoy,
  "/admin": Shield,
};

function iconFor(href: string) {
  return ICONS[href] || ChevronRight;
}

function SideNavLinks({
  user,
  path,
  onNavigate,
  expanded,
}: {
  user: ShellUser;
  path: string;
  onNavigate?: () => void;
  expanded: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-4",
        expanded ? "px-1.5" : "px-1"
      )}
    >
      {APP_NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => navItemVisible(i, user.role));
        if (!items.length) return null;
        return (
          <div key={group.id}>
            {expanded ? (
              <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200/70">
                {group.label}
              </p>
            ) : (
              <div
                className="mx-auto mb-1 h-px w-6 bg-white/15"
                aria-hidden
              />
            )}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <SideLink
                  key={item.href}
                  item={item}
                  active={isNavActive(path, item)}
                  onNavigate={onNavigate}
                  expanded={expanded}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function SideLink({
  item,
  active,
  onNavigate,
  expanded,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
  expanded: boolean;
}) {
  const Icon = iconFor(item.href);
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={item.label}
        className={cn(
          "group flex items-center rounded-xl font-medium transition",
          expanded
            ? "gap-2 px-2 py-1.5 text-[13px]"
            : "justify-center px-1 py-2",
          active
            ? "bg-white text-teal-900 shadow-sm"
            : "text-white/85 hover:bg-white/10 hover:text-white"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg transition",
            expanded ? "h-7 w-7" : "h-9 w-9",
            active ? "bg-teal-100 text-teal-800" : "bg-white/10 text-white/90"
          )}
        >
          <Icon
            className={cn(expanded ? "h-3.5 w-3.5" : "h-4 w-4")}
            strokeWidth={active ? 2.4 : 2}
          />
        </span>
        {expanded && (
          <>
            <span className="min-w-0 flex-1 truncate leading-tight">
              {item.label}
            </span>
            {item.badge === "admin" && (
              <span className="rounded-full bg-amber-300/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
                Admin
              </span>
            )}
          </>
        )}
      </Link>
    </li>
  );
}

/**
 * Authenticated app chrome: sticky top bar + expandable teal side nav.
 */
export function AppShell({
  user,
  signOutAction,
  children,
}: {
  user: ShellUser;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const path = usePathname() || "";
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (raw === "0") setExpanded(false);
      else if (raw === "1") setExpanded(true);
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SIDEBAR_STORAGE_KEY, expanded ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [expanded, hydrated]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDrawerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const first = user.name.split(" ")[0] || "You";
  const sidebarW = expanded ? APP_SIDEBAR_EXPANDED : APP_SIDEBAR_COLLAPSED;
  const { t } = useI18n();

  function toggleExpanded() {
    setExpanded((v) => !v);
  }

  return (
    <div
      className="flex min-h-full min-w-0 flex-1 flex-col bg-[#faf8f5]"
      style={
        {
          // Used by full-bleed editors (profile/onboarding) for left offset
          ["--app-sidebar-w" as string]: sidebarW,
        } as React.CSSProperties
      }
    >
      {/* Full top navbar — primary destinations + account actions */}
      <header className="sticky top-0 z-[100] border-b border-stone-200/80 bg-[#faf8f5]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-stretch sm:h-16">
          <div
            className={cn(
              "hidden shrink-0 items-center border-r border-stone-200/70 transition-[width] duration-200 ease-out lg:flex",
              expanded ? "justify-start px-3" : "justify-center px-1.5"
            )}
            style={{ width: sidebarW }}
          >
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center"
              aria-label={t("nav_dashboard")}
            >
              {expanded ? (
                <BrandLogo className="max-w-full" priority />
              ) : (
                <Image
                  src="/icons/icon-192.png"
                  alt="AuPairly"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-full object-cover shadow-sm ring-1 ring-stone-200/80"
                  priority
                />
              )}
            </Link>
          </div>

          <div className="flex min-w-0 flex-1 items-center gap-1.5 px-2 sm:gap-2 sm:px-3 lg:gap-3 lg:px-4">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-stone-600 hover:bg-white lg:hidden"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link
              href="/dashboard"
              className="flex min-w-0 shrink-0 items-center lg:hidden"
              aria-label={t("nav_dashboard")}
            >
              <BrandLogo className="max-w-[9rem] sm:max-w-[10.5rem]" priority />
            </Link>

            <MainNavLinks
              showDashboard
              className="hidden min-w-0 flex-1 md:flex"
            />

            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <div className="sm:hidden">
                <LanguageSwitcher compact />
              </div>

              <div className="hidden sm:contents">
                <NotificationBell />
                <Link
                  href="/reviews"
                  className="rounded-full p-2 text-stone-600 transition hover:bg-white hover:text-teal-700"
                  title={t("nav_reviews")}
                  aria-label={t("nav_reviews")}
                >
                  <Star className="h-5 w-5" />
                </Link>
                <Link
                  href="/interests"
                  className="hidden rounded-full p-2 text-stone-600 transition hover:bg-white hover:text-teal-700 md:inline-flex"
                  title={t("nav_interests")}
                  aria-label={t("nav_interests")}
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <UnreadMessagesLink />
              </div>

              {/* Mobile: keep notifications + messages visible */}
              <div className="contents sm:hidden">
                <NotificationBell />
                <UnreadMessagesLink />
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
                href="/account"
                className="ml-0.5 flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-teal-300"
                title={t("nav_dashboard")}
              >
                <UserAvatar name={user.name} image={user.image} size="sm" />
                <span className="hidden max-w-[6rem] truncate text-sm font-semibold text-stone-800 sm:inline">
                  {first}
                </span>
              </Link>

              <form action={signOutAction} className="hidden xl:block">
                <button
                  type="submit"
                  className="px-1 text-sm font-medium text-stone-500 hover:text-stone-800"
                >
                  {t("nav_sign_out")}
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        <aside
          className={cn(
            "sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] hidden h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-teal-800 via-teal-700 to-teal-900 text-white transition-[width] duration-200 ease-out sm:top-[calc(4rem+env(safe-area-inset-top,0px))] sm:h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] lg:flex"
          )}
          style={{ width: sidebarW }}
          aria-label="Main navigation"
        >
          <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl" />

          <div className="relative flex min-h-0 flex-1 flex-col py-3">
            {expanded ? (
              <div className="mb-2 px-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-teal-200/80">
                  Workspace
                </p>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">
                  {user.name}
                </p>
                <p className="truncate text-xs text-teal-100/75">
                  {user.role === "PARENT"
                    ? "Host account"
                    : user.role === "AUPAIR"
                      ? "Sitter account"
                      : user.role === "ADMIN"
                        ? "Admin"
                        : "Member"}
                </p>
              </div>
            ) : (
              <div className="mb-2 flex justify-center px-1">
                <UserAvatar
                  name={user.name}
                  image={user.image}
                  size="sm"
                  className="!h-9 !w-9 ring-2 ring-white/20"
                />
              </div>
            )}

            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
              <SideNavLinks user={user} path={path} expanded={expanded} />
            </div>

            <div className="relative space-y-1 border-t border-white/10 px-1.5 pt-2">
              <button
                type="button"
                onClick={toggleExpanded}
                className={cn(
                  "flex w-full items-center rounded-xl text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white",
                  expanded ? "gap-2 px-2 py-2" : "justify-center px-1 py-2"
                )}
                title={expanded ? "Collapse sidebar" : "Expand sidebar"}
                aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
                aria-expanded={expanded}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  {expanded ? (
                    <ChevronsLeft className="h-4 w-4" />
                  ) : (
                    <ChevronsRight className="h-4 w-4" />
                  )}
                </span>
                {expanded && <span className="truncate">Collapse</span>}
              </button>

              <form action={signOutAction}>
                <button
                  type="submit"
                  title="Sign out"
                  className={cn(
                    "flex w-full items-center rounded-xl text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white",
                    expanded ? "gap-2 px-2 py-2" : "justify-center px-1 py-2"
                  )}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  {expanded && <span className="truncate">Sign out</span>}
                </button>
              </form>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer — always full labels */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[200] lg:hidden" role="dialog" aria-modal>
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/50"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(100vw-3rem,18rem)] flex-col bg-gradient-to-b from-teal-800 via-teal-700 to-teal-900 text-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-teal-200/80">
                  Menu
                </p>
                <p className="truncate text-sm font-semibold">{user.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto pb-4">
              <SideNavLinks
                user={user}
                path={path}
                expanded
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <div className="border-t border-white/10 px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium text-white/90 hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

/** Fallback offset when CSS var not present */
export const APP_SIDEBAR_OFFSET_CLASS =
  "lg:left-[var(--app-sidebar-w,11.5rem)]";
