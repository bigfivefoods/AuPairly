"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Simple lightbox gallery for profile photo grids.
 */
export function PhotoGallery({
  photos,
  altPrefix = "Photo",
  className,
}: {
  photos: string[];
  altPrefix?: string;
  className?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;

  const i = open ?? 0;

  function prev() {
    setOpen((cur) =>
      cur == null ? null : (cur - 1 + photos.length) % photos.length
    );
  }
  function next() {
    setOpen((cur) => (cur == null ? null : (cur + 1) % photos.length));
  }

  return (
    <>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
          className
        )}
      >
        {photos.map((src, idx) => (
          <button
            key={src + idx}
            type="button"
            onClick={() => setOpen(idx)}
            className="group relative aspect-square overflow-hidden rounded-xl bg-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`${altPrefix} ${idx + 1}`}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {open != null && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-stone-950/90 p-4"
          role="dialog"
          aria-modal
          aria-label="Photo gallery"
          onClick={() => setOpen(null)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={() => setOpen(null)}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                aria-label="Previous"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                type="button"
                className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                aria-label="Next"
              >
                <ChevronRight className="h-7 w-7" />
              </button>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[i]}
            alt={`${altPrefix} ${i + 1}`}
            className="max-h-[85vh] max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-4 text-sm text-white/80">
            {i + 1} / {photos.length}
          </p>
        </div>
      )}
    </>
  );
}
