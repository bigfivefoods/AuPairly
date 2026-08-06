import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function toJsonArray(arr: string[] | number[]): string {
  return JSON.stringify(arr ?? []);
}

export function formatLocation(city?: string | null, country?: string | null) {
  return [city, country].filter(Boolean).join(", ") || "Location TBD";
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export const LANGUAGE_OPTIONS = [
  "English",
  "Spanish",
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Dutch",
  "Mandarin",
  "Japanese",
  "Korean",
  "Arabic",
  "Hindi",
  "Russian",
  "Polish",
  "Swedish",
  "Norwegian",
  "Danish",
  "Turkish",
  "Greek",
  "Hebrew",
];

export const SKILL_OPTIONS = [
  "Infants (0–1)",
  "Toddlers (1–3)",
  "Preschool (3–5)",
  "School-age (6–12)",
  "Teens",
  "Special needs",
  "Homework help",
  "Meal prep",
  "Light housekeeping",
  "Activities & sports",
  "Music",
  "Arts & crafts",
  "Pet care",
  "Overnight care",
  "Multiple children",
];

export const DUTY_OPTIONS = [
  "Childcare",
  "School drop-off / pick-up",
  "Homework supervision",
  "Meal preparation",
  "Light housework",
  "Laundry",
  "Activities & outings",
  "Overnight care",
  "Pet care",
];

export const OFFER_OPTIONS = [
  "Private room",
  "Shared bathroom",
  "Private bathroom",
  "Meals included",
  "Wi‑Fi",
  "Language practice",
  "Gym membership",
  "Public transport pass",
  "Car access",
  "Weekend free time",
  "Vacation days",
];

export const COUNTRY_OPTIONS = [
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Spain",
  "Italy",
  "Netherlands",
  "Switzerland",
  "Austria",
  "Belgium",
  "Ireland",
  "Sweden",
  "Norway",
  "Denmark",
  "New Zealand",
  "Portugal",
  "Mexico",
  "United Arab Emirates",
];
