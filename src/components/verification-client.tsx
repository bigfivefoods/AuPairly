"use client";

import { useRef, useState } from "react";
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
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";

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
}) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
        Demo mode auto-approves checks unless <code>AUTO_VERIFY=false</code>. Production uses the
        admin review queue at /admin.
      </p>
    </div>
  );
}
