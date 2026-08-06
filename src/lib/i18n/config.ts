/**
 * Top 5 languages by total speakers (common global ranking).
 * English · Mandarin Chinese · Hindi · Spanish · French
 */

export const LOCALES = ["en", "zh", "hi", "es", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "aupairly_locale";

export const LOCALE_META: Record<
  Locale,
  { name: string; nativeName: string; dir: "ltr" | "rtl"; flag: string }
> = {
  en: { name: "English", nativeName: "English", dir: "ltr", flag: "🇬🇧" },
  zh: { name: "Chinese", nativeName: "中文", dir: "ltr", flag: "🇨🇳" },
  hi: { name: "Hindi", nativeName: "हिन्दी", dir: "ltr", flag: "🇮🇳" },
  es: { name: "Spanish", nativeName: "Español", dir: "ltr", flag: "🇪🇸" },
  fr: { name: "French", nativeName: "Français", dir: "ltr", flag: "🇫🇷" },
};

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && (LOCALES as readonly string[]).includes(v);
}

export function resolveLocale(raw?: string | null): Locale {
  if (raw && isLocale(raw)) return raw;
  return DEFAULT_LOCALE;
}
