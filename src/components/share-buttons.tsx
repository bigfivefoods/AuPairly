"use client";

import { useState } from "react";
import { Check, Copy, Link2, Share2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function ShareButtons({
  url,
  title,
  text,
  className,
  compact = false,
}: {
  /** Absolute or site-relative URL */
  url: string;
  title: string;
  text?: string;
  className?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const absolute =
    url.startsWith("http")
      ? url
      : `${(typeof window !== "undefined" ? window.location.origin : "https://www.aupairly.me").replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;

  const shareText = text || title;
  const encodedUrl = encodeURIComponent(absolute);
  const encodedText = encodeURIComponent(shareText);

  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${absolute}`)}`;
  const tiktokProfile = BRAND.social.tiktok;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(absolute);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: absolute });
        return;
      } catch {
        /* user cancelled */
      }
    }
    await copyLink();
  }

  const btn =
    "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-teal-300 hover:text-teal-800";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {!compact && (
        <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          Share
        </span>
      )}
      <button type="button" onClick={nativeShare} className={btn}>
        <Share2 className="h-3.5 w-3.5" />
        Share
      </button>
      <button type="button" onClick={copyLink} className={btn}>
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Copy link
          </>
        )}
      </button>
      <a
        href={facebookHref}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        Facebook
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        WhatsApp
      </a>
      <a
        href={tiktokProfile}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
        title="Follow AuPairly on TikTok"
      >
        <Link2 className="h-3.5 w-3.5" />
        TikTok
      </a>
    </div>
  );
}
