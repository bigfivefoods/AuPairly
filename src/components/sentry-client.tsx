"use client";

import { useEffect } from "react";

/**
 * Optional Sentry browser SDK when NEXT_PUBLIC_SENTRY_DSN is set.
 * Loads from CDN so we don't require @sentry/browser in package.json.
 */
export function SentryClient() {
  useEffect(() => {
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
    if (!dsn || typeof window === "undefined") return;

    // Avoid double-init
    const w = window as Window & { __aupairlySentry?: boolean };
    if (w.__aupairlySentry) return;
    w.__aupairlySentry = true;

    const script = document.createElement("script");
    script.src = "https://browser.sentry-cdn.com/7.120.0/bundle.tracing.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Sentry = (window as any).Sentry;
      if (Sentry?.init) {
        Sentry.init({
          dsn,
          environment:
            process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || "production",
          tracesSampleRate: 0.1,
        });
      }
    };
    document.head.appendChild(script);
  }, []);

  return null;
}
