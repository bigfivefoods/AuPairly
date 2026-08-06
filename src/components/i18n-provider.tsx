"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
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
  isChanging: boolean;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; samesite=lax`;
  document.documentElement.lang = locale;
  document.documentElement.dir = LOCALE_META[locale].dir;
}

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${LOCALE_COOKIE}=`));
  if (!match) return null;
  return resolveLocale(match.split("=")[1]);
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: ReactNode;
}) {
  const [isChanging, startTransition] = useTransition();
  const [locale, setLocaleState] = useState<Locale>(resolveLocale(initialLocale));

  // Prefer cookie if user already chose a language (client hydration)
  useEffect(() => {
    const fromCookie = readCookieLocale();
    if (fromCookie && fromCookie !== locale) {
      setLocaleState(fromCookie);
      writeLocaleCookie(fromCookie);
    } else {
      writeLocaleCookie(locale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  useEffect(() => {
    writeLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      const loc = resolveLocale(next);
      if (loc === locale) return;

      setLocaleState(loc);
      writeLocaleCookie(loc);

      startTransition(() => {
        void (async () => {
          try {
            await fetch("/api/locale", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ locale: loc }),
              credentials: "same-origin",
            });
          } catch {
            // Client cookie already written; continue
          }
          // Hard reload so the entire app (server + client) re-renders
          // with the new locale — not only chrome that uses useI18n().
          window.location.reload();
        })();
      });
    },
    [locale]
  );

  const dict = useMemo(() => getDictionary(locale), [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      dict,
      setLocale,
      t: (key, vars) => translate(dict, key, vars),
      locales: LOCALES,
      meta: LOCALE_META,
      isChanging,
    }),
    [locale, dict, setLocale, isChanging]
  );

  return (
    <I18nContext.Provider value={value}>
      <div
        key={locale}
        lang={locale}
        dir={LOCALE_META[locale].dir}
        className="contents"
        data-locale={locale}
      >
        {children}
      </div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    const dict = DICTIONARIES.en;
    return {
      locale: "en" as Locale,
      dict,
      setLocale: () => {},
      t: (key: keyof Dictionary, vars?: Record<string, string>) =>
        translate(dict, key, vars),
      locales: LOCALES,
      meta: LOCALE_META,
      isChanging: false,
    };
  }
  return ctx;
}
