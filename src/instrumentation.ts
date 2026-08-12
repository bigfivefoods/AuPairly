/**
 * Next.js instrumentation — optional Sentry when SENTRY_DSN is set.
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn) {
      console.log(
        "[instrumentation] SENTRY_DSN present — wire @sentry/nextjs when package is installed"
      );
      // Avoid hard dependency: apps may enable Sentry later without build break.
      try {
        // @ts-expect-error optional peer
        const Sentry = await import("@sentry/nextjs");
        Sentry.init?.({
          dsn,
          tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
          environment:
            process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
        });
      } catch {
        console.warn(
          "[instrumentation] @sentry/nextjs not installed — logging only"
        );
      }
    }
  }
}
