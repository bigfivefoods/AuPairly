"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Share2, Unlink, CheckCircle2 } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";

type Status = {
  linked: boolean;
  config?: {
    enabled?: boolean;
    configured?: boolean;
    appId?: string | null;
    clientReady?: boolean;
    redirectUri?: string | null;
  };
  profile?: {
    name?: string;
    picture?: string;
    email?: string;
    link?: string;
  } | null;
  user?: { name?: string; image?: string | null };
};

/**
 * Optional Facebook profile import. Not required for verification or launch.
 * Hide entirely with FACEBOOK_OAUTH_ENABLED=false on Vercel.
 */
export function FacebookConnect({
  returnTo = "/settings/connections",
  compact = false,
  /** When true, show collapsed “optional” treatment (verification page) */
  optional = false,
}: {
  returnTo?: string;
  compact?: boolean;
  optional?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(!optional);

  const oauthHref = `/api/social/facebook/oauth?returnTo=${encodeURIComponent(returnTo)}`;

  async function refresh() {
    try {
      const res = await fetch("/api/social/facebook", { credentials: "same-origin" });
      if (!res.ok) {
        if (res.status === 401) {
          setMessage("Please sign in to connect Facebook.");
        }
        return;
      }
      const data = await res.json();
      setStatus({
        linked: Boolean(data.linked),
        config: data.config,
        profile: data.profile,
        user: data.user,
      });
    } catch {
      setMessage("Could not load Facebook connection status.");
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    const fb = sp.get("fb");
    if (fb === "linked") {
      setMessage("Facebook connected — name and photo imported where missing.");
      setOpen(true);
      void refresh();
      router.refresh();
    } else if (fb === "error") {
      setMessage(sp.get("message") || "Facebook connect failed");
      setLoading(false);
      setOpen(true);
    }
  }, [sp, router]);

  function startOAuth() {
    setMessage("");
    setLoading(true);
    window.location.assign(oauthHref);
  }

  async function unlink() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/social/facebook", {
        method: "DELETE",
        credentials: "same-origin",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error || "Could not unlink");
        return;
      }
      setMessage("Facebook unlinked.");
      await refresh();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  // Feature flag: hide completely when disabled on server
  if (status?.config?.enabled === false) {
    return null;
  }

  const configured =
    status?.config?.configured === true ||
    status?.config?.clientReady === true ||
    Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID);
  const linked = status?.linked;
  const picture = status?.profile?.picture || status?.user?.image;
  const busy = loading;

  const body = (
    <>
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
          {picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={picture} alt="" className="h-full w-full object-cover" />
          ) : (
            <Share2 className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-stone-900">Facebook (optional)</h3>
            {linked && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Linked
              </Badge>
            )}
            <Badge variant="default">Not required</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Only imports public name/photo.{" "}
            <strong className="font-medium text-stone-700">
              Skip this anytime
            </strong>{" "}
            — use photo upload + VerifyNow / ID documents for a real Verified badge.
          </p>
          {linked && status?.profile?.name && (
            <p className="mt-1 text-xs text-stone-400">
              Connected as {status.profile.name}
              {status.profile.email ? ` · ${status.profile.email}` : ""}
            </p>
          )}
          {status && !configured && (
            <p className="mt-2 text-xs text-stone-500">
              Facebook is not fully configured. You can ignore this — the rest of AuPairly works
              without it.
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant={linked ? "secondary" : "secondary"}
          disabled={busy}
          onClick={startOAuth}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {linked ? "Re-sync Facebook" : "Try Connect Facebook"}
        </Button>
        {linked && (
          <Button type="button" variant="ghost" disabled={busy} onClick={unlink}>
            <Unlink className="h-4 w-4" />
            Unlink
          </Button>
        )}
      </div>
      {message && (
        <p
          className={`w-full rounded-xl px-3 py-2 text-sm ${
            /fail|error|invalid|not |domain|can't|cant/i.test(message)
              ? "border border-amber-200 bg-amber-50 text-amber-950"
              : "bg-teal-50 text-teal-900"
          }`}
        >
          {message}
          {/domain|can't load url|cant load url/i.test(message) && (
            <span className="mt-1 block text-xs">
              Meta app settings are still wrong, or Facebook can wait. Upload a photo under
              Profile instead — verification does not need Facebook.
            </span>
          )}
        </p>
      )}
    </>
  );

  if (optional && !open && !linked) {
    return (
      <Card className="border-dashed border-stone-200 bg-stone-50/50">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full text-left text-sm text-stone-600 hover:text-stone-900"
        >
          <span className="font-semibold text-stone-700">Optional:</span> Connect Facebook for
          name/photo import —{" "}
          <span className="font-medium text-teal-700">not required · click to expand</span>
        </button>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {body}
      </div>
    );
  }

  return (
    <Card className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      {body}
    </Card>
  );
}
