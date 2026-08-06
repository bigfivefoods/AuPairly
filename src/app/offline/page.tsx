import Link from "next/link";
import { BrandWordmark } from "@/components/brand-wordmark";

export const metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-2xl font-bold text-white shadow-lg">
        A
      </div>
      <BrandWordmark className="mt-4 text-xl font-semibold text-stone-900" />
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
