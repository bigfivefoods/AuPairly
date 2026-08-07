"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  FileText,
  Camera,
  MapPin,
  Users,
  Shield,
  Loader2,
  CheckCircle2,
  Clock,
  Upload,
  Globe2,
  Share2,
} from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";

const STEPS = [
  {
    type: "ID",
    title: "Government ID",
    desc: "Passport or national ID. Upload a clear photo of the document.",
    icon: FileText,
    required: true,
    needsUpload: true,
  },
  {
    type: "SELFIE",
    title: "Selfie match",
    desc: "Upload a clear selfie to match your ID photo.",
    icon: Camera,
    required: true,
    needsUpload: true,
  },
  {
    type: "ADDRESS",
    title: "Address proof",
    desc: "Utility bill or bank statement (optional but recommended).",
    icon: MapPin,
    required: false,
    needsUpload: true,
  },
  {
    type: "REFERENCES",
    title: "References",
    desc: "Previous host family or employer contacts (optional).",
    icon: Users,
    required: false,
    needsUpload: false,
  },
  {
    type: "BACKGROUND",
    title: "Background check",
    desc: "Consent to a basic criminal record screen (demo).",
    icon: Shield,
    required: false,
    needsUpload: false,
  },
] as const;

type VItem = {
  id: string;
  type: string;
  status: string;
  notes: string | null;
  createdAt: string;
  documentUrl?: string | null;
};

export function VerificationClient({
  initial,
  isFullyVerified,
  facebookLinked = false,
}: {
  initial: VItem[];
  isFullyVerified: boolean;
  facebookLinked?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // KYC path
  const [country, setCountry] = useState("ZA");
  const [idNumber, setIdNumber] = useState("");
  const [selfieB64, setSelfieB64] = useState<string | null>(null);
  const [kycLoading, setKycLoading] = useState(false);
  const [providers, setProviders] = useState<{
    verifynow?: boolean;
    didit?: boolean;
    facebook?: boolean;
  }>({});
  const [fbLinked, setFbLinked] = useState(facebookLinked);
  const [fbLoading, setFbLoading] = useState(false);

  useEffect(() => {
    fetch("/api/verification/kyc")
      .then((r) => r.json())
      .then((d) => {
        if (d.providers) setProviders(d.providers);
        if (d.user?.facebookId) setFbLinked(true);
      })
      .catch(() => null);
  }, []);

  const statusByType = new Map(items.map((i) => [i.type, i]));

  async function submit(type: string, documentUrl?: string | null) {
    setLoading(type);
    setMessage("");
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          documentUrl: documentUrl ?? null,
          notes: `Submitted ${type}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "Verification failed");
        return;
      }
      setItems((prev) => {
        const rest = prev.filter((p) => p.type !== type);
        return [
          {
            id: data.verification.id,
            type: data.verification.type,
            status: data.verification.status,
            notes: data.verification.notes,
            createdAt: data.verification.createdAt,
            documentUrl: data.verification.documentUrl,
          },
          ...rest,
        ];
      });
      if (data.isFullyVerified) {
        setMessage("You're fully verified! Your badge is now live.");
      } else if (data.pendingReview) {
        setMessage(`${type} submitted — pending admin review.`);
      } else {
        setMessage(`${type} verified successfully.`);
      }
      router.refresh();
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(null);
    }
  }

  async function uploadThenSubmit(type: string, file: File) {
    setLoading(type);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "document");
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) {
        setMessage(upData.error || "Upload failed");
        setLoading(null);
        return;
      }
      await submit(type, upData.url);
    } catch {
      setMessage("Upload failed");
      setLoading(null);
    }
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("read failed"));
      reader.readAsDataURL(file);
    });
  }

  async function runKyc() {
    setKycLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/verification/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          country,
          idNumber: country === "ZA" ? idNumber : undefined,
          selfieBase64: selfieB64 || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error || "KYC failed");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.manualUpload) {
        setMessage(data.message || "Use document upload below for international ID.");
      } else {
        setMessage(
          data.isFullyVerified
            ? "Identity verified via automated KYC. Badge updated."
            : data.face?.statusText ||
                data.id?.statusText ||
                data.message ||
                "KYC submitted."
        );
      }
      // refresh list
      const list = await fetch("/api/verification").then((r) => r.json());
      if (list.verifications) {
        setItems(
          list.verifications.map(
            (v: {
              id: string;
              type: string;
              status: string;
              notes: string | null;
              createdAt: string;
              documentUrl?: string | null;
            }) => ({
              id: v.id,
              type: v.type,
              status: v.status,
              notes: v.notes,
              createdAt: v.createdAt,
              documentUrl: v.documentUrl,
            })
          )
        );
      }
      router.refresh();
    } catch {
      setMessage("KYC request failed");
    } finally {
      setKycLoading(false);
    }
  }

  async function connectFacebook() {
    setFbLoading(true);
    setMessage("");
    try {
      // Facebook Login via FB JS SDK if present; otherwise prompt for a token
      // (Meta App required: AUTH_FACEBOOK_ID + AUTH_FACEBOOK_SECRET)
      const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
      if (!appId && !providers.facebook) {
        setMessage(
          "Facebook App is not configured. Set NEXT_PUBLIC_FACEBOOK_APP_ID + AUTH_FACEBOOK_SECRET (or AUTH_FACEBOOK_ID) in the environment."
        );
        return;
      }

      // Dynamic FB SDK load
      await loadFacebookSdk(appId || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID || "");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const FB = (window as any).FB;
      if (!FB) {
        setMessage("Could not load Facebook SDK. Check ad blockers and app ID.");
        return;
      }

      await new Promise<void>((resolve) => {
        FB.login(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          async (response: any) => {
            if (!response?.authResponse?.accessToken) {
              setMessage("Facebook login was cancelled.");
              resolve();
              return;
            }
            const res = await fetch("/api/social/facebook", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accessToken: response.authResponse.accessToken,
              }),
            });
            const data = await res.json();
            if (!res.ok) {
              setMessage(data.error || "Facebook link failed");
            } else {
              setFbLinked(true);
              setMessage(
                "Facebook profile imported (name/photo). Complete ID verification below for a Verified badge."
              );
              router.refresh();
            }
            resolve();
          },
          { scope: "public_profile,email" }
        );
      });
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Facebook connect failed");
    } finally {
      setFbLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {isFullyVerified && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 text-white shadow-md">
          <BadgeCheck className="h-8 w-8" />
          <div>
            <p className="font-semibold">You&apos;re verified on AuPairly</p>
            <p className="text-sm text-teal-50">Your public profile shows a Verified badge.</p>
          </div>
        </div>
      )}

      {/* Automated KYC */}
      <Card className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-stone-900">
              Automated identity check
            </h2>
            <p className="mt-1 text-sm text-stone-500">
              <strong>South Africa:</strong> VerifyNow SA ID + face match.{" "}
              <strong>International:</strong> Didit document + liveness when configured; otherwise
              upload documents below for review.
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Providers: VerifyNow {providers.verifynow ? "● live" : "○ not configured"} · Didit{" "}
              {providers.didit ? "● live" : "○ not configured"} · Facebook{" "}
              {providers.facebook || process.env.NEXT_PUBLIC_FACEBOOK_APP_ID
                ? "● app id set"
                : "○ not configured"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="kyc-country">Country of ID</Label>
            <select
              id="kyc-country"
              className="input-field"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="ZA">South Africa (VerifyNow)</option>
              <option value="US">United States</option>
              <option value="GB">United Kingdom</option>
              <option value="DE">Germany</option>
              <option value="AU">Australia</option>
              <option value="OTHER">Other / international</option>
            </select>
          </div>
          {country === "ZA" && (
            <div>
              <Label htmlFor="sa-id">South African ID number</Label>
              <Input
                id="sa-id"
                inputMode="numeric"
                maxLength={13}
                placeholder="13 digits"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 13))}
              />
            </div>
          )}
        </div>

        {country === "ZA" && (
          <div>
            <Label>Selfie for face match (recommended)</Label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              className="mt-1 block w-full text-sm text-stone-600"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const b64 = await fileToBase64(f);
                setSelfieB64(b64);
              }}
            />
            {selfieB64 && (
              <p className="mt-1 text-xs text-emerald-700">Selfie ready for face match.</p>
            )}
          </div>
        )}

        <Button
          onClick={runKyc}
          disabled={kycLoading || (country === "ZA" && idNumber.length !== 13)}
          className="w-full sm:w-auto"
        >
          {kycLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {country === "ZA" ? "Verify with VerifyNow (SA)" : "Start international verification"}
        </Button>
      </Card>

      {/* Facebook profile import */}
      <Card className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1877F2]/10 text-[#1877F2]">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-stone-900">Connect Facebook</h3>
            <p className="mt-1 text-sm text-stone-500">
              Import your public name and profile photo to speed up onboarding.{" "}
              <strong>This is not ID verification</strong> — you still need a government ID check
              for a Verified badge.
            </p>
            {fbLinked && (
              <Badge variant="success" className="mt-2">
                Facebook linked
              </Badge>
            )}
          </div>
        </div>
        <Button
          variant={fbLinked ? "secondary" : "primary"}
          disabled={fbLoading}
          onClick={connectFacebook}
        >
          {fbLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {fbLinked ? "Re-sync Facebook" : "Connect Facebook"}
        </Button>
      </Card>

      {/* Manual steps */}
      <p className="text-sm font-semibold text-stone-700">Or complete checks manually</p>

      {STEPS.map((step) => {
        const current = statusByType.get(step.type);
        const done = current?.status === "VERIFIED";
        const pending = current?.status === "PENDING";
        const rejected = current?.status === "REJECTED";
        const Icon = step.icon;
        return (
          <Card
            key={step.type}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${
                  done
                    ? "bg-emerald-50 text-emerald-600"
                    : pending
                      ? "bg-amber-50 text-amber-600"
                      : "bg-stone-50 text-stone-500"
                }`}
              >
                {done ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : pending ? (
                  <Clock className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-stone-900">{step.title}</h3>
                  {step.required ? (
                    <Badge variant="accent">Required</Badge>
                  ) : (
                    <Badge>Optional</Badge>
                  )}
                  {done && <Badge variant="success">Verified</Badge>}
                  {pending && <Badge variant="warning">Pending review</Badge>}
                  {rejected && <Badge variant="accent">Rejected — resubmit</Badge>}
                </div>
                <p className="mt-1 text-sm text-stone-500">{step.desc}</p>
                {current?.notes && (
                  <p className="mt-1 text-xs text-stone-400">{current.notes}</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
              {step.needsUpload && !done && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={(el) => {
                      fileRefs.current[step.type] = el;
                    }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadThenSubmit(step.type, f);
                    }}
                  />
                  <Button
                    variant={pending ? "secondary" : "primary"}
                    disabled={loading === step.type}
                    onClick={() => fileRefs.current[step.type]?.click()}
                  >
                    {loading === step.type ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {pending ? "Re-upload" : "Upload & submit"}
                  </Button>
                </>
              )}
              {!step.needsUpload && !done && (
                <Button
                  variant={pending ? "secondary" : "primary"}
                  disabled={loading === step.type}
                  onClick={() => submit(step.type)}
                >
                  {loading === step.type && <Loader2 className="h-4 w-4 animate-spin" />}
                  {pending ? "Resubmit" : "Submit check"}
                </Button>
              )}
              {done && (
                <Button variant="secondary" disabled>
                  Completed
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      {message && (
        <p className="rounded-xl bg-teal-50 px-4 py-3 text-sm text-teal-900">{message}</p>
      )}

      <p className="text-center text-xs text-stone-400">
        SA automated checks use VerifyNow when <code>VERIFYNOW_API_KEY</code> is set (sandbox by
        default). International hosted checks use Didit when <code>DIDIT_API_KEY</code> is set.
        Facebook only imports public profile fields — never use it as sole identity proof.
      </p>
    </div>
  );
}

function loadFacebookSdk(appId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!appId) {
      reject(new Error("Missing Facebook App ID"));
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).FB) {
      resolve();
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).fbAsyncInit = function () {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).FB.init({
        appId,
        cookie: true,
        xfbml: false,
        version: "v21.0",
      });
      resolve();
    };
    const id = "facebook-jssdk";
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const js = document.createElement("script");
    js.id = id;
    js.src = "https://connect.facebook.net/en_US/sdk.js";
    js.onerror = () => reject(new Error("Facebook SDK blocked"));
    document.body.appendChild(js);
  });
}
