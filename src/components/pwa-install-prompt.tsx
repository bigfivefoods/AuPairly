"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferred || dismissed) return null;

  return (
    <div className="fixed bottom-16 left-3 right-3 z-40 mx-auto max-w-md rounded-2xl border border-teal-200 bg-white p-4 shadow-lg md:bottom-4">
      <p className="text-sm font-semibold text-stone-900">Install AuPairly</p>
      <p className="mt-1 text-xs text-stone-500">
        Add to your home screen for faster matching and message alerts.
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
          Install
        </button>
        <button
          type="button"
          className="text-xs font-semibold text-stone-500"
          onClick={() => setDismissed(true)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
