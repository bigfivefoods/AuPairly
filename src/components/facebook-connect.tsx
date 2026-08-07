"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Share2, Unlink, CheckCircle2 } from "lucide-react";
import { Button, Badge, Card } from "@/components/ui";

type Status = {
  linked: boolean;
  config?: {
    configured?: boolean;
    appId?: string | null;
    clientReady?: boolean;
  };
  profile?: {
    name?: string;
    picture?: string;
    email?: string;
    link?: string;
  } | null;
  user?: { name?: string; image?: string | null };
};

export function FacebookConnect({
  returnTo = "/settings/connections",
  compact = false,
}: {
  returnTo?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

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
      void refresh();
      router.refresh();
    } else if (fb === "error") {
      setMessage(sp.get("message") || "Facebook connect failed");
      setLoading(false);
    }
  }, [sp, router]);

  function startOAuth() {
    setMessage("");
    setLoading(true);
    // Full navigation — more reliable than fetch for OAuth redirect + cookies
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

  const configured =
    status?.config?.configured === true ||
    status?.config?.clientReady === true ||
    Boolean(process.env.NEXT_PUBLIC_FACEBOOK_APP_ID);
  const linked = status?.linked;
  const picture = status?.profile?.picture || status?.user?.image;
  // Never hard-disable for “not configured” — let OAuth route explain the error
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
            <h3 className="font-semibold text-stone-900">Facebook / Meta</h3>
            {linked && (
              <Badge variant="success">
                <CheckCircle2 className="h-3 w-3" /> Linked
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-stone-500">
            Import your public name and profile photo.{" "}
            <strong className="font-medium text-stone-600">
              Not identity verification
            </strong>{" "}
            — still complete ID checks for a Verified badge.
          </p>
          {linked && status?.profile?.name && (
            <p className="mt-1 text-xs text-stone-400">
              Connected as {status.profile.name}
              {status.profile.email ? ` · ${status.profile.email}` : ""}
            </p>
          )}
          {status && !configured && (
            <p className="mt-2 text-xs text-amber-800">
              Meta App keys may be missing on this server. Admins: set{" "}
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_FACEBOOK_APP_ID</code> and{" "}
              <code className="rounded bg-amber-100 px-1">AUTH_FACEBOOK_SECRET</code>.
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button
          type="button"
          variant={linked ? "secondary" : "primary"}
          disabled={busy}
          onClick={startOAuth}
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {linked ? "Re-sync Facebook" : "Connect Facebook"}
        </Button>
        {/* Fallback plain link if JS onClick is blocked */}
        <a
          href={oauthHref}
          className="sr-only"
          onClick={() => setLoading(true)}
        >
          Connect Facebook via Meta OAuth
        </a>
        {linked && (
          <Button type="button" variant="ghost" disabled={busy} onClick={unlink}>
            <Unlink className="h-4 w-4" />
            Unlink
          </Button>
        )}
      </div>
      {message && (
        <p className="w-full rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-900">{message}</p>
      )}
    </>
  );

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
