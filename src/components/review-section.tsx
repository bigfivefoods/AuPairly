"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Star, Loader2, Lock, MessageSquare } from "lucide-react";
import { Avatar, Button, Card, Textarea, Label } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n-provider";

export type ReviewItem = {
  id: string;
  rating: number | null;
  communication?: number | null;
  reliability?: number | null;
  respect?: number | null;
  recommend?: boolean | null;
  comment: string | null;
  response?: string | null;
  respondedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  isPublic?: boolean;
  isAuthor?: boolean;
  isTarget?: boolean;
  hiddenReason?: string | null;
  author: { id: string; name: string; image?: string | null; role: string };
};

function StarPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-stone-600">{label}</span>
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className="rounded p-0.5 transition hover:scale-110"
            aria-label={`${n}`}
          >
            <Star
              className={cn(
                "h-6 w-6",
                n <= value ? "fill-amber-400 text-amber-400" : "text-stone-300"
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function StarsDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-4 w-4",
            n <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"
          )}
        />
      ))}
    </div>
  );
}

export function ReviewSection({
  targetId,
  targetName,
  initialReviews,
  canReview,
  existing,
}: {
  targetId: string;
  targetName: string;
  initialReviews: ReviewItem[];
  canReview: boolean;
  existing?: {
    rating?: number | null;
    communication?: number | null;
    reliability?: number | null;
    respect?: number | null;
    recommend?: boolean | null;
    comment?: string | null;
  } | null;
}) {
  const { t } = useI18n();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(existing?.rating || 5);
  const [communication, setCommunication] = useState(existing?.communication || 5);
  const [reliability, setReliability] = useState(existing?.reliability || 5);
  const [respect, setRespect] = useState(existing?.respect || 5);
  const [recommend, setRecommend] = useState(existing?.recommend !== false);
  const [comment, setComment] = useState(existing?.comment || "");
  const [privateNote, setPrivateNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [responseDrafts, setResponseDrafts] = useState<Record<string, string>>({});
  const [responding, setResponding] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetId,
          rating,
          communication,
          reliability,
          respect,
          recommend,
          comment,
          privateNote: privateNote || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common_error"));
        return;
      }
      setReviews((prev) => {
        const rest = prev.filter((r) => r.author.id !== data.review.author.id);
        return [data.review, ...rest];
      });
      setMessage(data.message || t("reviews_thanks"));
      setShowForm(false);
    } catch {
      setError(t("common_error"));
    } finally {
      setLoading(false);
    }
  }

  async function sendResponse(reviewId: string) {
    const text = responseDrafts[reviewId]?.trim();
    if (!text) return;
    setResponding(reviewId);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, response: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("common_error"));
        return;
      }
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
    } finally {
      setResponding(null);
    }
  }

  const publicCount = reviews.filter((r) => r.isPublic !== false && r.rating != null).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl font-semibold">
          {t("reviews_title")} {publicCount > 0 && `(${publicCount})`}
        </h2>
        {canReview && (
          <Button variant="secondary" type="button" onClick={() => setShowForm((s) => !s)}>
            {showForm
              ? t("common_cancel")
              : existing?.rating
                ? t("reviews_update")
                : t("reviews_write")}
          </Button>
        )}
      </div>

      <p className="mt-2 flex items-start gap-2 text-xs text-stone-500">
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-700" />
        Star ratings and written reviews are checked by AuPairly before they go public on profiles.
      </p>

      {showForm && (
        <form
          onSubmit={submit}
          className="mt-5 space-y-4 rounded-xl border border-stone-100 bg-stone-50 p-4"
        >
          <p className="text-sm text-stone-600">
            {t("reviews_how", { name: targetName.split(" ")[0] })}
          </p>
          <StarPicker value={rating} onChange={setRating} label={t("reviews_overall")} />
          <StarPicker
            value={communication}
            onChange={setCommunication}
            label={t("reviews_communication")}
          />
          <StarPicker
            value={reliability}
            onChange={setReliability}
            label={t("reviews_reliability")}
          />
          <StarPicker value={respect} onChange={setRespect} label={t("reviews_respect")} />
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={recommend}
              onChange={(e) => setRecommend(e.target.checked)}
            />
            {t("reviews_would_recommend")}
          </label>
          <div>
            <Label>{t("reviews_title")}</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviews_comment_ph")}
              className="min-h-[90px]"
            />
          </div>
          <div>
            <Label>{t("reviews_private_note")}</Label>
            <p className="mb-1 text-[11px] text-stone-400">{t("reviews_private_hint")}</p>
            <Textarea
              value={privateNote}
              onChange={(e) => setPrivateNote(e.target.value)}
              className="min-h-[60px]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("reviews_submit")}
          </Button>
        </form>
      )}

      {message && (
        <p className="mt-4 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-800">{message}</p>
      )}

      <div className="mt-6 space-y-4">
        {reviews.length === 0 && (
          <p className="text-sm text-stone-500">{t("reviews_empty")}</p>
        )}
        {reviews.map((r) => {
          const hidden = r.rating == null && r.hiddenReason === "AWAITING_MUTUAL";
          return (
            <div
              key={r.id}
              className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <Avatar name={r.author.name} image={r.author.image} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-stone-900">{r.author.name}</p>
                    {!r.isPublic && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                        <Lock className="h-3 w-3" />
                        {r.isAuthor ? t("reviews_awaiting_them") : "…"}
                      </span>
                    )}
                    {r.isPublic && r.rating != null && <StarsDisplay rating={r.rating} />}
                  </div>
                  <p className="text-xs text-stone-400">
                    {format(new Date(r.createdAt), "MMM d, yyyy")}
                  </p>
                  {hidden ? (
                    <p className="mt-2 text-sm italic text-stone-500">
                      {t("reviews_awaiting_them")}
                    </p>
                  ) : (
                    <>
                      {r.recommend != null && (
                        <p className="mt-1 text-xs font-medium text-teal-700">
                          {r.recommend ? t("reviews_would_recommend") : "—"}
                        </p>
                      )}
                      {r.comment && (
                        <p className="mt-2 text-sm leading-relaxed text-stone-700">{r.comment}</p>
                      )}
                      {(r.communication || r.reliability || r.respect) && (
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-stone-500">
                          {r.communication != null && (
                            <span>
                              {t("reviews_communication")}: {r.communication}/5
                            </span>
                          )}
                          {r.reliability != null && (
                            <span>
                              {t("reviews_reliability")}: {r.reliability}/5
                            </span>
                          )}
                          {r.respect != null && (
                            <span>
                              {t("reviews_respect")}: {r.respect}/5
                            </span>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  {r.response && (
                    <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500">
                        {t("reviews_public_response")}
                      </p>
                      <p className="mt-1 text-sm text-stone-700">{r.response}</p>
                    </div>
                  )}
                  {r.isTarget && r.isPublic && !r.response && (
                    <div className="mt-3 space-y-2">
                      <Textarea
                        value={responseDrafts[r.id] || ""}
                        onChange={(e) =>
                          setResponseDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                        }
                        placeholder={t("reviews_public_response")}
                        className="min-h-[60px] text-sm"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        disabled={responding === r.id}
                        onClick={() => sendResponse(r.id)}
                      >
                        {responding === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                        {t("reviews_respond")}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
