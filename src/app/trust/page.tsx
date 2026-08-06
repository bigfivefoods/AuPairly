"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Badge, Button, Card, Input, Label, PageHeader } from "@/components/ui";

export default function TrustPage() {
  const [data, setData] = useState<{
    safetyScore?: number;
    placementVerified?: boolean;
    videoIntroUrl?: string | null;
    referenceCount?: number;
  } | null>(null);
  const [video, setVideo] = useState("");
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
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveVideo() {
    setBusy(true);
    await fetch("/api/trust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoIntroUrl: video }),
    });
    await load();
    setBusy(false);
    setMsg("Video intro saved. Safety score updated.");
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

      <Card className="mt-6">
        <h3 className="font-display text-lg font-semibold">Video intro (URL)</h3>
        <p className="mt-1 text-sm text-stone-500">
          Paste a YouTube/Vimeo/unlisted link (30–60s). Upload hosting can plug into Supabase later.
        </p>
        <Input className="mt-3" value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://..." />
        <Button className="mt-3" disabled={busy} onClick={saveVideo}>
          Save video intro
        </Button>
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
