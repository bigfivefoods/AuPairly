"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Upload,
  ExternalLink,
  File,
} from "lucide-react";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";

type Doc = {
  id: string;
  type: string;
  label?: string | null;
  url: string;
  expiresAt?: string | null;
  createdAt?: string;
};

const TYPE_LABELS: Record<string, string> = {
  PASSPORT: "Passport",
  POLICE: "Police clearance",
  FIRST_AID: "First aid",
  VISA: "Visa",
  OTHER: "Other",
};

function isPdf(url: string) {
  return /\.pdf($|\?)/i.test(url) || url.includes("application/pdf");
}

function isImage(url: string) {
  return /\.(jpe?g|png|webp|gif)($|\?)/i.test(url) || url.startsWith("data:image/");
}

function displayName(doc: Doc) {
  if (doc.label?.trim()) return doc.label.trim();
  try {
    const path = new URL(doc.url, "https://local").pathname;
    const base = path.split("/").pop() || "";
    if (base && !base.startsWith("document-")) return decodeURIComponent(base);
  } catch {
    /* ignore */
  }
  return TYPE_LABELS[doc.type] || doc.type;
}

export default function DocumentsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [type, setType] = useState("PASSPORT");
  const [label, setLabel] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    const d = await res.json();
    if (res.ok) setDocs(d.documents || []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const docsDone = docs.length >= 1;
  const docsPoints = 8;

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function pickFile(next: File | null) {
    setError("");
    if (!next) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    const okTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];
    if (!okTypes.includes(next.type)) {
      setError("Please choose a PDF or image (JPEG, PNG, WebP, GIF).");
      return;
    }
    if (next.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB.");
      return;
    }
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    setFile(next);
    if (next.type.startsWith("image/")) {
      setPreviewUrl(URL.createObjectURL(next));
    } else {
      setPreviewUrl(null);
    }
    // Default label from filename if empty
    if (!label.trim()) {
      const name = next.name.replace(/\.[^.]+$/, "").slice(0, 80);
      setLabel(name);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      // 1) Upload file to storage
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "document");
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) {
        setError(upData.error || "Upload failed");
        return;
      }

      // 2) Save vault record
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          label: label.trim() || file.name,
          url: upData.url,
          expiresAt: expiresAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save document");
        return;
      }

      setFile(null);
      setPreviewUrl(null);
      setLabel("");
      setExpiresAt("");
      if (inputRef.current) inputRef.current.value = "";
      await load();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <PageHeader
        eyebrow="Vault"
        title="Document vault"
        description="Upload passport, police clearance, first aid, and visas. Files stay in your private vault with optional expiry."
      />

      <div
        className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
          docsDone
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-amber-200 bg-amber-50 text-amber-950"
        }`}
      >
        {docsDone ? (
          <p className="font-semibold">
            Document step complete · +{docsPoints} pts toward profile completion
            ({docs.length} file{docs.length === 1 ? "" : "s"} in vault)
          </p>
        ) : (
          <p className="font-semibold">
            Upload 1 document to earn +{docsPoints} profile points
          </p>
        )}
        <p className="mt-1 text-xs opacity-90">
          Then open <a href="/dashboard" className="font-semibold underline">Dashboard</a>{" "}
          to see your full % update. Checklist item:{" "}
          <strong>Upload a key document</strong>.
        </p>
      </div>

      <Card>
        <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="doc-type">Type</Label>
            <Select
              id="doc-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="PASSPORT">Passport</option>
              <option value="POLICE">Police clearance</option>
              <option value="FIRST_AID">First aid</option>
              <option value="VISA">Visa</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="doc-label">Label (optional)</Label>
            <Input
              id="doc-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. SA police clearance 2026"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>File</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0] ?? null);
              }}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
                dragOver
                  ? "border-teal-500 bg-teal-50"
                  : file
                    ? "border-teal-300 bg-teal-50/50"
                    : "border-stone-200 bg-stone-50 hover:border-teal-300 hover:bg-teal-50/40"
              }`}
            >
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="h-28 max-w-full rounded-xl object-contain shadow-sm"
                />
              ) : file ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <FileText className="h-8 w-8 text-teal-700" />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                  <Upload className="h-7 w-7 text-teal-700" />
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-stone-800">
                  {file ? file.name : "Click to choose a file, or drag & drop"}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  {file
                    ? `${(file.size / 1024).toFixed(0)} KB · ${file.type || "file"}`
                    : "PDF or image · max 5 MB"}
                </p>
              </div>
              {file && (
                <span className="text-xs font-semibold text-teal-700">
                  Tap to choose a different file
                </span>
              )}
            </button>
          </div>

          <div>
            <Label htmlFor="doc-expires">Expires (optional)</Label>
            <Input
              id="doc-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button type="submit" className="w-full" disabled={loading || !file}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload to vault
                </>
              )}
            </Button>
          </div>

          {error && (
            <p className="sm:col-span-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </form>
      </Card>

      <ul className="mt-6 space-y-3">
        {docs.length === 0 && (
          <Card className="!py-8 text-center text-sm text-stone-500">
            No documents yet. Upload your first file above.
          </Card>
        )}
        {docs.map((d) => (
          <Card
            key={d.id}
            className="flex flex-col gap-3 !py-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                {isImage(d.url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={d.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : isPdf(d.url) ? (
                  <FileText className="h-6 w-6 text-teal-700" />
                ) : (
                  <File className="h-6 w-6 text-stone-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">
                  {TYPE_LABELS[d.type] || d.type}
                  {d.label ? (
                    <span className="font-normal text-stone-600">
                      {" "}
                      · {d.label}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-xs text-stone-500">{displayName(d)}</p>
                {d.expiresAt && (
                  <p className="mt-1 text-xs text-amber-700">
                    Expires {new Date(d.expiresAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <a
                href={d.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-teal-800 transition hover:border-teal-300"
              >
                {isImage(d.url) ? (
                  <ImageIcon className="h-3.5 w-3.5" />
                ) : (
                  <ExternalLink className="h-3.5 w-3.5" />
                )}
                View
              </a>
              <Button
                type="button"
                variant="ghost"
                onClick={() => remove(d.id)}
                className="!px-2"
                aria-label="Remove document"
              >
                <Trash2 className="h-4 w-4 text-stone-500" />
              </Button>
            </div>
          </Card>
        ))}
      </ul>
    </div>
  );
}
