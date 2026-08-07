/**
 * Profile completeness coach — actionable next steps for trust & conversion.
 * Client-safe pure helpers (no prisma).
 *
 * Important: the action list must be stable for a given role so that completing
 * a step only changes `score`, not `maxScore` (no conditional steps).
 */

import { parseJsonArray } from "@/lib/utils";

export type CompletenessInput = {
  role: "AUPAIR" | "PARENT" | string;
  name?: string | null;
  image?: string | null;
  videoIntroUrl?: string | null;
  headline?: string | null;
  bio?: string | null;
  city?: string | null;
  country?: string | null;
  languages?: string | null | string[];
  status?: string | null;
  isVerified?: boolean;
  /** JSON or array of service IDs */
  services?: string | null | string[];
  // au pair
  experienceYears?: number | null;
  pocketMoneyMin?: number | null;
  availableFrom?: Date | string | null;
  drivingLicense?: boolean | null;
  firstAid?: boolean | null;
  workRights?: string | null;
  /** Gallery photos: JSON string or string[] */
  photos?: string | string[] | null;
  // family
  childrenCount?: number | null;
  childrenAges?: string | string[] | null;
  pocketMoney?: number | null;
  startDate?: Date | string | null;
  schoolArea?: string | null;
  lifestyleNotes?: string | null;
  // trust
  referenceCount?: number;
  documentCount?: number;
  safetyScore?: number | null;
};

export type CompletenessAction = {
  id: string;
  label: string;
  detail: string;
  href: string;
  points: number;
  done: boolean;
};

export type CompletenessResult = {
  score: number;
  maxScore: number;
  percent: number;
  remainingPoints: number;
  doneCount: number;
  totalCount: number;
  actions: CompletenessAction[];
  nextThree: CompletenessAction[];
  pending: CompletenessAction[];
  completed: CompletenessAction[];
};

function langs(input: CompletenessInput): string[] {
  if (Array.isArray(input.languages)) return input.languages.filter(Boolean);
  return parseJsonArray(input.languages || "[]");
}

function servicesCount(input: CompletenessInput): number {
  if (Array.isArray(input.services)) return input.services.length;
  return parseJsonArray(input.services || "[]").length;
}

function photosCount(input: CompletenessInput): number {
  if (Array.isArray(input.photos)) {
    return input.photos.filter((p) => typeof p === "string" && p.trim()).length;
  }
  if (!input.photos) return 0;
  return parseJsonArray(input.photos).length;
}

function agesCount(input: CompletenessInput): number {
  if (Array.isArray(input.childrenAges)) {
    return input.childrenAges.filter(Boolean).length;
  }
  return parseJsonArray(input.childrenAges || "[]").length;
}

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const actions: CompletenessAction[] = [];
  const push = (a: CompletenessAction) => actions.push(a);
  const role = (input.role || "").toUpperCase();

  // ——— Shared (stable list for all members) ———
  push({
    id: "photo",
    label: "Add a clear profile photo",
    detail: "Faces get more messages than logos or landscapes.",
    href: "/profile/edit",
    points: 10,
    done: Boolean(input.image && String(input.image).trim()),
  });
  push({
    id: "headline",
    label: "Write a headline",
    detail: "One line that sells your fit (languages, start date, city).",
    href: "/profile/edit",
    points: 10,
    done: Boolean((input.headline || "").trim().length >= 12),
  });
  push({
    id: "bio",
    label: "Expand your bio",
    detail: "At least ~120 characters: routines, ages, what you offer.",
    href: "/profile/edit",
    points: 15,
    done: Boolean((input.bio || "").trim().length >= 120),
  });
  push({
    id: "city",
    label: "Set city & country",
    detail: "Local matches rely on location.",
    href: "/profile/edit",
    points: 10,
    done: Boolean(
      (input.city || "").trim() && (input.country || "").trim()
    ),
  });
  push({
    id: "languages",
    label: "List languages",
    detail: "List every language you speak comfortably.",
    href: "/profile/edit",
    points: 10,
    done: langs(input).length >= 1,
  });
  push({
    id: "services",
    label: "Choose services",
    detail: "Childcare, caregiving, house sitting, and/or pet sitting.",
    href: "/profile/edit",
    points: 10,
    done: servicesCount(input) >= 1,
  });
  push({
    id: "gallery",
    label: "Add a gallery photo",
    detail: "One extra photo of you, home, or care moments.",
    href: "/profile/edit",
    points: 6,
    done: photosCount(input) >= 1,
  });
  push({
    id: "publish",
    label: "Publish your listing",
    detail: "Set status to Active so you appear in browse & Discover.",
    href: "/profile/edit",
    points: 10,
    done: input.status === "ACTIVE",
  });
  push({
    id: "verify",
    label: "Get verified",
    detail: "ID + selfie unlocks the Verified badge.",
    href: "/verification",
    points: 15,
    done: Boolean(input.isVerified),
  });
  push({
    id: "video",
    label: "Add a short video intro",
    detail: "Boosts trust score and placement-ready status.",
    href: "/trust",
    points: 10,
    done: Boolean(input.videoIntroUrl && String(input.videoIntroUrl).trim()),
  });
  push({
    id: "refs",
    label: "Collect a reference",
    detail: "One solid reference increases safety score.",
    href: "/references",
    points: 8,
    done: (input.referenceCount || 0) >= 1,
  });
  push({
    id: "docs",
    label: "Upload a key document",
    detail:
      role === "PARENT"
        ? "ID, house rules, or care notes for your vault."
        : "Passport, police clearance, or first aid cert.",
    href: "/documents",
    points: 8,
    done: (input.documentCount || 0) >= 1,
  });

  // ——— Role-specific (always present for that role) ———
  if (role === "AUPAIR") {
    push({
      id: "experience",
      label: "Add childcare experience",
      detail: "Years of experience (even 1+ counts).",
      href: "/profile/edit",
      points: 8,
      done: Number(input.experienceYears || 0) > 0,
    });
    push({
      id: "pocket",
      label: "Set pocket money expectation",
      detail: "Helps families match budget early.",
      href: "/profile/edit",
      points: 6,
      done:
        input.pocketMoneyMin != null &&
        input.pocketMoneyMin !== ("" as unknown) &&
        Number(input.pocketMoneyMin) > 0,
    });
    push({
      id: "available",
      label: "Set available-from date",
      detail: "Families filter by start window.",
      href: "/profile/edit",
      points: 6,
      done: Boolean(input.availableFrom),
    });
    push({
      id: "workrights",
      label: "Declare work rights / visa status",
      detail: "Citizen, permit, or seeking — sets clear expectations.",
      href: "/profile/edit",
      points: 6,
      done: Boolean(
        input.workRights &&
          String(input.workRights).trim() &&
          input.workRights !== "UNKNOWN"
      ),
    });
  } else if (role === "PARENT") {
    push({
      id: "children",
      label: "Add children count & ages",
      detail: "Sitters need to know who they will care for.",
      href: "/profile/edit",
      points: 10,
      done: Number(input.childrenCount || 0) > 0 && agesCount(input) > 0,
    });
    push({
      id: "budget",
      label: "Set weekly pocket money",
      detail: "Transparent budget filters better matches.",
      href: "/profile/edit",
      points: 6,
      done:
        input.pocketMoney != null &&
        input.pocketMoney !== ("" as unknown) &&
        Number(input.pocketMoney) > 0,
    });
    push({
      id: "start",
      label: "Set start date",
      detail: "Aligns with sitter availability.",
      href: "/profile/edit",
      points: 6,
      done: Boolean(input.startDate),
    });
    push({
      id: "school",
      label: "Add school / area for school runs",
      detail: "Helps sitters who drive or use transit.",
      href: "/profile/edit",
      points: 5,
      done: Boolean((input.schoolArea || "").trim()),
    });
    push({
      id: "lifestyle",
      label: "Add lifestyle / home notes",
      detail: "Day-in-the-life notes help international sitters.",
      href: "/profile/edit",
      points: 5,
      done: Boolean((input.lifestyleNotes || "").trim().length >= 40),
    });
  }

  const maxScore = actions.reduce((s, a) => s + a.points, 0) || 1;
  const completed = actions.filter((a) => a.done);
  const score = completed.reduce((s, a) => s + a.points, 0);
  const pending = actions.filter((a) => !a.done).sort((a, b) => b.points - a.points);
  const percent = Math.min(100, Math.round((score / maxScore) * 100));

  return {
    score,
    maxScore,
    percent,
    remainingPoints: Math.max(0, maxScore - score),
    doneCount: completed.length,
    totalCount: actions.length,
    actions,
    nextThree: pending.slice(0, 3),
    pending,
    completed,
  };
}

export function responseTimeLabel(minutes?: number | null): string | null {
  if (minutes == null || minutes < 0) return null;
  if (minutes <= 30) return "Usually replies within 30 min";
  if (minutes <= 120) return "Usually replies within 2 hours";
  if (minutes <= 1440) return "Usually replies within a day";
  return "Replies within a few days";
}
