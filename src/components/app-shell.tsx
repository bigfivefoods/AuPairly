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
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/user-avatar";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";
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

const ICONS: Record<string, typeof LayoutDashboard> = {
  "/dashboard": LayoutDashboard,
  "/discover": Compass,
  "/browse/aupairs": Users,
  "/browse/families": Home,
  "/messages": MessageCircle,
  "/interests": Heart,
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

/**
 * Shared logo + sidebar column width so the wordmark and rail line up.
 * Sized to the nav logo (h-8/h-9) + horizontal padding for side links.
 */
export const APP_SIDEBAR_WIDTH_CLASS = "w-[11.5rem]";
export const APP_SIDEBAR_OFFSET_CLASS = "lg:left-[11.5rem]";

function SideNavLinks({
  user,
  path,
  onNavigate,
  compact = false,
}: {
  user: ShellUser;
  path: string;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-1 flex-col gap-4", compact ? "px-1.5" : "px-2")}>
      {APP_NAV_GROUPS.map((group) => {
        const items = group.items.filter((i) => navItemVisible(i, user.role));
        if (!items.length) return null;
        return (
          <div key={group.id}>
            <p className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200/70">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((item) => (
                <SideLink
                  key={item.href}
                  item={item}
                  active={isNavActive(path, item)}
                  onNavigate={onNavigate}
                  compact={compact}
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
  compact = false,
}: {
  item: AppNavItem;
  active: boolean;
  onNavigate?: () => void;
  compact?: boolean;
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
          compact ? "gap-2 px-2 py-1.5 text-[13px]" : "gap-2.5 px-2.5 py-2 text-sm",
          active
            ? "bg-white text-teal-900 shadow-sm"
            : "text-white/85 hover:bg-white/10 hover:text-white"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-lg transition",
            compact ? "h-7 w-7" : "h-8 w-8",
            active ? "bg-teal-100 text-teal-800" : "bg-white/10 text-white/90"
          )}
        >
          <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} strokeWidth={active ? 2.4 : 2} />
        </span>
        <span className="min-w-0 flex-1 truncate leading-tight">{item.label}</span>
        {item.badge === "admin" && (
          <span className="rounded-full bg-amber-300/90 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">
            Admin
          </span>
        )}
      </Link>
    </li>
  );
}

/**
 * Authenticated app chrome: sticky top bar + teal side nav (desktop) / drawer (mobile).
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

  useEffect(() => {
    setDrawerOpen(false);
  }, [path]);

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  const first = user.name.split(" ")[0] || "You";

  return (
    <div className="flex min-h-full min-w-0 flex-1 flex-col bg-[#faf8f5]">
      {/* Top bar — logo sits in a cell the same width as the side rail */}
      <header className="sticky top-0 z-[100] border-b border-stone-200/80 bg-[#faf8f5]/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
        <div className="flex h-14 items-stretch sm:h-16">
          {/* Logo column = sidebar width (desktop) */}
          <div
            className={cn(
              "hidden shrink-0 items-center border-r border-stone-200/70 px-3 lg:flex",
              APP_SIDEBAR_WIDTH_CLASS
            )}
          >
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center"
              aria-label="Dashboard"
            >
              <BrandLogo className="max-w-full" priority />
            </Link>
          </div>

          {/* Mobile / tablet: menu + logo in the main strip */}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3 sm:gap-3 sm:px-4">
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
              aria-label="Dashboard"
            >
              <BrandLogo className="max-w-[9rem] sm:max-w-[10.5rem]" priority />
            </Link>

            <div className="mx-auto hidden max-w-md flex-1 px-2 md:block lg:px-4">
              <Link
                href="/discover"
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-500 shadow-sm transition hover:border-teal-300 hover:text-teal-800"
              >
                <Compass className="h-4 w-4 shrink-0 text-teal-600" />
                <span className="truncate">Discover matches & listings…</span>
              </Link>
            </div>

            <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1">
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <NotificationBell />
              <Link
                href="/messages"
                className="rounded-full p-2 text-stone-600 transition hover:bg-white hover:text-teal-700"
                aria-label="Messages"
                title="Messages"
              >
                <MessageCircle className="h-5 w-5" />
              </Link>
              <Link
                href="/account"
                className="ml-0.5 flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-2.5 shadow-sm transition hover:border-teal-300"
              >
                <UserAvatar name={user.name} image={user.image} size="sm" />
                <span className="hidden max-w-[6rem] truncate text-sm font-semibold text-stone-800 sm:inline">
                  {first}
                </span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 min-w-0 flex-1">
        {/* Desktop side nav — same width as logo column above */}
        <aside
          className={cn(
            "sticky top-[calc(3.5rem+env(safe-area-inset-top,0px))] hidden h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] shrink-0 flex-col overflow-hidden bg-gradient-to-b from-teal-800 via-teal-700 to-teal-900 text-white sm:top-[calc(4rem+env(safe-area-inset-top,0px))] sm:h-[calc(100dvh-4rem-env(safe-area-inset-top,0px))] lg:flex",
            APP_SIDEBAR_WIDTH_CLASS
          )}
        >
          <div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-orange-400/15 blur-3xl" />

          <div className="relative flex min-h-0 flex-1 flex-col py-3">
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
              <SideNavLinks user={user} path={path} compact />
            </div>

            <div className="relative border-t border-white/10 px-2 pt-2">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                    <LogOut className="h-4 w-4" />
                  </span>
                  <span className="truncate">Sign out</span>
                </button>
              </form>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      {/* Mobile drawer */}
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
            <div className="min-h-0 flex-1 overflow-y-auto pb-4">
              <SideNavLinks
                user={user}
                path={path}
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

