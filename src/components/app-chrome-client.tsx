"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { FooterI18n } from "@/components/chrome-i18n";
import { MobileNav } from "@/components/mobile-nav";
import { AppShell } from "@/components/app-shell";
import { isAuthPath } from "@/lib/app-nav";

type ShellUser = {
  name: string;
  image?: string | null;
  role?: string;
};

export function AppChromeClient({
  user,
  signOutAction,
  children,
}: {
  user: ShellUser | null;
  signOutAction: () => Promise<void>;
  children: ReactNode;
}) {
  const path = usePathname() || "";

  // Logged-in product chrome everywhere except auth screens
  if (user && !isAuthPath(path)) {
    return (
      <AppShell user={user} signOutAction={signOutAction}>
        <main className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
        <MobileNav />
      </AppShell>
    );
  }

  return (
    <>
      <SiteNavbar user={user} signOutAction={signOutAction} />
      <main className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      <FooterI18n />
      <MobileNav />
    </>
  );
}
