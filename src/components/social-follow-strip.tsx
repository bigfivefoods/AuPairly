import Link from "next/link";
import { BRAND } from "@/lib/brand";

/** Homepage / marketing strip — follow + join CTAs */
export function SocialFollowStrip() {
  return (
    <section className="border-y border-stone-200/80 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
            Follow AuPairly
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold text-stone-900 sm:text-2xl">
            Tips, sitter stories &amp; city updates
          </h2>
          <p className="mt-1 max-w-xl text-sm text-stone-500">
            Join us on Instagram, TikTok, X &amp; Facebook — then create a free profile for verified
            care or AuPair Connect friends nearby.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <a
            href={BRAND.social.instagram}
            target="_blank"
            rel="noopener noreferrer me"
            className="btn-primary !px-4 !py-2 text-sm"
          >
            Instagram {BRAND.social.instagramHandle}
          </a>
          <a
            href={BRAND.social.tiktok}
            target="_blank"
            rel="noopener noreferrer me"
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            TikTok {BRAND.social.tiktokHandle}
          </a>
          <a
            href={BRAND.social.x}
            target="_blank"
            rel="noopener noreferrer me"
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            X {BRAND.social.xHandle}
          </a>
          <a
            href={BRAND.social.facebook}
            target="_blank"
            rel="noopener noreferrer me"
            className="btn-secondary !px-4 !py-2 text-sm"
          >
            Facebook
          </a>
          <Link href="/register" className="btn-secondary !px-4 !py-2 text-sm">
            Join free
          </Link>
        </div>
      </div>
    </section>
  );
}
