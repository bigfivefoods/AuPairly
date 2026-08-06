"use client";

import { SessionProvider } from "next-auth/react";
import { I18nProvider } from "@/components/i18n-provider";
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
      <I18nProvider initialLocale={locale}>{children}</I18nProvider>
    </SessionProvider>
  );
}
