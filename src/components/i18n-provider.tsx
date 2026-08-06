"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_META,
  LOCALES,
  resolveLocale,
  type Locale,
} from "@/lib/i18n/config";
import {
  DICTIONARIES,
  getDictionary,
  t as translate,
  type Dictionary,
} from "@/lib/i18n/dictionaries";

type I18nContextValue = {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
  t: (key: keyof Dictionary, vars?: Record<string, string>) => string;
  locales: typeof LOCALES;
  meta: typeof LOCALE_META;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALE_META[locale].dir;
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));

  useEffect(() => {
    writeLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    const loc = resolveLocale(next);
    setLocaleState(loc);
    writeLocaleCookie(loc);
    // Persist on account when logged in (best-effort)
    void fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: loc }),
    }).catch(() => null);
  }, []);

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dict,
      setLocale,
      t: (key, vars) => translate(dict, key, vars),
      locales: LOCALES,
      meta: LOCALE_META,
    }),
    [locale, dict, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    // Safe fallback if used outside provider
    const dict = DICTIONARIES.en;
    return {
      locale: "en" as Locale,
      dict,
      setLocale: () => {},
      t: (key: keyof Dictionary, vars?: Record<string, string>) =>
        translate(dict, key, vars),
      locales: LOCALES,
      meta: LOCALE_META,
    };
  }
  return ctx;
}
