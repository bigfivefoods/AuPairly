import Link from "next/link";
import { computeCompleteness, type CompletenessInput } from "@/lib/completeness";

export function CompletenessCoach({ input }: { input: CompletenessInput }) {
  const c = computeCompleteness(input);
  return (
    <div className="rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 to-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Profile coach
          </p>
          <h3 className="font-display text-lg font-semibold text-stone-900">
            {c.percent}% complete
          </h3>
        </div>
        <div className="relative h-14 w-14">
          <svg viewBox="0 0 36 36" className="h-14 w-14 -rotate-90">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#0d9488"
              strokeWidth="3"
              strokeDasharray={`${c.percent}, 100`}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-teal-800">
            {c.percent}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-stone-600">
        Finish these to unlock more matches, trust badges, and messages:
      </p>
      <ul className="mt-3 space-y-2">
        {c.nextThree.length === 0 ? (
          <li className="text-sm text-emerald-700">You&apos;re in great shape — keep messages warm.</li>
        ) : (
          c.nextThree.map((a) => (
            <li key={a.id}>
              <Link
                href={a.href}
                className="block rounded-xl border border-stone-200 bg-white px-3 py-2 transition hover:border-teal-300"
              >
                <p className="text-sm font-semibold text-stone-900">{a.label}</p>
                <p className="text-xs text-stone-500">{a.detail}</p>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
