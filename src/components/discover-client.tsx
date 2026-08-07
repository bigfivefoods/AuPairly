"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Heart,
  X,
  Star,
  Loader2,
  MapPin,
  BadgeCheck,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Button } from "@/components/ui";
import { parseJsonArray, cn } from "@/lib/utils";
import { SERVICE_LIST, type ServiceId } from "@/lib/services";
import { parseServices } from "@/lib/services";
import { ServiceBadges } from "@/components/service-picker";

type Card = {
  userId: string;
  profileId: string;
  type: "AUPAIR" | "FAMILY";
  name: string;
  image?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  nationality?: string | null;
  languages?: string;
  age?: number | null;
  isVerified?: boolean;
  isFeatured?: boolean;
  experienceYears?: number;
  childrenCount?: number;
  childrenAges?: string;
  pocketMoney?: number | null;
  rating?: number;
  matchScore?: number;
  matchReasons?: string[];
  placementVerified?: boolean;
  safetyScore?: number;
  services?: string | null;
};

export function DiscoverClient({
  role,
  planId,
}: {
  role: string;
  planId: string;
}) {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [match, setMatch] = useState<{ conversationId: string } | null>(null);
  const [upgradeMsg, setUpgradeMsg] = useState("");
  const [error, setError] = useState("");
  const [service, setService] = useState<ServiceId | "">("");
  const [gate, setGate] = useState<{
    ok: boolean;
    percent?: number;
    blockers?: string[];
    reason?: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = service ? `?service=${service}` : "";
      const res = await fetch(`/api/discover${q}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load Discover");
        return;
      }
      if (data.gate && data.gate.ok === false) {
        setGate(data.gate);
        setCards([]);
      } else {
        setGate(data.gate || { ok: true });
        setCards(data.cards || []);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [service]);

  useEffect(() => {
    load();
  }, [load]);

  async function swipe(direction: "LIKE" | "PASS" | "SUPER") {
    const card = cards[0];
    if (!card || busy) return;
    setBusy(true);
    setUpgradeMsg("");
    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: card.userId, direction }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setUpgradeMsg(data.error || "Upgrade to continue swiping");
        return;
      }
      if (!res.ok) {
        setError(data.error || "Swipe failed");
        return;
      }
      setCards((c) => c.slice(1));
      if (data.matched && data.conversationId) {
        setMatch({ conversationId: data.conversationId });
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const filterBar = (
    <div className="scroll-x-touch mb-4 -mx-1 px-1 pb-1">
      <button
        type="button"
        onClick={() => setService("")}
        className={cn(
          "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
          !service
            ? "border-teal-600 bg-teal-600 text-white"
            : "border-stone-200 bg-white text-stone-600 hover:border-teal-300"
        )}
      >
        All services
      </button>
      {SERVICE_LIST.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => setService(s.id)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            service === s.id
              ? "border-teal-600 bg-teal-600 text-white"
              : "border-stone-200 bg-white text-stone-600 hover:border-teal-300"
          )}
        >
          {s.shortName}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div>
        {filterBar}
        <div className="flex h-[480px] items-center justify-center rounded-3xl border border-stone-200 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
      </div>
    );
  }

  if (gate && gate.ok === false) {
    return (
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-800">
          Profile gate · {gate.percent ?? 0}% complete
        </p>
        <h2 className="mt-2 font-display text-2xl font-semibold text-stone-900">
          Finish your profile to Discover
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-600">
          {gate.reason ||
            "We require a photo, location, bio, and an Active listing so matches are high quality."}
        </p>
        {gate.blockers && gate.blockers.length > 0 && (
          <ul className="mx-auto mt-4 max-w-sm space-y-1 text-left text-sm text-stone-700">
            {gate.blockers.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-amber-600">•</span>
                {b}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/profile/edit" className="btn-primary">
            Complete profile
          </Link>
          <Link href="/onboarding" className="btn-secondary">
            Re-run setup
          </Link>
          <Link href="/verification" className="btn-secondary">
            Get verified
          </Link>
        </div>
        <p className="mt-4 text-xs text-stone-400">
          Plan: {planId} · browse marketplace still works without Discover.
        </p>
      </div>
    );
  }

  if (match) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-600 to-teal-800 px-6 py-16 text-center text-white shadow-xl">
        <Sparkles className="h-12 w-12 text-amber-300" />
        <h2 className="mt-4 font-display text-3xl font-semibold">It&apos;s a match!</h2>
        <p className="mt-2 max-w-xs text-teal-100">
          You both liked each other. Start the conversation and talk placement details.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={`/messages/${match.conversationId}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-teal-800"
          >
            <MessageCircle className="h-4 w-4" />
            Message now
          </Link>
          <button
            type="button"
            onClick={() => setMatch(null)}
            className="rounded-full border border-white/40 px-6 py-3 font-semibold text-white"
          >
            Keep swiping
          </button>
        </div>
      </div>
    );
  }

  const card = cards[0];

  if (!card) {
    return (
      <div>
        {filterBar}
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold text-stone-800">No more cards</p>
          <p className="mt-2 text-sm text-stone-500">
            {service
              ? "No more people in this category. Try another service or browse all listings."
              : "You've seen everyone for now. Check back later or browse the full marketplace."}
          </p>
          <Link
            href={role === "AUPAIR" ? "/browse/families" : "/browse/aupairs"}
            className="btn-primary mt-6 inline-flex"
          >
            Browse all listings
          </Link>
        </div>
      </div>
    );
  }

  const langs = parseJsonArray(card.languages || "[]").slice(0, 4);
  const ages = parseJsonArray(card.childrenAges || "[]");
  const cardServices = parseServices(card.services);

  return (
    <div>
      {filterBar}
      {upgradeMsg && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {upgradeMsg}{" "}
          <Link href="/pricing" className="font-semibold underline">
            Upgrade with Paystack →
          </Link>
        </div>
      )}
      {error && (
        <p className="mb-4 text-center text-sm text-red-600">{error}</p>
      )}
      <div className="relative mx-auto h-[min(70dvh,520px)] w-full max-w-md sm:h-[520px]">
        {/* Stack shadow cards */}
        {cards.slice(1, 3).map((c, i) => (
          <div
            key={c.userId}
            className="absolute inset-0 rounded-3xl border border-stone-200 bg-white shadow-md"
            style={{
              transform: `scale(${1 - (i + 1) * 0.03}) translateY(${(i + 1) * 8}px)`,
              zIndex: 10 - i,
            }}
          />
        ))}

        <div className="absolute inset-0 z-20 flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl">
          <div className="relative h-40 shrink-0 bg-gradient-to-br from-teal-100 via-orange-50 to-stone-100 sm:h-64">
            <div className="absolute inset-0 flex items-center justify-center">
              <Avatar
                name={card.name}
                image={card.image}
                size="xl"
                className="!h-20 !w-20 !text-2xl !ring-4 !ring-white shadow-lg sm:!h-28 sm:!w-28 sm:!text-3xl"
              />
            </div>
            <div className="absolute left-2 top-2 flex max-w-[70%] flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
              {card.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-semibold text-white sm:px-2.5 sm:text-xs">
                  <BadgeCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Verified
                </span>
              )}
              {card.isFeatured && (
                <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white sm:px-2.5 sm:text-xs">
                  Featured
                </span>
              )}
              {card.placementVerified && (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white sm:px-2.5 sm:text-xs">
                  Placement verified
                </span>
              )}
            </div>
            {card.matchScore != null && (
              <div className="absolute bottom-3 right-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-teal-800 shadow">
                {card.matchScore}% match
              </div>
            )}
            {card.safetyScore != null && (
              <div className="absolute bottom-3 left-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold text-stone-600 shadow">
                Trust {card.safetyScore}
              </div>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h2 className="font-display text-2xl font-semibold text-stone-900">
              {card.name}
              {card.age ? (
                <span className="font-normal text-stone-500">, {card.age}</span>
              ) : null}
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-stone-500">{card.headline}</p>
            <ServiceBadges services={cardServices} className="mt-2" />
            {card.matchReasons && card.matchReasons.length > 0 && (
              <ul className="mt-2 space-y-1 rounded-xl bg-teal-50 px-3 py-2 text-xs text-teal-900">
                <li className="font-semibold text-teal-800">Why you match</li>
                {card.matchReasons.slice(0, 3).map((r) => (
                  <li key={r} className="flex gap-1.5">
                    <span className="text-teal-600">✓</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 flex items-center gap-1 text-xs text-stone-500">
              <MapPin className="h-3.5 w-3.5" />
              {[card.city, card.country].filter(Boolean).join(", ") || "Location TBD"}
            </p>
            {card.type === "AUPAIR" && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {card.nationality && <Badge>{card.nationality}</Badge>}
                {card.experienceYears != null && (
                  <Badge>{card.experienceYears}+ yrs exp</Badge>
                )}
                {langs.map((l) => (
                  <Badge key={l}>{l}</Badge>
                ))}
              </div>
            )}
            {card.type === "FAMILY" && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <Badge>
                  {card.childrenCount} kid{(card.childrenCount || 0) === 1 ? "" : "s"}
                  {ages.length ? ` · ${ages.join(", ")}` : ""}
                </Badge>
                {card.pocketMoney != null && (
                  <Badge variant="success">R{card.pocketMoney}/wk</Badge>
                )}
              </div>
            )}
            <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-stone-600">
              {card.bio || "No bio yet — message them to learn more."}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Link
                href={
                  card.type === "AUPAIR"
                    ? `/browse/aupairs/${card.profileId}`
                    : `/browse/families/${card.profileId}`
                }
                className="text-xs font-semibold text-teal-700 hover:underline"
              >
                View full profile →
              </Link>
              <button
                type="button"
                className="text-xs font-semibold text-stone-600 hover:text-teal-700"
                onClick={async () => {
                  await fetch("/api/shortlist", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ targetUserId: card.userId }),
                  });
                }}
              >
                + Shortlist
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-md items-center justify-center gap-5">
        <button
          type="button"
          disabled={busy}
          onClick={() => swipe("PASS")}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border-2 border-stone-200 bg-white text-stone-500 shadow-md transition hover:border-stone-400 hover:scale-105",
            busy && "opacity-50"
          )}
          aria-label="Pass"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          type="button"
          disabled={busy || planId === "FREE"}
          onClick={() => swipe("SUPER")}
          title={planId === "FREE" ? "Super Like on paid plans" : "Super Like"}
          className={cn(
            "flex h-12 w-12 items-center justify-center rounded-full border-2 border-sky-200 bg-white text-sky-500 shadow-md transition hover:scale-105",
            (busy || planId === "FREE") && "opacity-40"
          )}
          aria-label="Super like"
        >
          <Star className="h-5 w-5 fill-sky-400" />
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => swipe("LIKE")}
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg transition hover:scale-105",
            busy && "opacity-50"
          )}
          aria-label="Like"
        >
          {busy ? (
            <Loader2 className="h-7 w-7 animate-spin" />
          ) : (
            <Heart className="h-8 w-8 fill-white" />
          )}
        </button>
      </div>

      {upgradeMsg && (
        <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {upgradeMsg}{" "}
          <Link href="/pricing" className="font-bold underline">
            Upgrade now
          </Link>
        </div>
      )}
      {error && (
        <p className="mt-4 text-center text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
