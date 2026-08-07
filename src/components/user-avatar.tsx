"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Avatar } from "@/components/ui";

/**
 * Avatar that always prefers a real photo:
 * 1) server-provided image prop
 * 2) next-auth session.user.image
 * 3) live GET /api/me (DB source of truth after upload)
 */
export function UserAvatar({
  name,
  image: imageProp,
  size = "md",
  className,
  refreshFromApi = true,
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  /** Fetch latest photo from /api/me (default true). */
  refreshFromApi?: boolean;
}) {
  const { data: session, status } = useSession();
  const [apiImage, setApiImage] = useState<string | null>(null);

  useEffect(() => {
    if (!refreshFromApi || status !== "authenticated") return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const url = data?.user?.image;
        if (!cancelled && typeof url === "string" && url.trim()) {
          setApiImage(url.trim());
        }
      } catch {
        // ignore — fall back to prop/session
      }
    }

    void load();

    const onUpdated = (e: Event) => {
      const detail = (e as CustomEvent<{ url?: string }>).detail;
      if (detail?.url) setApiImage(detail.url);
      else void load();
    };
    window.addEventListener("aupairly:avatar-updated", onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("aupairly:avatar-updated", onUpdated);
    };
  }, [refreshFromApi, status, session?.user?.image]);

  const sessionImage =
    typeof session?.user?.image === "string" && session.user.image.trim()
      ? session.user.image.trim()
      : null;
  const propImage =
    typeof imageProp === "string" && imageProp.trim() ? imageProp.trim() : null;

  const image = apiImage || propImage || sessionImage || null;
  const displayName = session?.user?.name || name;

  return (
    <Avatar name={displayName} image={image} size={size} className={className} />
  );
}
