"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error.digest || error.message, error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-orange-700">
        Something went wrong
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900">
        We hit a snag
      </h1>
      <p className="mt-3 text-stone-600">
        Please try again. If it keeps happening, contact support — we&apos;ll sort it out.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-stone-400">Ref: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          Try again
        </button>
        <Link href="/dashboard" className="btn-secondary">
          Dashboard
        </Link>
        <Link href="/support" className="text-sm font-semibold text-teal-700 hover:underline">
          Support
        </Link>
      </div>
    </div>
  );
}
