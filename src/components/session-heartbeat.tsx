"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "aupairly_login_session_id";
const INTERVAL_MS = 55_000;

/**
 * Pings /api/session/heartbeat while the user has an app tab open.
 * Enables live “active now” + accurate session duration.
 */
export function SessionHeartbeat({ enabled }: { enabled: boolean }) {
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    try {
      sessionIdRef.current = localStorage.getItem(STORAGE_KEY);
    } catch {
      sessionIdRef.current = null;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    async function ping() {
      if (cancelled || document.visibilityState === "hidden") return;
      try {
        const res = await fetch("/api/session/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: sessionIdRef.current }),
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.sessionId) {
          sessionIdRef.current = data.sessionId;
          try {
            localStorage.setItem(STORAGE_KEY, data.sessionId);
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* offline — ignore */
      }
    }

    // Immediate ping on mount so “active now” is live
    void ping();
    timer = setInterval(ping, INTERVAL_MS);

    function onVis() {
      if (document.visibilityState === "visible") void ping();
    }
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled]);

  return null;
}
