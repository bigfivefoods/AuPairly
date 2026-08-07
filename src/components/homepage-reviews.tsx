import { Star } from "lucide-react";

export type PublicReview = {
  id: string;
  rating: number;
  body: string;
  fromName: string;
  createdAt: string;
};

export function HomepageReviews({ reviews }: { reviews: PublicReview[] }) {
  if (!reviews.length) {
    return (
      <section className="border-y border-stone-100 bg-stone-50 py-12 sm:py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            Trust
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Real families & sitters
          </h2>
          <p className="mt-3 text-sm text-stone-500">
            Reviews appear here as members leave mutual feedback after placements and chats.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="border-y border-stone-100 bg-stone-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            From the community
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Recent reviews
          </h2>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <blockquote
              key={r.id}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < Math.round(r.rating) ? "fill-current" : "opacity-30"}`}
                  />
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-700 line-clamp-4">
                “{r.body}”
              </p>
              <footer className="mt-3 text-xs font-semibold text-stone-500">
                — {r.fromName}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
