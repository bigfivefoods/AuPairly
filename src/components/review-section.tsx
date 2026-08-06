"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Star, Loader2 } from "lucide-react";
import { Avatar, Button, Card, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  author: { id: string; name: string; image?: string | null; role: string };
};

export function ReviewSection({
  targetId,
  targetName,
  initialReviews,
  canReview,
  existingRating,
}: {
  targetId: string;
  targetName: string;
  initialReviews: ReviewItem[];
  canReview: boolean;
  existingRating?: number | null;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(existingRating || 5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save review");
        return;
      }
      setReviews((prev) => {
        const rest = prev.filter((r) => r.author.id !== data.review.author.id);
        return [
          {
            id: data.review.id,
            rating: data.review.rating,
            comment: data.review.comment,
            createdAt: data.review.createdAt,
            author: data.review.author,
          },
          ...rest,
        ];
      });
      setMessage("Thanks — your review is live.");
      setShowForm(false);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          Reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {canReview && (
          <Button variant="secondary" type="button" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : existingRating ? "Update review" : "Write a review"}
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={submit} className="mt-5 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4">
          <p className="text-sm text-stone-600">
            How was your experience with {targetName.split(" ")[0]}?
          </p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className="rounded p-1 transition hover:scale-110"
                aria-label={`${n} stars`}
              >
                <Star
                  className={cn(
                    "h-7 w-7",
                    n <= rating ? "fill-amber-400 text-amber-400" : "text-stone-300"
                  )}
                />
              </button>
            ))}
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share a few details for other members (optional)"
            className="min-h-[90px]"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit review
          </Button>
        </form>
      )}

      {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-stone-500">No reviews yet — be the first after messaging.</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="flex gap-3 border-t border-stone-100 pt-4 first:border-0 first:pt-0">
              <Avatar name={r.author.name} image={r.author.image} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-stone-900">{r.author.name}</span>
                  <span className="flex items-center gap-0.5 text-sm text-amber-600">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {r.rating}
                  </span>
                  <span className="text-xs text-stone-400">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                {r.comment && (
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{r.comment}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
