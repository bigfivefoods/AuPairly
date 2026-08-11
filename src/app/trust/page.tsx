"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Input, Label, PageHeader } from "@/components/ui";
import { VideoIntroRecorder } from "@/components/video-intro-recorder";

export default function TrustPage() {
  const [data, setData] = useState<{
    safetyScore?: number;
    placementVerified?: boolean;
    videoIntroUrl?: string | null;
    videoIntroSeconds?: number | null;
    videoIntroConfirmed?: boolean;
    cvUrl?: string | null;
    referenceCount?: number;
    minVideoSeconds?: number;
  } | null>(null);
  const [video, setVideo] = useState("");
  const [seconds, setSeconds] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [cvUrl, setCvUrl] = useState("");
  const [email, setEmail] = useState("");
  const [refName, setRefName] = useState("");
  const [submitUrl, setSubmitUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/trust");
    const d = await res.json();
    if (res.ok) {
      setData(d);
      setVideo(d.videoIntroUrl || "");
      setSeconds(d.videoIntroSeconds != null ? String(d.videoIntroSeconds) : "");
      setConfirmed(Boolean(d.videoIntroConfirmed));
      setCvUrl(d.cvUrl || "");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveVideo() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoIntroUrl: video,
        videoIntroSeconds: seconds ? Number(seconds) : null,
        videoIntroConfirmed: confirmed,
      }),
    });
    await load();
    setBusy(false);
    if (!res.ok) {
      setMsg("Could not save video intro.");
      return;
    }
    setMsg(
      confirmed
        ? "Video intro saved (1+ min confirmed). You can apply for jobs."
        : "Video intro saved. Confirm it is at least 1 minute to unlock applications."
    );
  }

  async function saveCv() {
    setBusy(true);
    setMsg("");
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvUrl }),
    });
    await load();
    setBusy(false);
    setMsg("CV link saved.");
  }

  async function requestRef() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/references", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refereeEmail: email, refereeName: refName }),
    });
    const d = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(d.error || "Failed");
      return;
    }
    setSubmitUrl(d.submitUrl);
    setMsg("Reference link created — send it to your referee.");
  }

  if (!data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Trust stack"
        title="Safety & verification"
        description="Video intro, references, and placement-verified badge for stronger matches."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">Safety score</p>
          <p className="mt-1 font-display text-3xl font-semibold text-teal-700">
            {data.safetyScore}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">References</p>
          <p className="mt-1 font-display text-3xl font-semibold">{data.referenceCount}</p>
        </Card>
        <Card className="text-center">
          <p className="text-xs uppercase text-stone-400">Placement verified</p>
          <div className="mt-2 flex justify-center">
            {data.placementVerified ? (
              <Badge variant="verified">
                <ShieldCheck className="h-3.5 w-3.5" /> Yes
              </Badge>
            ) : (
              <Badge variant="warning">Not yet</Badge>
            )}
          </div>
          <p className="mt-2 text-[11px] text-stone-400">Needs ID/selfie + 2 refs + video or profile verify</p>
        </Card>
      </div>

      <Card className="mt-6 space-y-4">
        <div>
          <h3 className="font-display text-lg font-semibold">
            Intro video (min 1 minute)
          </h3>
          <p className="mt-1 text-sm text-stone-500">
            Required to apply for jobs. Record in the browser, upload a file, or paste a
            YouTube/Vimeo link. Introduce yourself and your experience.
          </p>
        </div>

        <VideoIntroRecorder
          initialUrl={data.videoIntroUrl}
          onSaved={(url, secs) => {
            setVideo(url);
            setSeconds(String(secs));
            setConfirmed(secs >= 60);
            void load();
          }}
        />

        <div className="border-t border-stone-100 pt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
            Or paste a link
          </p>
          <Input
            value={video}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="https://youtube.com/… or Vimeo"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Length (seconds)</Label>
              <Input
                type="number"
                min={60}
                value={seconds}
                onChange={(e) => setSeconds(e.target.value)}
                placeholder="e.g. 90"
              />
            </div>
            <label className="flex items-end gap-2 pb-2 text-sm text-stone-700">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-teal-600"
              />
              I confirm this video is at least 1 minute
            </label>
          </div>
          <Button disabled={busy} onClick={saveVideo}>
            Save link
          </Button>
        </div>
      </Card>

      <Card className="mt-6 space-y-3">
        <h3 className="font-display text-lg font-semibold">CV / resume</h3>
        <p className="text-sm text-stone-500">
          Link or upload path to your CV. You can also store PDFs under Documents → CV (owner-only
          vault for certificates).
        </p>
        <Input
          value={cvUrl}
          onChange={(e) => setCvUrl(e.target.value)}
          placeholder="https://… or upload via Documents"
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={saveCv}>
            Save CV link
          </Button>
          <a href="/documents" className="btn-secondary text-sm">
            Document vault →
          </a>
        </div>
      </Card>

      <Card className="mt-6">
        <h3 className="font-display text-lg font-semibold">Request a reference</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Referee name</Label>
            <Input value={refName} onChange={(e) => setRefName(e.target.value)} />
          </div>
          <div>
            <Label>Referee email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>
        <Button className="mt-3" disabled={busy || !email} onClick={requestRef}>
          Create reference link
        </Button>
        {submitUrl && (
          <p className="mt-3 break-all text-xs text-teal-800 bg-teal-50 rounded-xl p-3">{submitUrl}</p>
        )}
      </Card>

      {msg && <p className="mt-4 text-sm text-stone-600">{msg}</p>}
    </div>
  );
}
