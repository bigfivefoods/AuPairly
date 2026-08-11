"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, FileStack, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Apply for a host job with preflight checklist (video + profile polish).
 */
export function ApplyPacketButton({
  toUserId,
  disabled,
}: {
  toUserId: string;
  disabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showChecklist, setShowChecklist] = useState(false);
  const [checks, setChecks] = useState<{
    video: boolean;
    videoConfirmed: boolean;
    city: boolean;
    photo: boolean;
  } | null>(null);

  async function loadChecks() {
    try {
      const res = await fetch("/api/me");
      const d = await res.json();
      if (!res.ok) return null;
      const video = Boolean(d.user?.videoIntroUrl);
      const videoConfirmed =
        Boolean(d.user?.videoIntroConfirmed) ||
        (typeof d.user?.videoIntroSeconds === "number" &&
          d.user.videoIntroSeconds >= 60);
      const profile = d.user?.aupairProfile || d.user?.familyProfile;
      return {
        video,
        videoConfirmed: video && videoConfirmed,
        city: Boolean(profile?.city),
        photo: Boolean(d.user?.image),
      };
    } catch {
      return null;
    }
  }

  async function openOrSend() {
    setBusy(true);
    setMsg("");
    const c = await loadChecks();
    setChecks(c);
    if (c && (!c.videoConfirmed || !c.city || !c.photo)) {
      setShowChecklist(true);
      setBusy(false);
      setMsg("Complete the checklist to apply with a strong packet.");
      return;
    }
    await send();
  }

  async function send() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId,
          message:
            "Please find my full application packet (profile, intro video, docs & references).",
        }),
      });
      const data = await res.json();
      if (res.status === 402) {
        setMsg(data.error || "Upgrade to send more applications");
        return;
      }
      if (!res.ok) {
        setMsg(data.error || "Failed");
        if (data.videoRequired) setShowChecklist(true);
        return;
      }
      setMsg("Application packet sent!");
      setShowChecklist(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled || busy}
        onClick={openOrSend}
        className="w-full sm:w-auto"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileStack className="h-4 w-4" />
        )}
        Send application packet
      </Button>
      <p className="mt-1.5 text-[11px] text-stone-500">
        Best packets: photo · city · 1+ min intro video · CV/docs in vault.
      </p>

      {showChecklist && checks && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          <p className="font-semibold">Before you apply</p>
          <ul className="mt-2 space-y-1.5">
            <CheckRow ok={checks.photo} label="Profile photo" href="/profile/edit" />
            <CheckRow ok={checks.city} label="City on profile" href="/profile/edit" />
            <CheckRow
              ok={checks.videoConfirmed}
              label="Intro video ≥ 1 minute"
              href="/trust"
            />
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/trust" className="btn-primary !py-1.5 !px-3 text-xs">
              Fix video intro
            </Link>
            {checks.videoConfirmed && checks.city && checks.photo && (
              <Button
                type="button"
                className="!py-1.5 !px-3 text-xs"
                disabled={busy}
                onClick={send}
              >
                Send now
              </Button>
            )}
          </div>
        </div>
      )}

      {msg && (
        <p className="mt-2 text-xs text-stone-600">
          {msg}{" "}
          {msg.toLowerCase().includes("video") && (
            <Link href="/trust" className="font-semibold text-teal-700 underline">
              Add video →
            </Link>
          )}
        </p>
      )}
    </div>
  );
}

function CheckRow({
  ok,
  label,
  href,
}: {
  ok: boolean;
  label: string;
  href: string;
}) {
  return (
    <li className="flex items-center gap-2">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      ) : (
        <Circle className="h-4 w-4 text-amber-600" />
      )}
      {ok ? (
        <span>{label}</span>
      ) : (
        <Link href={href} className="font-medium underline underline-offset-2">
          {label}
        </Link>
      )}
    </li>
  );
}
