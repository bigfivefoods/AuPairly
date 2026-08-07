"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Loader2,
  Mail,
  ShieldCheck,
  Star,
  UserPlus,
} from "lucide-react";
import { Badge, Button, Card, Input, Label, PageHeader } from "@/components/ui";

type RefRow = {
  id: string;
  refereeEmail: string;
  refereeName: string | null;
  status: string;
  rating: number | null;
  comment: string | null;
  relationship: string | null;
  token: string;
  submittedAt: string | null;
  createdAt: string;
};

export default function ReferencesPage() {
  const [rows, setRows] = useState<RefRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [refName, setRefName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [lastLink, setLastLink] = useState("");
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/references", { credentials: "same-origin" });
      if (res.status === 401) {
        window.location.href = "/login?next=/references";
        return;
      }
      const d = await res.json();
      if (res.ok) {
        // aboutMe is refs about current user (same as requested for self-requests)
        const list = (d.aboutMe || d.requested || []) as RefRow[];
        setRows(list);
      }
    } catch {
      setErr("Could not load references");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function requestRef(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setErr("");
    setLastLink("");
    try {
      const res = await fetch("/api/references", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ refereeEmail: email, refereeName: refName }),
      });
      const d = await res.json();
      if (!res.ok) {
        setErr(d.error || "Could not create reference request");
        return;
      }
      setLastLink(d.submitUrl || "");
      setMsg(
        d.emailed
          ? "Invite emailed to your referee. You can also copy the link below."
          : "Reference link created — copy and send it to your referee."
      );
      setEmail("");
      setRefName("");
      await load();
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  async function copyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  const site =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://www.aupairly.me";
  const linkFor = (token: string) => `${site}/references/submit/${token}`;

  const submitted = rows.filter((r) => r.status === "SUBMITTED");
  const pending = rows.filter((r) => r.status === "PENDING");

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Trust"
        title="References"
        description="Ask past employers or families for a short reference. Submitted refs boost your safety score and completeness."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">Submitted</p>
          <p className="mt-1 font-display text-3xl font-semibold text-emerald-700">
            {submitted.length}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">Pending</p>
          <p className="mt-1 font-display text-3xl font-semibold text-amber-700">
            {pending.length}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">Goal</p>
          <p className="mt-1 font-display text-lg font-semibold text-stone-800">
            {submitted.length >= 1 ? (
              <span className="inline-flex items-center gap-1 text-emerald-700">
                <ShieldCheck className="h-5 w-5" /> On track
              </span>
            ) : (
              "Get 1+ submitted"
            )}
          </p>
        </Card>
      </div>

      <Card className="mb-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <UserPlus className="h-5 w-5 text-teal-700" />
          Request a reference
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Enter someone who knows your work with kids, care, homes, or pets. They
          get a private form link — no account required.
        </p>
        <form onSubmit={requestRef} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Their name</Label>
            <Input
              value={refName}
              onChange={(e) => setRefName(e.target.value)}
              placeholder="e.g. Sarah Johnson"
            />
          </div>
          <div>
            <Label>Their email</Label>
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="referee@email.com"
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={busy || !email.includes("@")}>
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Create invite link
            </Button>
          </div>
        </form>
        {msg && (
          <p className="mt-3 text-sm font-medium text-emerald-700">{msg}</p>
        )}
        {err && <p className="mt-3 text-sm text-red-600">{err}</p>}
        {lastLink && (
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-teal-100 bg-teal-50 p-3 sm:flex-row sm:items-center">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-teal-900">
              {lastLink}
            </p>
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              onClick={() => copyLink(lastLink)}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" /> Copy link
                </>
              )}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        <h2 className="font-display text-lg font-semibold">Your references</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">
            No references yet. Request one above to raise your profile completion
            and trust score.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {r.refereeName || r.refereeEmail}
                    </p>
                    {r.refereeName && (
                      <p className="text-xs text-stone-500">{r.refereeEmail}</p>
                    )}
                    {r.relationship && (
                      <p className="mt-0.5 text-xs text-stone-500">
                        {r.relationship}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      r.status === "SUBMITTED"
                        ? "verified"
                        : r.status === "PENDING"
                          ? "warning"
                          : "default"
                    }
                  >
                    {r.status}
                  </Badge>
                </div>
                {r.status === "SUBMITTED" && (
                  <div className="mt-2 text-sm text-stone-700">
                    {r.rating != null && (
                      <p className="flex items-center gap-1 font-medium">
                        <Star className="h-3.5 w-3.5 text-amber-500" />
                        {r.rating}/5
                      </p>
                    )}
                    {r.comment && (
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">
                        “{r.comment}”
                      </p>
                    )}
                  </div>
                )}
                {r.status === "PENDING" && (
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <p className="min-w-0 flex-1 break-all font-mono text-[11px] text-stone-500">
                      {linkFor(r.token)}
                    </p>
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0 !px-3 !py-1.5 text-xs"
                      onClick={() => copyLink(linkFor(r.token))}
                    >
                      <Copy className="h-3.5 w-3.5" /> Copy
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="mt-6 text-center text-sm text-stone-500">
        Also see{" "}
        <Link href="/trust" className="font-semibold text-teal-700 hover:underline">
          Safety &amp; trust
        </Link>{" "}
        for video intro and placement-verified status ·{" "}
        <Link
          href="/verification"
          className="font-semibold text-teal-700 hover:underline"
        >
          ID verification
        </Link>
      </p>
    </div>
  );
}
