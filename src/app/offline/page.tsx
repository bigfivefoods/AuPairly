import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-16 w-16 rounded-2xl shadow-lg" />
      <BrandLogo variant="full" className="mt-4" />
      <h1 className="mt-4 font-display text-2xl font-semibold text-stone-900">You&apos;re offline</h1>
      <p className="mt-2 text-sm text-stone-500">
        AuPairly needs a connection for live matches and messages. Cached pages may still work.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Try again
      </Link>
    </div>
  );
}
