"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/components/i18n-provider";
import { PrivyProvider } from "@/components/privy-provider";
import type { Locale } from "@/lib/i18n/config";

export function Providers({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale?: Locale;
}) {
  return (
    <SessionProvider>
      <PrivyProvider>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </PrivyProvider>
    </SessionProvider>
  );
}
