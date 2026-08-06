"use client";

import { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useI18n } from "@/components/i18n-provider";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/config";

export function LanguageSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { locale, setLocale, locales, meta, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-700 shadow-sm transition hover:border-teal-300 hover:text-teal-800",
          compact && "px-2"
        )}
        aria-label={t("nav_language")}
        aria-expanded={open}
      >
        <Globe className="h-3.5 w-3.5 text-teal-700" />
        {!compact && (
          <span className="hidden sm:inline">{meta[locale].nativeName}</span>
        )}
        <span className="sm:hidden">{meta[locale].flag}</span>
        <ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
      </button>
      {open && (
        <ul
          className="absolute right-0 z-50 mt-2 min-w-[11rem] overflow-hidden rounded-2xl border border-stone-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {locales.map((code) => {
            const m = meta[code as Locale];
            const active = code === locale;
            return (
              <li key={code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
                    active
                      ? "bg-teal-50 font-semibold text-teal-900"
                      : "text-stone-700 hover:bg-stone-50"
                  )}
                  onClick={() => {
                    setLocale(code as Locale);
                    setOpen(false);
                  }}
                >
                  <span className="text-base">{m.flag}</span>
                  <span className="flex-1">{m.nativeName}</span>
                  {active && <Check className="h-4 w-4 text-teal-600" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
