import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">404</p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-stone-900">
        Page not found
      </h1>
      <p className="mt-3 text-stone-600">
        That link may be outdated, or the listing is no longer active.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/" className="btn-primary">
          Home
        </Link>
        <Link href="/browse/aupairs" className="btn-secondary">
          Find sitters
        </Link>
        <Link href="/browse/families" className="btn-secondary">
          Find hosts
        </Link>
        <Link href="/dashboard" className="text-sm font-semibold text-teal-700 hover:underline">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
