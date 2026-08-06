"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Bell, Download, Loader2, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PwaProvider() {
  const { data: session, status } = useSession();
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [pushDismissed, setPushDismissed] = useState(false);
  const [swReady, setSwReady] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [pushOn, setPushOn] = useState(false);
  const [pushConfigured, setPushConfigured] = useState(false);
  const [msg, setMsg] = useState("");
  const [standalone, setStandalone] = useState(false);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    setStandalone(isStandalone);

    const dismissedInstall = localStorage.getItem("aupairly_install_dismissed");
    const dismissedPush = localStorage.getItem("aupairly_push_dismissed");
    if (dismissedInstall) setInstallDismissed(true);
    if (dismissedPush) setPushDismissed(true);

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then(async (reg) => {
        setSwReady(true);
        // Check existing push subscription
        const sub = await reg.pushManager.getSubscription();
        setPushOn(Boolean(sub));
      })
      .catch((err) => console.warn("[pwa] sw register", err));

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", () => {
      setDeferred(null);
      setStandalone(true);
    });
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  useEffect(() => {
    fetch("/api/push/vapid")
      .then((r) => r.json())
      .then((d) => setPushConfigured(Boolean(d.configured && d.publicKey)))
      .catch(() => setPushConfigured(false));
  }, []);

  const enablePush = useCallback(async () => {
    if (!swReady || status !== "authenticated") {
      setMsg("Log in to enable notifications.");
      return;
    }
    setPushBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setMsg("Notifications blocked — enable them in browser settings.");
        return;
      }
      const vapidRes = await fetch("/api/push/vapid");
      const vapid = await vapidRes.json();
      if (!vapid.publicKey) {
        setMsg("Push not configured on server yet.");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
        });
      }
      const json = sub.toJSON();
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (!res.ok) {
        setMsg("Could not save subscription.");
        return;
      }
      setPushOn(true);
      setMsg("Push enabled on this device.");
      // Test ping
      await fetch("/api/push/test", { method: "POST" }).catch(() => {});
    } catch (e) {
      console.error(e);
      setMsg("Could not enable push on this browser.");
    } finally {
      setPushBusy(false);
    }
  }, [swReady, status]);

  const showInstall =
    !standalone && !installDismissed && deferred && typeof window !== "undefined";

  const showPush =
    !pushDismissed &&
    pushConfigured &&
    swReady &&
    status === "authenticated" &&
    !pushOn &&
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission !== "denied";

  return (
    <>
      {/* Install banner */}
      {showInstall && (
        <div className="fixed bottom-[4.5rem] left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-teal-200 bg-white p-4 shadow-xl md:bottom-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-lg font-bold text-white">
              A
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-stone-900">Install AuPairly</p>
              <p className="mt-0.5 text-xs text-stone-500">
                Home screen app · faster open · works offline for key pages
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  className="btn-primary !py-1.5 !text-xs"
                  onClick={async () => {
                    await deferred.prompt();
                    setDeferred(null);
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Install
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-stone-500"
                  onClick={() => {
                    setInstallDismissed(true);
                    localStorage.setItem("aupairly_install_dismissed", "1");
                  }}
                >
                  Not now
                </button>
              </div>
            </div>
            <button
              type="button"
              className="text-stone-400"
              aria-label="Dismiss"
              onClick={() => {
                setInstallDismissed(true);
                localStorage.setItem("aupairly_install_dismissed", "1");
              }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Push banner — sits above install when both show */}
      {showPush && (
        <div
          className={`fixed left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-xl ${
            showInstall ? "bottom-[12.5rem] md:bottom-28" : "bottom-[4.5rem] md:bottom-4"
          }`}
        >
          <div className="flex items-start gap-3">
            <Bell className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-950">Turn on message alerts</p>
              <p className="mt-0.5 text-xs text-amber-900/80">
                Get notified for new messages, matches, and interests — even when the tab is closed.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-teal-700 px-3 py-1.5 text-xs font-semibold text-white"
                  disabled={pushBusy}
                  onClick={enablePush}
                >
                  {pushBusy ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bell className="h-3.5 w-3.5" />
                  )}
                  Enable notifications
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-amber-900/70"
                  onClick={() => {
                    setPushDismissed(true);
                    localStorage.setItem("aupairly_push_dismissed", "1");
                  }}
                >
                  Later
                </button>
              </div>
              {msg && <p className="mt-2 text-[11px] text-amber-900">{msg}</p>}
            </div>
          </div>
        </div>
      )}

      {msg && !showPush && (
        <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 rounded-full bg-stone-900 px-4 py-2 text-xs text-white md:bottom-6">
          {msg}
        </div>
      )}
    </>
  );
}

/** Compact controls for settings / dashboard */
export function PushSettingsCard() {
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [on, setOn] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/push/subscribe")
      .then((r) => r.json())
      .then((d) => setOn(Boolean(d.subscribed)))
      .catch(() => {});
  }, [status]);

  if (status !== "authenticated") return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <Bell className="h-5 w-5 text-teal-700" />
        <h3 className="font-display text-lg font-semibold">Push notifications</h3>
      </div>
      <p className="mt-2 text-sm text-stone-500">
        Status:{" "}
        <strong className={on ? "text-emerald-700" : "text-stone-700"}>
          {on ? "Enabled on this browser" : "Off"}
        </strong>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-primary !text-xs"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setInfo("");
            try {
              const perm = await Notification.requestPermission();
              if (perm !== "granted") {
                setInfo("Permission denied");
                return;
              }
              const vapid = await (await fetch("/api/push/vapid")).json();
              if (!vapid.publicKey) {
                setInfo("Server missing VAPID keys");
                return;
              }
              const reg = await navigator.serviceWorker.ready;
              const sub =
                (await reg.pushManager.getSubscription()) ||
                (await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: urlBase64ToUint8Array(vapid.publicKey),
                }));
              const json = sub.toJSON();
              await fetch("/api/push/subscribe", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
              });
              await fetch("/api/push/test", { method: "POST" });
              setOn(true);
              setInfo("Enabled — test notification sent");
            } catch {
              setInfo("Failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {on ? "Send test" : "Enable push"}
        </button>
        {on && (
          <button
            type="button"
            className="btn-secondary !text-xs"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                const reg = await navigator.serviceWorker.ready;
                const sub = await reg.pushManager.getSubscription();
                if (sub) {
                  await fetch("/api/push/subscribe", {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ endpoint: sub.endpoint }),
                  });
                  await sub.unsubscribe();
                }
                setOn(false);
                setInfo("Disabled on this device");
              } finally {
                setBusy(false);
              }
            }}
          >
            Disable
          </button>
        )}
      </div>
      {info && <p className="mt-2 text-xs text-stone-500">{info}</p>}
    </div>
  );
}
