"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Camera, Loader2 } from "lucide-react";
import { Avatar, Button } from "@/components/ui";

export function PhotoUpload({
  name,
  currentImage,
  onUploaded,
  kind = "avatar",
}: {
  name: string;
  currentImage?: string | null;
  onUploaded?: (url: string) => void;
  kind?: "avatar" | "cover" | "gallery" | "document";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { update: updateSession } = useSession();

  // Keep preview in sync when parent reloads profile data after save
  useEffect(() => {
    setPreview(currentImage || "");
  }, [currentImage]);

  async function onFile(file: File | null) {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", kind);
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }
      setPreview(data.url);
      onUploaded?.(data.url);

      // Push photo into the Auth.js session so navbar/dashboard show it immediately
      if (kind === "avatar" && data.url) {
        try {
          await updateSession?.({ image: data.url });
          // Force clients that read /api/me to pick up the new URL
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("aupairly:avatar-updated", { detail: { url: data.url } })
            );
          }
        } catch {
          // Session update is best-effort; page refresh still works
        }
      }
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
      {kind === "avatar" ? (
        <Avatar name={name} image={preview || null} size="xl" />
      ) : (
        <div className="h-24 w-40 overflow-hidden rounded-xl bg-stone-100">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Cover" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-stone-400">
              No cover
            </div>
          )}
        </div>
      )}
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={
            kind === "document"
              ? "image/jpeg,image/png,image/webp,image/gif,application/pdf"
              : "image/jpeg,image/png,image/webp,image/gif"
          }
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => inputRef.current?.click()}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          {kind === "avatar"
            ? "Upload photo"
            : kind === "cover"
              ? "Upload cover"
              : kind === "gallery"
                ? "Add gallery photo"
                : "Upload document"}
        </Button>
        <p className="mt-1.5 text-xs text-stone-400">
          {kind === "document" ? "Image or PDF · max 5 MB" : "JPEG, PNG, WebP · max 5 MB"}
          {process.env.NEXT_PUBLIC_SUPABASE_URL ? " · Supabase Storage" : ""}
        </p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
