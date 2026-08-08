/**
 * Sitter qualifications / studies helpers (client-safe).
 */

export type QualificationStatus = "COMPLETED" | "IN_PROGRESS" | "PLANNED";

export type QualificationItem = {
  id: string;
  title: string;
  institution?: string;
  year?: string;
  status: QualificationStatus;
  /** Public URL to attached certificate / transcript (from vault upload) */
  documentUrl?: string;
};

export const STUDY_STATUS_OPTIONS = [
  { value: "NOT_STUDYING", label: "Not currently studying" },
  { value: "STUDYING", label: "Currently studying" },
  { value: "COMPLETED", label: "Completed studies / fully qualified" },
] as const;

export const QUAL_STATUS_OPTIONS: {
  value: QualificationStatus;
  label: string;
}[] = [
  { value: "COMPLETED", label: "Completed / certified" },
  { value: "IN_PROGRESS", label: "In progress / studying towards" },
  { value: "PLANNED", label: "Planned" },
];

export function parseQualifications(raw: string | null | undefined): QualificationItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((q: Record<string, unknown>) => ({
        id: String(q.id || cryptoRandomId()),
        title: String(q.title || "").trim(),
        institution: q.institution ? String(q.institution).trim() : undefined,
        year: q.year ? String(q.year).trim() : undefined,
        status: (["COMPLETED", "IN_PROGRESS", "PLANNED"].includes(String(q.status))
          ? String(q.status)
          : "COMPLETED") as QualificationStatus,
        documentUrl: q.documentUrl ? String(q.documentUrl) : undefined,
      }))
      .filter((q) => q.title.length > 0);
  } catch {
    return [];
  }
}

export function serializeQualifications(items: QualificationItem[]): string {
  return JSON.stringify(
    items
      .filter((q) => q.title.trim())
      .map((q) => ({
        id: q.id || cryptoRandomId(),
        title: q.title.trim(),
        institution: q.institution?.trim() || undefined,
        year: q.year?.trim() || undefined,
        status: q.status || "COMPLETED",
        documentUrl: q.documentUrl || undefined,
      }))
  );
}

function cryptoRandomId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function newQualification(
  partial?: Partial<QualificationItem>
): QualificationItem {
  return {
    id: cryptoRandomId(),
    title: "",
    status: "COMPLETED",
    ...partial,
  };
}

export function studyStatusLabel(status?: string | null): string | null {
  if (!status) return null;
  const hit = STUDY_STATUS_OPTIONS.find((o) => o.value === status);
  return hit?.label || status;
}

export function qualStatusLabel(status: QualificationStatus): string {
  return QUAL_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;
}
