/**
 * Profile completeness coach — actionable next steps for trust & conversion.
 * Client-safe pure helpers (no prisma).
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
  // au pair
  experienceYears?: number | null;
  pocketMoneyMin?: number | null;
  availableFrom?: Date | string | null;
  drivingLicense?: boolean | null;
  firstAid?: boolean | null;
  workRights?: string | null;
  photos?: string | null;
  // family
  childrenCount?: number | null;
  childrenAges?: string | null;
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
  actions: CompletenessAction[];
  nextThree: CompletenessAction[];
};

function langs(input: CompletenessInput): string[] {
  if (Array.isArray(input.languages)) return input.languages;
  return parseJsonArray(input.languages || "[]");
}

export function computeCompleteness(input: CompletenessInput): CompletenessResult {
  const actions: CompletenessAction[] = [];

  const push = (a: CompletenessAction) => actions.push(a);

  push({
    id: "photo",
    label: "Add a clear profile photo",
    detail: "Faces get more messages than logos or landscapes.",
    href: "/profile/edit",
    points: 10,
    done: Boolean(input.image),
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
    done: Boolean(input.city && input.country),
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
    points: 12,
    done: Boolean(input.videoIntroUrl),
  });
  push({
    id: "refs",
    label: "Collect a reference",
    detail: "One solid reference increases safety score.",
    href: "/references",
    points: 8,
    done: (input.referenceCount || 0) >= 1,
  });

  if (input.role === "AUPAIR") {
    push({
      id: "experience",
      label: "Add childcare experience",
      detail: "Even informal babysitting counts.",
      href: "/profile/edit",
      points: 8,
      done: (input.experienceYears || 0) > 0,
    });
    push({
      id: "pocket",
      label: "Set pocket money expectation",
      detail: "Helps families match budget early.",
      href: "/profile/edit",
      points: 6,
      done: input.pocketMoneyMin != null && input.pocketMoneyMin > 0,
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
      done: Boolean(input.workRights && input.workRights !== "UNKNOWN"),
    });
    push({
      id: "docs",
      label: "Upload a key document",
      detail: "Passport, police clearance, or first aid cert.",
      href: "/documents",
      points: 8,
      done: (input.documentCount || 0) >= 1,
    });
  } else if (input.role === "PARENT") {
    push({
      id: "children",
      label: "Add children count & ages",
      detail: "Au pairs need to know who they will care for.",
      href: "/profile/edit",
      points: 10,
      done: (input.childrenCount || 0) > 0 && parseJsonArray(input.childrenAges || "[]").length > 0,
    });
    push({
      id: "budget",
      label: "Set weekly pocket money",
      detail: "Transparent budget filters better matches.",
      href: "/profile/edit",
      points: 6,
      done: input.pocketMoney != null && input.pocketMoney > 0,
    });
    push({
      id: "start",
      label: "Set start date",
      detail: "Aligns with au pair availability.",
      href: "/profile/edit",
      points: 6,
      done: Boolean(input.startDate),
    });
    push({
      id: "school",
      label: "Add school / area for school runs",
      detail: "Helps au pairs who drive or use transit.",
      href: "/profile/edit",
      points: 5,
      done: Boolean((input.schoolArea || "").trim()),
    });
    push({
      id: "lifestyle",
      label: "Add lifestyle / home notes",
      detail: "Day-in-the-life notes help international au pairs.",
      href: "/profile/edit",
      points: 5,
      done: Boolean((input.lifestyleNotes || "").trim().length >= 40),
    });
  }

  const maxScore = actions.reduce((s, a) => s + a.points, 0) || 1;
  const score = actions.filter((a) => a.done).reduce((s, a) => s + a.points, 0);
  const pending = actions.filter((a) => !a.done).sort((a, b) => b.points - a.points);
  const percent = Math.round((score / maxScore) * 100);

  return {
    score,
    maxScore,
    percent,
    actions,
    nextThree: pending.slice(0, 3),
  };
}

export function responseTimeLabel(minutes?: number | null): string | null {
  if (minutes == null || minutes < 0) return null;
  if (minutes <= 30) return "Usually replies within 30 min";
  if (minutes <= 120) return "Usually replies within 2 hours";
  if (minutes <= 1440) return "Usually replies within a day";
  return "Replies within a few days";
}
