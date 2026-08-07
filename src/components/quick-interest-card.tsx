"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Loader2, Check, MapPin, BadgeCheck } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { SoftPaywall } from "@/components/soft-paywall";

export type QuickInterestItem = {
  userId: string;
  profileId: string;
  href: string;
  name: string;
  image?: string | null;
  headline?: string | null;
  city?: string | null;
  isVerified?: boolean;
};

/** Compact card with one-tap interest for post-publish activation */
export function QuickInterestCard({ item }: { item: QuickInterestItem }) {
  const [status, setStatus] = useState<"idle" | "sent" | "loading">("idle");
  const [error, setError] = useState("");
  const [paywall, setPaywall] = useState<{ used?: number; limit?: number } | null>(
    null
  );

  async function sendInterest() {
    setStatus("loading");
    setError("");
    setPaywall(null);
    try {
      const res = await fetch("/api/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: item.userId,
          message: `Hi ${item.name.split(" ")[0]} — I just published on AuPairly and would love to connect.`,
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setPaywall({ used: data.used, limit: data.limit });
        setError(data.error || "Interest limit reached");
        setStatus("idle");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Could not send");
        setStatus("idle");
        return;
      }
      setStatus("sent");
    } catch {
      setError("Network error");
      setStatus("idle");
    }
  }

  return (
    <div className="w-56 shrink-0 rounded-2xl border border-stone-200 bg-white p-3 shadow-sm">
      <Link href={item.href} className="block">
        <div className="flex items-center gap-2">
          <UserAvatar name={item.name} image={item.image} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-stone-900">{item.name}</p>
            {item.city && (
              <p className="flex items-center gap-0.5 truncate text-[11px] text-stone-500">
                <MapPin className="h-3 w-3" />
                {item.city}
              </p>
            )}
          </div>
        </div>
        {item.headline && (
          <p className="mt-2 line-clamp-2 text-xs text-stone-600">{item.headline}</p>
        )}
        {item.isVerified && (
          <span className="mt-2 inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
            <BadgeCheck className="h-3 w-3" />
            Verified
          </span>
        )}
      </Link>
      <div className="mt-3">
        {status === "sent" ? (
          <p className="flex items-center justify-center gap-1 rounded-full bg-emerald-50 py-2 text-xs font-semibold text-emerald-800">
            <Check className="h-3.5 w-3.5" /> Interest sent
          </p>
        ) : (
          <button
            type="button"
            disabled={status === "loading"}
            onClick={sendInterest}
            className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-500 py-2 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {status === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Heart className="h-3.5 w-3.5" />
            )}
            Express interest
          </button>
        )}
        {error && !paywall && (
          <p className="mt-1 text-[11px] text-red-600">{error}</p>
        )}
        {paywall && (
          <div className="mt-2">
            <SoftPaywall
              compact
              title="Interest limit"
              body="You've used this week's free interests. Unlock unlimited from R99 / 2 weeks."
              used={paywall.used}
              limit={paywall.limit}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function ActivateNearbyStrip({
  title,
  items,
}: {
  title: string;
  items: QuickInterestItem[];
}) {
  if (!items.length) return null;
  return (
    <section className="mb-8 rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Just published — take action
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">
        Send interest to people near you now — matches who reply first rank higher.
      </p>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 scroll-thin">
        {items.map((item) => (
          <QuickInterestCard key={item.userId} item={item} />
        ))}
      </div>
    </section>
  );
}
