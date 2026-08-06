"use client";

import { useRef, useState } from "react";
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
  kind?: "avatar" | "cover";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(currentImage || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
          accept="image/jpeg,image/png,image/webp,image/gif"
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
          {kind === "avatar" ? "Upload photo" : "Upload cover"}
        </Button>
        <p className="mt-1.5 text-xs text-stone-400">JPEG, PNG, WebP · max 2.5 MB</p>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
