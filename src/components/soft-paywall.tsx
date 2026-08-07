"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Inline upgrade nudge when Free plan limits hit */
export function SoftPaywall({
  title = "You're getting matches — keep going",
  body = "Free plans cap messages and interests. Unlock unlimited matching so conversations don't stop mid-hire.",
  used,
  limit,
  className,
  compact,
}: {
  title?: string;
  body?: string;
  used?: number;
  limit?: number;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm",
        compact && "p-3",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800">
          <Crown className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-base font-semibold text-stone-900">{title}</p>
          {used != null && limit != null && (
            <p className="mt-0.5 text-xs font-medium text-amber-900/80">
              {used}/{limit} used on Free
            </p>
          )}
          <p className="mt-1 text-sm text-stone-600">{body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/pricing?period=WEEK&plan=PLUS">
              <Button type="button" variant="primary" className="min-h-9 px-4 text-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Try Plus · R99 / 2 weeks
              </Button>
            </Link>
            <Link href="/pricing?period=QUARTER&plan=PLUS">
              <Button type="button" variant="secondary" className="min-h-9 px-4 text-sm">
                Best value · R249 / 3 mo
              </Button>
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center text-sm font-semibold text-teal-800 hover:underline"
            >
              All plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
