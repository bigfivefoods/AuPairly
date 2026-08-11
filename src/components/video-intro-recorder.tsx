"use client";

/**
 * Record a short intro video in-browser (MediaRecorder) or upload a file.
 * Saves via /api/upload kind=video then /api/trust.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Video, Square, Upload, CheckCircle2 } from "lucide-react";
import { Button, Label } from "@/components/ui";

const MIN_SECONDS = 60;

export function VideoIntroRecorder({
  initialUrl,
  onSaved,
}: {
  initialUrl?: string | null;
  onSaved?: (url: string, seconds: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialUrl || null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(
      Boolean(navigator.mediaDevices?.getUserMedia) &&
        typeof MediaRecorder !== "undefined"
    );
  }, []);

  useEffect(() => {
    return () => {
      mediaRef.current?.getTracks().forEach((t) => t.stop());
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!recording) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [recording]);

  const stopStream = useCallback(() => {
    mediaRef.current?.getTracks().forEach((t) => t.stop());
    mediaRef.current = null;
  }, []);

  async function startRecording() {
    setError("");
    setMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 720 } },
        audio: true,
      });
      mediaRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : "";
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      recorderRef.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stopStream();
        if (videoRef.current) videoRef.current.srcObject = null;
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        // Auto-upload
        await uploadBlob(blob, Math.max(elapsed, 1));
      };
      setElapsed(0);
      setRecording(true);
      rec.start(500);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Camera/mic permission denied. Use file upload instead."
      );
    }
  }

  function stopRecording() {
    if (recorderRef.current && recording) {
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  async function uploadBlob(blob: Blob, seconds: number) {
    setBusy(true);
    setError("");
    try {
      const file = new File([blob], `intro-${Date.now()}.webm`, {
        type: blob.type || "video/webm",
      });
      const fd = new FormData();
      fd.set("file", file);
      fd.set("kind", "video");
      const up = await fetch("/api/upload", { method: "POST", body: fd });
      const upData = await up.json();
      if (!up.ok) {
        setError(upData.error || "Upload failed");
        setBusy(false);
        return;
      }
      const confirmed = seconds >= MIN_SECONDS;
      const res = await fetch("/api/trust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoIntroUrl: upData.url,
          videoIntroSeconds: seconds,
          videoIntroConfirmed: confirmed,
        }),
      });
      if (!res.ok) {
        setError("Saved file but could not update profile");
        setBusy(false);
        return;
      }
      setPreviewUrl(upData.url);
      setMsg(
        confirmed
          ? "Video saved — applications unlocked (1+ min)."
          : `Video saved (${seconds}s). Record at least ${MIN_SECONDS}s to unlock applications.`
      );
      onSaved?.(upData.url, seconds);
    } catch {
      setError("Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | null) {
    if (!file) return;
    setError("");
    // Estimate duration if possible
    let seconds = MIN_SECONDS; // assume ok unless we can measure
    try {
      const url = URL.createObjectURL(file);
      const v = document.createElement("video");
      v.preload = "metadata";
      await new Promise<void>((resolve, reject) => {
        v.onloadedmetadata = () => {
          seconds = Math.round(v.duration) || MIN_SECONDS;
          resolve();
        };
        v.onerror = () => reject(new Error("metadata"));
        v.src = url;
      });
      URL.revokeObjectURL(url);
    } catch {
      /* use default */
    }
    setElapsed(seconds);
    await uploadBlob(file, seconds);
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-900 aspect-video relative">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          playsInline
          muted={recording}
          controls={!recording && Boolean(previewUrl)}
          src={!recording && previewUrl && !previewUrl.startsWith("blob:") ? previewUrl : undefined}
        />
        {!recording && !previewUrl && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 text-sm p-4 text-center">
            <Video className="h-8 w-8 mb-2 opacity-70" />
            Record yourself (min 1 minute) or upload a file
          </div>
        )}
        {recording && (
          <div className="absolute left-3 top-3 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            ● REC {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {supported && !recording && (
          <Button type="button" onClick={startRecording} disabled={busy}>
            <Video className="h-4 w-4" />
            Record intro
          </Button>
        )}
        {recording && (
          <Button type="button" variant="secondary" onClick={stopRecording}>
            <Square className="h-4 w-4" />
            Stop &amp; save
          </Button>
        )}
        <Label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50">
          <Upload className="h-4 w-4" />
          Upload video
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={busy || recording}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </Label>
      </div>

      {busy && (
        <p className="flex items-center gap-2 text-sm text-stone-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
        </p>
      )}
      {msg && (
        <p className="flex items-center gap-2 text-sm text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> {msg}
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-stone-400">
        Tip: smile, say your name, city, experience, and what you&apos;re looking for.
        Aim for {MIN_SECONDS}+ seconds. Max ~50 MB.
      </p>
    </div>
  );
}
