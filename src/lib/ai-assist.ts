/**
 * Lightweight "AI" assist without external LLM keys.
 * Rule-based coaches so the product works offline / without API spend.
 * Swap for a real model later via SPACE X AI / OpenAI if desired.
 */

export function coachProfile(input: {
  role: string;
  bio?: string | null;
  headline?: string | null;
  city?: string | null;
  languages?: string[];
  experienceYears?: number | null;
  childrenCount?: number | null;
}): { score: number; tips: string[] } {
  const tips: string[] = [];
  let score = 30;
  const bio = (input.bio || "").trim();
  const headline = (input.headline || "").trim();

  if (headline.length >= 12) score += 15;
  else tips.push("Add a clear headline (e.g. “Bilingual au pair available from March”).");

  if (bio.length >= 120) score += 20;
  else if (bio.length >= 40) {
    score += 10;
    tips.push("Expand your bio — mention ages of children, routines, and what makes you a great fit.");
  } else {
    tips.push("Write a bio of at least a few sentences so families/au pairs trust you.");
  }

  if (input.city) score += 10;
  else tips.push("Set your city so local matches can find you.");

  if ((input.languages || []).length >= 2) score += 10;
  else tips.push("List all languages you speak — it strongly improves match quality.");

  if (input.role === "AUPAIR") {
    if ((input.experienceYears || 0) > 0) score += 10;
    else tips.push("Add years of childcare experience, even informal (siblings, babysitting).");
  } else {
    if ((input.childrenCount || 0) > 0) score += 10;
    else tips.push("Specify how many children and their ages.");
  }

  if (tips.length === 0) tips.push("Looking strong — add a short video intro for placement-verified status.");

  return { score: Math.min(100, score), tips: tips.slice(0, 5) };
}

export function suggestFirstMessage(input: {
  myRole: string;
  theirName: string;
  sharedLanguages?: string[];
  city?: string | null;
}): string {
  const lang =
    input.sharedLanguages && input.sharedLanguages.length
      ? ` I noticed we both speak ${input.sharedLanguages[0]}.`
      : "";
  const place = input.city ? ` in ${input.city}` : "";
  if (input.myRole === "PARENT") {
    return `Hi ${input.theirName}, we’re a host family${place} looking for a caring au pair. Your profile stood out.${lang} Would you be open to a short video chat this week?`;
  }
  return `Hi ${input.theirName}, I’m an au pair interested in your family${place}.${lang} I’d love to learn more about the children and your expectations. Are you free for a quick introduction call?`;
}
