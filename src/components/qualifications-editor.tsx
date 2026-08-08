"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, Plus, Trash2, ExternalLink } from "lucide-react";
import { Button, Input, Label, Select } from "@/components/ui";
import {
  type QualificationItem,
  QUAL_STATUS_OPTIONS,
  newQualification,
} from "@/lib/qualifications";

/**
 * Edit list of qualifications + attach cert files (uploaded via /api/upload).
 */
export function QualificationsEditor({
  items,
  onChange,
}: {
  items: QualificationItem[];
  onChange: (next: QualificationItem[]) => void;
}) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  function update(id: string, patch: Partial<QualificationItem>) {
    onChange(items.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  }

  function remove(id: string) {
    onChange(items.filter((q) => q.id !== id));
  }

  function add() {
    onChange([...items, newQualification({ status: "COMPLETED" })]);
  }

  async function onFile(id: string, file: File | null) {
    if (!file) return;
    setUploadingId(id);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("kind", "document");
      const up = await fetch("/api/upload", { method: "POST", body: form });
      const upData = await up.json();
      if (!up.ok) {
        setError(upData.error || "Upload failed");
        return;
      }
      const url = upData.url as string;
      // Also save into document vault as QUALIFICATION
      await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "QUALIFICATION",
          label:
            items.find((q) => q.id === id)?.title ||
            file.name.replace(/\.[^.]+$/, "").slice(0, 80),
          url,
        }),
      }).catch(() => null);

      update(id, { documentUrl: url });
    } catch {
      setError("Upload failed");
    } finally {
      setUploadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 && (
        <p className="text-sm text-stone-500">
          Add diplomas, short courses, or qualifications you are studying towards.
          You can attach a PDF or image of each certificate.
        </p>
      )}

      {items.map((q, idx) => (
        <div
          key={q.id}
          className="rounded-xl border border-stone-200 bg-stone-50/60 p-4 space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Qualification {idx + 1}
            </p>
            <button
              type="button"
              onClick={() => remove(q.id)}
              className="rounded-full p-1.5 text-stone-400 hover:bg-white hover:text-red-600"
              aria-label="Remove qualification"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title / name</Label>
              <Input
                value={q.title}
                onChange={(e) => update(q.id, { title: e.target.value })}
                placeholder="e.g. First Aid Level 1, ECD NQF 4, BEd Foundation Phase"
              />
            </div>
            <div>
              <Label>Institution (optional)</Label>
              <Input
                value={q.institution || ""}
                onChange={(e) => update(q.id, { institution: e.target.value })}
                placeholder="College / university / provider"
              />
            </div>
            <div>
              <Label>Year (optional)</Label>
              <Input
                value={q.year || ""}
                onChange={(e) => update(q.id, { year: e.target.value })}
                placeholder="2024"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Status</Label>
              <Select
                value={q.status}
                onChange={(e) =>
                  update(q.id, {
                    status: e.target.value as QualificationItem["status"],
                  })
                }
              >
                {QUAL_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={(el) => {
                fileRefs.current[q.id] = el;
              }}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="hidden"
              onChange={(e) => onFile(q.id, e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={uploadingId === q.id}
              onClick={() => fileRefs.current[q.id]?.click()}
              className="!px-3 !py-1.5 text-xs"
            >
              {uploadingId === q.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileUp className="h-3.5 w-3.5" />
              )}
              {q.documentUrl ? "Replace attachment" : "Attach certificate"}
            </Button>
            {q.documentUrl && (
              <a
                href={q.documentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View file
              </a>
            )}
            <span className="text-[11px] text-stone-400">PDF or image · max 5 MB</span>
          </div>
        </div>
      ))}

      <Button type="button" variant="secondary" onClick={add}>
        <Plus className="h-4 w-4" />
        Add qualification
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
