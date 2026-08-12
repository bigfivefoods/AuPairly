"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import { BRAND } from "@/lib/brand";
import { Button, Card } from "@/components/ui";

export function InviteCard({
  userId,
  userName,
  referralCount = 0,
}: {
  userId: string;
  userName: string;
  /** How many people already joined with this invite */
  referralCount?: number;
}) {
  const [copied, setCopied] = useState(false);
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.aupairly.me"
  ).replace(/\/$/, "");
  const refCode = userId.slice(0, 10);
  const inviteUrl = useMemo(
    () => `${site}/register?ref=${encodeURIComponent(refCode)}`,
    [site, refCode]
  );
  const shareText = `${userName.split(" ")[0]} invited you to ${BRAND.name} — ${BRAND.taglineShort}. Join free:`;
  const goal = 3;
  const progress = Math.min(goal, referralCount);

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      void fetch("/api/funnel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "invite_copy" }),
      }).catch(() => null);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="mb-8 border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Grow your city · free · 3-day feature reward
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-stone-900">
        Invite 3 people near you
      </h3>
      <div className="mt-2">
        <div className="flex items-center justify-between text-xs font-semibold text-teal-900">
          <span>
            {progress} of {goal} joined with your link
          </span>
          <span>{referralCount} total referrals</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-teal-100">
          <div
            className="h-full rounded-full bg-teal-600 transition-all"
            style={{ width: `${(progress / goal) * 100}%` }}
          />
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        AuPairly works when both hosts and sitters join. Share your link — more locals =
        better matches. When someone joins with your link, your listing gets a{" "}
        <strong className="font-semibold text-teal-800">3-day Featured boost</strong>{" "}
        automatically.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="min-w-0 flex-1 break-all rounded-xl border border-teal-100 bg-white px-3 py-2 font-mono text-xs text-teal-800">
          {inviteUrl}
        </p>
        <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
          {copied ? (
            <>
              <Check className="h-4 w-4" /> Copied
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" /> Copy
            </>
          )}
        </Button>
      </div>
      <div className="mt-4">
        <ShareButtons
          url={inviteUrl}
          title={`Join me on ${BRAND.name}`}
          text={shareText}
        />
      </div>
      <p className="mt-3 text-xs text-stone-400">
        Suggested text: “Join me on AuPairly — trusted care for family, loved ones, home
        &amp; pets.” Also follow us on{" "}
        <a
          href={BRAND.social.instagram}
          className="font-semibold text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Instagram
        </a>
        ,{" "}
        <a
          href={BRAND.social.facebook}
          className="font-semibold text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          Facebook
        </a>
        ,{" "}
        <a
          href={BRAND.social.tiktok}
          className="font-semibold text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>{" "}
        &amp;{" "}
        <a
          href={BRAND.social.x}
          className="font-semibold text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          X
        </a>
        .
      </p>
    </Card>
  );
}
