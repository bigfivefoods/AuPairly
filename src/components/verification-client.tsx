"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";
import { Badge, Button, Card, Input, Label } from "@/components/ui";
import { FacebookConnect } from "@/components/facebook-connect";

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
}: {
  initial: VItem[];
  isFullyVerified: boolean;
  /** @deprecated Facebook state is loaded by FacebookConnect */
  facebookLinked?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [kycFee, setKycFee] = useState<{
    feeCents: number;
    feeLabel: string;
    paystackRequired: boolean;
    free: boolean;
    planId?: string;
    feeReason?: string;
    configured?: boolean;
    live?: boolean;
    mode?: string;
  }>({
    feeCents: 1000,
    feeLabel: "R10",
    paystackRequired: true,
    free: false,
    planId: "FREE",
    live: false,
    mode: "off",
  });
  const resumePaidRef = useRef(false);

  const PENDING_KYC_KEY = "aupairly_pending_kyc";

  async function refreshVerificationList() {
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
  }

  async function postKyc(payload: {
    country: string;
    idNumber?: string;
    selfieBase64?: string | null;
    paymentReference?: string;
  }) {
    const res = await fetch("/api/verification/kyc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        country: payload.country,
        idNumber: payload.idNumber,
        selfieBase64: payload.selfieBase64 || undefined,
        paymentReference: payload.paymentReference,
      }),
    });
    const data = await res.json();
    return { res, data };
  }

  useEffect(() => {
    // Didit redirects back with verificationSessionId + status
    const sessionId =
      searchParams.get("verificationSessionId") ||
      searchParams.get("session_id");
    const qs = sessionId
      ? `?syncSession=${encodeURIComponent(sessionId)}`
      : "";

    // Restore pending form after Paystack return
    try {
      const raw = sessionStorage.getItem(PENDING_KYC_KEY);
      if (raw) {
        const pending = JSON.parse(raw) as {
          country?: string;
          idNumber?: string;
          selfieBase64?: string | null;
        };
        if (pending.country) setCountry(pending.country);
        if (pending.idNumber) setIdNumber(pending.idNumber);
        if (pending.selfieBase64) setSelfieB64(pending.selfieBase64);
      }
    } catch {
      /* ignore */
    }

    fetch(`/api/verification/kyc${qs}`)
      .then((r) => r.json())
      .then(async (d) => {
        if (d.providers) setProviders(d.providers);
        if (d.verifynow) {
          setKycFee({
            feeCents: d.verifynow.feeCents ?? 1000,
            feeLabel:
              d.verifynow.feeLabel ||
              (d.verifynow.free
                ? "Free"
                : `R${((d.verifynow.feeCents ?? 1000) / 100).toFixed(0)}`),
            paystackRequired: Boolean(d.verifynow.paystackRequired),
            free: Boolean(d.verifynow.free),
            planId: d.verifynow.planId,
            feeReason: d.verifynow.feeReason,
            configured: Boolean(d.verifynow.configured ?? d.providers?.verifynow),
            live: Boolean(d.verifynow.live),
            mode: d.verifynow.mode || "off",
          });
        }
        if (d.diditSync?.outcome === "VERIFIED") {
          setMessage("Didit verification approved. Your badge will update shortly.");
        } else if (d.diditSync?.outcome === "REJECTED") {
          setMessage(
            `Didit verification ${d.diditSync.status || "declined"}. You can retry or upload documents below.`
          );
        } else if (d.diditSync?.outcome === "PENDING") {
          setMessage("Didit verification is still in progress or under review.");
        } else if (searchParams.get("kyc") === "didit") {
          setMessage("Welcome back from Didit. Status will update when the check finishes.");
        }
        if (sessionId || searchParams.get("kyc") === "didit") {
          await refreshVerificationList();
          router.refresh();
        }

        // After Paystack: auto-run VerifyNow with paid reference
        const paidRef = searchParams.get("reference");
        const kycPaid = searchParams.get("kyc_paid") === "1";
        if (kycPaid && paidRef && !resumePaidRef.current) {
          resumePaidRef.current = true;
          setKycLoading(true);
          setMessage("Payment received — running VerifyNow…");
          try {
            let pending: {
              country?: string;
              idNumber?: string;
              selfieBase64?: string | null;
            } = {};
            try {
              pending = JSON.parse(sessionStorage.getItem(PENDING_KYC_KEY) || "{}");
            } catch {
              pending = {};
            }
            const { res, data } = await postKyc({
              country: pending.country || "ZA",
              idNumber: pending.idNumber,
              selfieBase64: pending.selfieBase64,
              paymentReference: paidRef,
            });
            if (!res.ok) {
              setMessage(data.error || "KYC failed after payment");
              return;
            }
            if (data.needsPayment && data.url) {
              window.location.assign(data.url);
              return;
            }
            sessionStorage.removeItem(PENDING_KYC_KEY);
            setMessage(
              data.isFullyVerified
                ? "Identity verified via VerifyNow. Badge updated."
                : data.face?.statusText ||
                    data.id?.statusText ||
                    data.message ||
                    "VerifyNow completed."
            );
            await refreshVerificationList();
            router.refresh();
          } catch {
            setMessage("Could not complete verification after payment");
          } finally {
            setKycLoading(false);
          }
        }
      })
      .catch(() => null);
  }, [searchParams, router]);

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
      // Persist form so we can resume after Paystack redirect
      if (country === "ZA") {
        try {
          sessionStorage.setItem(
            PENDING_KYC_KEY,
            JSON.stringify({
              country,
              idNumber,
              selfieBase64: selfieB64,
            })
          );
        } catch {
          /* private mode */
        }
      }

      const paidRef =
        searchParams.get("reference") ||
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search).get("reference")
          : null);

      const { res, data } = await postKyc({
        country,
        idNumber: country === "ZA" ? idNumber : undefined,
        selfieBase64: selfieB64,
        paymentReference: country === "ZA" ? paidRef || undefined : undefined,
      });

      if (!res.ok) {
        setMessage(data.error || "KYC failed");
        return;
      }

      // Paystack hosted checkout for Free-plan VerifyNow fee (R10)
      if (data.needsPayment && data.url) {
        setMessage(
          data.message ||
            `Redirecting to Paystack (${data.feeLabel || "R10"})…`
        );
        window.location.assign(data.url);
        return;
      }

      // Didit hosted URL
      if (data.url && data.provider === "didit") {
        window.location.assign(data.url);
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }

      if (country === "ZA") {
        try {
          sessionStorage.removeItem(PENDING_KYC_KEY);
        } catch {
          /* ignore */
        }
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
      await refreshVerificationList();
      router.refresh();
    } catch {
      setMessage("KYC request failed");
    } finally {
      setKycLoading(false);
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
              <strong>South Africa:</strong> VerifyNow Standard KYC Bundle (Home Affairs ID) + face
              match.{" "}
              {kycFee.free || !kycFee.paystackRequired ? (
                <>
                  <strong>Free</strong>
                  {kycFee.feeReason ? ` (${kycFee.feeReason})` : " on your plan"}.
                </>
              ) : (
                <>
                  <strong>{kycFee.feeLabel}</strong> on Free · included free on Plus/Premium.
                </>
              )}{" "}
              <strong>International:</strong> Didit document + liveness when configured; otherwise
              upload documents below for review.
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Providers: VerifyNow{" "}
              {kycFee.live
                ? "● production (live)"
                : kycFee.configured || providers.verifynow
                  ? `● ${kycFee.mode || "sandbox"}`
                  : "○ not configured"}{" "}
              · Didit {providers.didit ? "● live" : "○ not configured"} · Meta/Facebook{" "}
              {providers.facebook ? "● app configured" : "○ not configured"}
              {kycFee.planId ? ` · plan ${kycFee.planId}` : ""}
              {kycFee.paystackRequired
                ? ` · SA check ${kycFee.feeLabel}`
                : kycFee.free
                  ? " · SA check free"
                  : " · SA check free (Paystack off)"}
            </p>
            {!kycFee.configured && (
              <p className="mt-2 text-xs text-amber-800">
                VerifyNow is not live yet. Add <code className="rounded bg-amber-100 px-1">VERIFYNOW_API_KEY</code>{" "}
                and <code className="rounded bg-amber-100 px-1">VERIFYNOW_MODE=production</code> on Vercel, then
                redeploy.
              </p>
            )}
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
          type="button"
          onClick={runKyc}
          disabled={kycLoading || (country === "ZA" && idNumber.length !== 13)}
          className="w-full sm:w-auto"
        >
          {kycLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          {country === "ZA"
            ? kycFee.paystackRequired
              ? `Pay ${kycFee.feeLabel} & verify with VerifyNow`
              : kycFee.free
                ? "Verify with VerifyNow (included free)"
                : "Verify with VerifyNow (SA · demo)"
            : "Start international verification"}
        </Button>
        {country === "ZA" && kycFee.paystackRequired && (
          <p className="text-xs text-stone-500">
            Free accounts pay <strong>{kycFee.feeLabel}</strong> via Paystack for the automated SA
            check. Plus and Premium members get VerifyNow free. Face match runs if you upload a
            selfie.
          </p>
        )}
        {country === "ZA" && kycFee.free && (
          <p className="text-xs text-emerald-700">
            Your {kycFee.planId || "paid"} plan includes VerifyNow at no extra charge.
          </p>
        )}
      </Card>

      {/* Meta app OAuth — profile import only */}
      <Suspense
        fallback={
          <Card className="py-6 text-center text-sm text-stone-400">Loading Facebook…</Card>
        }
      >
        <FacebookConnect returnTo="/verification" />
      </Suspense>

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
        Facebook (Meta OAuth) only imports public profile fields — never use it as sole identity
        proof. See <code>META.md</code> for app setup.
      </p>
    </div>
  );
}
