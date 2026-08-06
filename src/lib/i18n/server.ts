import { cookies } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  resolveLocale,
  type Locale,
} from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";

export async function getRequestLocale(): Promise<Locale> {
  try {
    const jar = await cookies();
    return resolveLocale(jar.get(LOCALE_COOKIE)?.value);
  } catch {
    return DEFAULT_LOCALE;
  }
}

export async function getServerDictionary(): Promise<{
  locale: Locale;
  dict: Dictionary;
}> {
  const locale = await getRequestLocale();
  return { locale, dict: getDictionary(locale) };
}
