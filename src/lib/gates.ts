/**
 * Product gates — profile quality before Discover / boost / featured placement.
 * Client-safe pure helpers.
 */

import {
  computeCompleteness,
  type CompletenessInput,
} from "@/lib/completeness";

/** Minimum profile score (%) before Discover / boost. */
export const MIN_DISCOVER_PERCENT = 70;

/**
 * Hard requirements before a listing can go ACTIVE.
 * Discover still requires MIN_DISCOVER_PERCENT via marketplaceReady.
 * Soft coach: return blockers for UI; APIs reject ACTIVE until ok.
 */
export function canPublishActive(input: CompletenessInput): {
  ok: boolean;
  percent: number;
  blockers: string[];
  reason?: string;
} {
  const { percent } = computeCompleteness({ ...input, status: "ACTIVE" });
  const blockers: string[] = [];

  if (!input.image) blockers.push("Add a clear profile photo");
  if (!input.city || !String(input.city).trim())
    blockers.push("Set your city");
  if (!input.country || !String(input.country).trim())
    blockers.push("Set your country");
  if (!((input.headline || "").trim().length >= 12))
    blockers.push("Write a short headline (12+ characters)");
  if (!((input.bio || "").trim().length >= 60))
    blockers.push("Expand your bio (at least ~60 characters)");

  if (blockers.length) {
    return {
      ok: false,
      percent,
      blockers,
      reason: `Finish your listing before publishing: ${blockers[0]}.`,
    };
  }
  return { ok: true, percent, blockers: [] };
}

/** Hard requirements for marketplace participation. */
export function marketplaceReady(input: CompletenessInput): {
  ok: boolean;
  percent: number;
  blockers: string[];
  reason?: string;
} {
  const { percent } = computeCompleteness(input);
  const blockers: string[] = [];

  if (!input.image) blockers.push("Add a clear profile photo");
  if (!input.city || !input.country) blockers.push("Set your city and country");
  if (!((input.headline || "").trim().length >= 12))
    blockers.push("Write a short headline");
  if (!((input.bio || "").trim().length >= 80))
    blockers.push("Expand your bio (at least a short paragraph)");
  if (input.status !== "ACTIVE") blockers.push("Publish your listing (Active)");
  if (percent < MIN_DISCOVER_PERCENT)
    blockers.push(`Reach ${MIN_DISCOVER_PERCENT}% profile completeness (now ${percent}%)`);

  if (blockers.length) {
    return {
      ok: false,
      percent,
      blockers,
      reason: `Complete your profile first: ${blockers[0]}.`,
    };
  }
  return { ok: true, percent, blockers: [] };
}

export function trustBadgeLabel(opts: {
  isVerified?: boolean;
  safetyScore?: number | null;
  placementVerified?: boolean;
  referenceCount?: number;
}): string | null {
  if (opts.placementVerified) return "Placement ready";
  if (opts.isVerified && (opts.safetyScore ?? 0) >= 70) return "Trusted";
  if (opts.isVerified) return "Verified";
  if ((opts.referenceCount ?? 0) >= 1) return "Referenced";
  return null;
}
