"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { SiteNavbar } from "@/components/site-navbar";
import { FooterI18n } from "@/components/chrome-i18n";
import { MobileNav } from "@/components/mobile-nav";
import { AppShell } from "@/components/app-shell";
import { SessionHeartbeat } from "@/components/session-heartbeat";
import { isAuthPath } from "@/lib/app-nav";

type ShellUser = {
  name: string;
  email?: string | null;
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
        <SessionHeartbeat enabled />
        <main
          id="main"
          className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0 print:pb-0"
        >
          {children}
        </main>
        <div className="print:hidden">
          <MobileNav />
        </div>
      </AppShell>
    );
  }

  return (
    <>
      <div className="print:hidden">
        <SiteNavbar user={user} signOutAction={signOutAction} />
      </div>
      <main
        id="main"
        className="min-w-0 flex-1 pb-[calc(4.75rem+env(safe-area-inset-bottom))] md:pb-0 print:pb-0"
      >
        {children}
      </main>
      <div className="print:hidden">
        <FooterI18n />
        <MobileNav />
      </div>
    </>
  );
}
