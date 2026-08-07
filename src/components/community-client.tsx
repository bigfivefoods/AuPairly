"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  MapPin,
  Loader2,
  Check,
  X,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { AuPairCard } from "@/components/listing-cards";
import { PeerConnectButton } from "@/components/peer-connect-button";
import { EmptyState, PageHeader, Input, Button } from "@/components/ui";
import { proximityLabel, type PeerProximity } from "@/lib/community";
import { cn } from "@/lib/utils";

type NearbyItem = {
  id: string;
  userId: string;
  name: string;
  image?: string | null;
  headline?: string | null;
  peerIntro?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  nationality?: string | null;
  languages: string;
  age?: number | null;
  experienceYears?: number;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  safetyScore?: number | null;
  proximity: PeerProximity;
  connectStatus?: string;
  conversationId?: string | null;
};

type ConnectRow = {
  id: string;
  status: string;
  message?: string | null;
  fromUser: {
    id: string;
    name: string;
    image?: string | null;
    aupairProfile?: { id: string; city?: string | null; country?: string | null } | null;
  };
  toUser: {
    id: string;
    name: string;
    image?: string | null;
    aupairProfile?: { id: string; city?: string | null; country?: string | null } | null;
  };
};

export function CommunityClient({
  meLocation,
  openToPeerConnect = true,
  initialTab = "nearby",
}: {
  meLocation: { city?: string | null; region?: string | null; country?: string | null };
  openToPeerConnect?: boolean;
  initialTab?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || initialTab;

  const [q, setQ] = useState("");
  const [city, setCity] = useState(meLocation.city || "");
  const [items, setItems] = useState<NearbyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [received, setReceived] = useState<ConnectRow[]>([]);
  const [sent, setSent] = useState<ConnectRow[]>([]);
  const [reqLoading, setReqLoading] = useState(false);

  const loadNearby = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (city.trim()) params.set("city", city.trim());
      const res = await fetch(`/api/community/nearby?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load sitters nearby");
        setItems([]);
        return;
      }
      setItems(data.items || []);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [q, city]);

  const loadRequests = useCallback(async () => {
    setReqLoading(true);
    try {
      const [r, s] = await Promise.all([
        fetch("/api/community/connects?box=received").then((x) => x.json()),
        fetch("/api/community/connects?box=sent").then((x) => x.json()),
      ]);
      setReceived(r.connects || []);
      setSent(s.connects || []);
    } catch {
      /* ignore */
    } finally {
      setReqLoading(false);
    }
  }, []);

  useEffect(() => {
    // Always refresh request counts for the tab badge
    loadRequests();
  }, [loadRequests]);

  useEffect(() => {
    if (tab === "nearby") loadNearby();
  }, [tab, loadNearby]);

  async function respond(id: string, status: "ACCEPTED" | "DECLINED") {
    const res = await fetch(`/api/community/connects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (res.ok && status === "ACCEPTED" && data.conversationId) {
      router.push(`/messages/${data.conversationId}`);
      return;
    }
    await loadRequests();
  }

  const placeHint = [meLocation.city, meLocation.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="AuPair Connect"
        description="Meet other sitters in your area — make friends while you're abroad. This is peer community, not host matching."
      />

      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-orange-50 px-4 py-3 text-sm text-teal-900">
        <HeartHandshake className="h-5 w-5 shrink-0 text-teal-700" />
        <p>
          {placeHint
            ? `Showing sitters near ${placeHint}. Say hi, share tips, plan a coffee — especially if you're new in a foreign city.`
            : "Add your city on your profile so we can match you with sitters nearby."}
        </p>
        {!placeHint && (
          <Link href="/profile/edit" className="font-semibold text-teal-800 underline">
            Set location
          </Link>
        )}
      </div>

      {!openToPeerConnect && (
        <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          You&apos;re hidden from AuPair Connect.{" "}
          <Link href="/profile/edit" className="font-semibold underline">
            Turn on “Show me in AuPair Connect”
          </Link>{" "}
          so other sitters can find you too.
        </div>
      )}

      <div className="mt-6 flex gap-2 border-b border-stone-200" role="tablist">
        {(
          [
            { id: "nearby", label: "Sitters near me" },
            {
              id: "requests",
              label:
                received.filter((c) => c.status === "PENDING").length > 0
                  ? `Requests (${received.filter((c) => c.status === "PENDING").length})`
                  : "Requests",
            },
          ] as const
        ).map((t) => (
          <Link
            key={t.id}
            href={`/community?tab=${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            className={cn(
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id
                ? "border-teal-600 text-teal-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "nearby" && (
        <>
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end"
            onSubmit={(e) => {
              e.preventDefault();
              loadNearby();
            }}
          >
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium text-stone-600">City</span>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={meLocation.city || "e.g. Cape Town"}
              />
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1 block font-medium text-stone-600">Search</span>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Name, interests…"
              />
            </label>
            <Button type="submit" className="shrink-0">
              Find sitters
            </Button>
          </form>

          {loading ? (
            <div className="mt-16 flex justify-center text-stone-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <p className="mt-10 text-center text-red-600">{error}</p>
          ) : items.length === 0 ? (
            <EmptyState
              icon={<Users className="h-10 w-10" />}
              title="No sitters nearby yet"
              description="Try a broader city name, complete your location, or check back as more sitters join AuPair Connect."
            />
          ) : (
            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => (
                <li key={p.id} className="flex flex-col">
                  <AuPairCard
                    id={p.id}
                    name={p.name}
                    image={p.image}
                    headline={p.peerIntro || p.headline}
                    city={p.city}
                    region={p.region}
                    country={p.country}
                    nationality={p.nationality}
                    languages={p.languages}
                    experienceYears={p.experienceYears ?? 0}
                    age={p.age}
                    isVerified={p.isVerified}
                    rating={p.rating}
                    reviewCount={p.reviewCount}
                    safetyScore={p.safetyScore}
                  />
                  <div className="mt-2 flex items-center justify-between gap-2 px-1">
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-semibold text-teal-800">
                      <MapPin className="h-3 w-3" />
                      {proximityLabel(p.proximity)}
                    </span>
                    <PeerConnectButton
                      toUserId={p.userId}
                      toName={p.name}
                      variant="secondary"
                      initialStatus={
                        (p.connectStatus as
                          | "NONE"
                          | "PENDING"
                          | "ACCEPTED"
                          | "DECLINED"
                          | "WITHDRAWN") || "NONE"
                      }
                      conversationId={p.conversationId}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === "requests" && (
        <div className="mt-8 space-y-10">
          {reqLoading ? (
            <div className="flex justify-center py-12 text-stone-500">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <section>
                <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-stone-900">
                  <Sparkles className="h-5 w-5 text-teal-600" />
                  Incoming
                </h2>
                {received.filter((c) => c.status === "PENDING").length === 0 ? (
                  <p className="mt-3 text-sm text-stone-500">No pending requests.</p>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {received
                      .filter((c) => c.status === "PENDING")
                      .map((c) => (
                        <li
                          key={c.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-4"
                        >
                          <div>
                            <p className="font-semibold text-stone-900">{c.fromUser.name}</p>
                            <p className="text-sm text-stone-500">
                              {[c.fromUser.aupairProfile?.city, c.fromUser.aupairProfile?.country]
                                .filter(Boolean)
                                .join(", ") || "Sitter"}
                            </p>
                            {c.message && (
                              <p className="mt-1 text-sm text-stone-600">&ldquo;{c.message}&rdquo;</p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button type="button" onClick={() => respond(c.id, "ACCEPTED")}>
                              <Check className="h-4 w-4" />
                              Accept
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => respond(c.id, "DECLINED")}
                            >
                              <X className="h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <section>
                <h2 className="font-display text-lg font-semibold text-stone-900">
                  You sent
                </h2>
                {sent.length === 0 ? (
                  <p className="mt-3 text-sm text-stone-500">No outgoing connects yet.</p>
                ) : (
                  <ul className="mt-4 space-y-2 text-sm">
                    {sent.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-stone-100 bg-stone-50 px-3 py-2"
                      >
                        <span className="font-medium text-stone-800">{c.toUser.name}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                          {c.status.toLowerCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </div>
      )}
    </div>
  );
}
