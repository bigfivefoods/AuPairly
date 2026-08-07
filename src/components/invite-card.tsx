"use client";

import { useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import { ShareButtons } from "@/components/share-buttons";
import { BRAND } from "@/lib/brand";
import { Button, Card } from "@/components/ui";

export function InviteCard({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
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

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <Card className="mb-8 border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-white shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
        Grow your city · free
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold text-stone-900">
        Invite 3 people near you
      </h3>
      <p className="mt-1 text-sm text-stone-500">
        AuPairly works when both hosts and sitters join. Share your link — more local people =
        better matches for everyone (and you get credit as referrer).
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
        </a>{" "}
        &amp;{" "}
        <a
          href={BRAND.social.tiktok}
          className="font-semibold text-teal-700 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          TikTok
        </a>
        .
      </p>
    </Card>
  );
}
