"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, ImagePlus } from "lucide-react";
import { PhotoUpload } from "@/components/photo-upload";

/**
 * Editable gallery that persists via /api/upload (add) and /api/profile/photos (remove).
 * Keeps local state so photos stay visible after upload and reloads from the server.
 */
export function GalleryEditor({
  name,
  initialPhotos = [],
}: {
  name: string;
  initialPhotos?: string[];
}) {
  const [photos, setPhotos] = useState<string[]>(() =>
    Array.isArray(initialPhotos) ? initialPhotos.filter(Boolean) : []
  );
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const hydratedFromServer = useRef(false);

  const applyList = useCallback((list: string[]) => {
    setPhotos(list.filter((u) => typeof u === "string" && u));
  }, []);

  // Load authoritative list from API on mount (survives stale RSC props)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/profile/photos", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (Array.isArray(data.photos) && !cancelled) {
          applyList(data.photos);
          hydratedFromServer.current = true;
        }
      } catch {
        /* keep initial */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [applyList]);

  // Sync when server revalidates with richer initial data (never wipe a longer local list)
  useEffect(() => {
    if (!Array.isArray(initialPhotos)) return;
    const next = initialPhotos.filter(Boolean);
    setPhotos((prev) => {
      // After mount fetch, only accept SSR updates that add photos or match length
      if (hydratedFromServer.current && next.length < prev.length) {
        return prev;
      }
      // Prefer union so a mid-upload refresh does not drop the new URL
      if (next.length === 0 && prev.length > 0) return prev;
      const set = new Set([...prev, ...next]);
      // If server sent a full list of equal/greater size, trust server order
      if (next.length >= prev.length && next.every((u) => set.has(u))) {
        return next;
      }
      return Array.from(set).slice(-12);
    });
  }, [initialPhotos]);

  async function onUploaded(url: string, meta?: { photos?: string[] }) {
    setError("");
    setMessage("Photo saved");
    if (Array.isArray(meta?.photos) && meta.photos.length > 0) {
      applyList(meta.photos);
    } else {
      setPhotos((prev) => {
        if (prev.includes(url)) return prev;
        return [...prev, url].slice(-12);
      });
      // Confirm server list — never replace with empty if we just added one
      try {
        const res = await fetch("/api/profile/photos", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            applyList(data.photos);
          }
        }
      } catch {
        /* keep local list */
      }
    }
    setTimeout(() => setMessage(""), 2500);
  }

  async function remove(url: string) {
    setRemoving(url);
    setError("");
    try {
      const res = await fetch("/api/profile/photos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ url }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not remove photo");
        return;
      }
      if (Array.isArray(data.photos)) {
        applyList(data.photos);
      } else {
        setPhotos((prev) => prev.filter((p) => p !== url));
      }
      setMessage("Photo removed");
      setTimeout(() => setMessage(""), 2000);
    } catch {
      setError("Network error removing photo");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
          {photos.map((src) => (
            <div
              key={src}
              className="group relative aspect-square overflow-hidden rounded-xl border border-stone-200 bg-stone-100"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="Gallery" className="h-full w-full object-cover" />
              <button
                type="button"
                disabled={removing === src}
                onClick={() => remove(src)}
                className="absolute right-2 top-2 rounded-full bg-stone-900/75 p-1.5 text-white opacity-100 shadow transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Remove photo"
              >
                {removing === src ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-stone-200 bg-stone-50 px-4 py-8 text-center">
          <ImagePlus className="h-8 w-8 text-stone-300" />
          <p className="mt-2 text-sm text-stone-500">No gallery photos yet</p>
          <p className="text-xs text-stone-400">
            Add up to 12 images — they save as soon as you upload
          </p>
        </div>
      )}

      <PhotoUpload
        name={name}
        kind="gallery"
        showPreview={false}
        onUploaded={onUploaded}
      />

      {message && (
        <p className="text-sm font-medium text-emerald-700">{message}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {photos.length > 0 && (
        <p className="text-xs text-stone-400">
          {photos.length}/12 photos saved to your listing.
        </p>
      )}
    </div>
  );
}
