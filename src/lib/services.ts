/**
 * AuPairly multi-service marketplace categories.
 * Childcare (au pair) · Tutoring · Caregiving · House Sitting · Pet / dog sitting
 *
 * Product “options” map as:
 *  - Host family → role PARENT
 *  - Au pair → role AUPAIR + CHILDCARE
 *  - Tutor → role AUPAIR + TUTORING
 *  - House sitter → role AUPAIR + HOUSE_SITTING
 *  - Dog sitter → role AUPAIR + PET_SITTING
 */

export const SERVICE_IDS = [
  "CHILDCARE",
  "TUTORING",
  "CAREGIVING",
  "HOUSE_SITTING",
  "PET_SITTING",
] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export type ServiceDef = {
  id: ServiceId;
  name: string;
  shortName: string;
  /** URL path for SEO landing page e.g. /house-sitting */
  slug: string;
  /** Provider-facing (AUPAIR role) */
  providerLabel: string;
  /** Host/client-facing (PARENT role) */
  hostLabel: string;
  tagline: string;
  description: string;
  /** Bullet examples for marketing / landings */
  examples: string[];
  seoTitle: string;
  seoDescription: string;
  icon: "baby" | "book" | "heart" | "home" | "paw";
  color: string;
  bg: string;
  activeTab: string;
};

/** Marketing / onboarding option labels (user-facing roles) */
export const PRODUCT_OPTIONS = [
  {
    id: "HOST_FAMILY",
    label: "Host family",
    role: "PARENT" as const,
    services: [] as ServiceId[],
    description: "I need an au pair, tutor, or sitter at home",
  },
  {
    id: "AUPAIR",
    label: "Au pair",
    role: "AUPAIR" as const,
    services: ["CHILDCARE"] as ServiceId[],
    description: "I offer childcare / live-in or live-out care",
  },
  {
    id: "TUTOR",
    label: "Tutor",
    role: "AUPAIR" as const,
    services: ["TUTORING"] as ServiceId[],
    description: "I offer tutoring and academic support",
  },
  {
    id: "HOUSE_SITTER",
    label: "House sitter",
    role: "AUPAIR" as const,
    services: ["HOUSE_SITTING"] as ServiceId[],
    description: "I look after homes while hosts are away",
  },
  {
    id: "DOG_SITTER",
    label: "Dog sitter",
    role: "AUPAIR" as const,
    services: ["PET_SITTING"] as ServiceId[],
    description: "I offer dog sitting, walking, and pet care",
  },
] as const;

export const SERVICES: Record<ServiceId, ServiceDef> = {
  CHILDCARE: {
    id: "CHILDCARE",
    name: "Childcare",
    shortName: "Au pair / childcare",
    slug: "childcare",
    providerLabel: "I offer childcare / au pair",
    hostLabel: "I need an au pair / childcare",
    tagline: "Au pairs, babysitting & kids’ care",
    description:
      "Trusted care for children — au pairs, babysitting, after-school, special needs, overnight, and more.",
    examples: [
      "Au pairs",
      "Babysitting",
      "Online care",
      "After-school",
      "Special needs",
      "Overnight care",
    ],
    seoTitle: "Childcare & Au Pairs",
    seoDescription:
      "Find verified au pairs, babysitters, and childcare on AuPairly.me — after-school, overnight, special needs, and more.",
    icon: "baby",
    color: "text-teal-800",
    bg: "bg-teal-50 border-teal-200",
    activeTab: "bg-teal-600 text-white border-teal-600",
  },
  TUTORING: {
    id: "TUTORING",
    name: "Tutoring",
    shortName: "Tutor",
    slug: "tutoring",
    providerLabel: "I offer tutoring",
    hostLabel: "I need a tutor",
    tagline: "Academic support & homework help",
    description:
      "Subject tutoring, homework help, exam prep, languages, and special-needs learning support — at home or online.",
    examples: [
      "Maths & science",
      "Languages",
      "Exam prep",
      "Homework help",
      "Reading support",
      "Online tutoring",
    ],
    seoTitle: "Tutors & Academic Support",
    seoDescription:
      "Find verified tutors on AuPairly.me — homework help, exam prep, languages, and subject tutoring for host families.",
    icon: "book",
    color: "text-indigo-900",
    bg: "bg-indigo-50 border-indigo-200",
    activeTab: "bg-indigo-600 text-white border-indigo-600",
  },
  CAREGIVING: {
    id: "CAREGIVING",
    name: "Caregiving",
    shortName: "Caregiving",
    slug: "caregiving",
    providerLabel: "I offer caregiving",
    hostLabel: "I need a caregiver",
    tagline: "Elderly care, companionship & support",
    description:
      "Compassionate support for adults — elderly care, companionship, disability support, personal care, and respite.",
    examples: [
      "Elderly care",
      "Companionship",
      "Disability support",
      "Personal care",
      "Respite care",
    ],
    seoTitle: "Caregiving & Companion Care",
    seoDescription:
      "Find verified caregivers on AuPairly.me — elderly care, companionship, disability support, personal care, and respite.",
    icon: "heart",
    color: "text-rose-900",
    bg: "bg-rose-50 border-rose-200",
    activeTab: "bg-rose-600 text-white border-rose-600",
  },
  HOUSE_SITTING: {
    id: "HOUSE_SITTING",
    name: "House Sitting",
    shortName: "House sitting",
    slug: "house-sitting",
    providerLabel: "I offer house sitting",
    hostLabel: "I need a house sitter",
    tagline: "Your home looked after while you’re away",
    description:
      "Short-term or long-term house sitting, holiday stays, property checks, and plant care.",
    examples: [
      "Short-term sitting",
      "Long-term sitting",
      "Holiday house sitting",
      "Property checks",
      "Plant care",
    ],
    seoTitle: "House Sitting",
    seoDescription:
      "Book trusted house sitters on AuPairly.me — short or long stays, holiday cover, property checks, and plant care.",
    icon: "home",
    color: "text-amber-900",
    bg: "bg-amber-50 border-amber-200",
    activeTab: "bg-amber-600 text-white border-amber-600",
  },
  PET_SITTING: {
    id: "PET_SITTING",
    name: "Pet / dog sitting",
    shortName: "Dog / pet sitter",
    slug: "pet-sitting",
    providerLabel: "I offer dog & pet sitting",
    hostLabel: "I need a dog / pet sitter",
    tagline: "Dogs, cats & pets in safe hands",
    description:
      "Dog sitting and walking, cat sitting, overnight pet care, multi-pet homes, and drop-in visits.",
    examples: [
      "Dog sitting",
      "Dog walking",
      "Cat sitting",
      "Overnight pet care",
      "Multi-pet",
      "Drop-in visits",
    ],
    seoTitle: "Dog & Pet Sitting",
    seoDescription:
      "Find verified dog and pet sitters on AuPairly.me — dog walking, cat sitting, overnight care, multi-pet, and drop-ins.",
    icon: "paw",
    color: "text-orange-900",
    bg: "bg-orange-50 border-orange-200",
    activeTab: "bg-orange-600 text-white border-orange-600",
  },
};

export function isServiceId(v: unknown): v is ServiceId {
  return typeof v === "string" && (SERVICE_IDS as readonly string[]).includes(v);
}

export const SERVICE_LIST = SERVICE_IDS.map((id) => SERVICES[id]);

export function serviceBySlug(slug: string): ServiceDef | null {
  return SERVICE_LIST.find((s) => s.slug === slug) || null;
}

export function serviceFromParam(raw?: string | null): ServiceId | "" {
  if (!raw) return "";
  const upper = raw.toUpperCase().replace(/-/g, "_");
  if (isServiceId(upper)) return upper;
  const bySlug = serviceBySlug(raw.toLowerCase());
  return bySlug?.id || "";
}

/** Build browse URL for sitters or hosts with optional service */
export function browseHref(
  side: "sitters" | "hosts",
  service?: ServiceId | "" | null,
  extra?: Record<string, string>
) {
  const base = side === "sitters" ? "/browse/aupairs" : "/browse/families";
  const params = new URLSearchParams(extra || {});
  if (service) params.set("service", service);
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

export function parseServices(raw?: string | null): ServiceId[] {
  if (!raw) return ["CHILDCARE"];
  try {
    const arr = JSON.parse(raw) as unknown[];
    const ids = arr.filter(isServiceId);
    return ids.length ? Array.from(new Set(ids)) : ["CHILDCARE"];
  } catch {
    return ["CHILDCARE"];
  }
}

export function serializeServices(ids: ServiceId[]): string {
  const clean = Array.from(new Set(ids.filter(isServiceId)));
  return JSON.stringify(clean.length ? clean : ["CHILDCARE"]);
}

export function serviceLabels(ids: ServiceId[]): string[] {
  return ids.map((id) => SERVICES[id].shortName);
}

export function formatServicesLine(ids: ServiceId[]): string {
  return serviceLabels(ids).join(" · ");
}

/** Role copy for the multi-service marketplace */
export function roleCopy(role: "AUPAIR" | "PARENT" | string) {
  if (role === "PARENT") {
    return {
      short: "Host family",
      full: "Host family",
      browseOther: "Find sitters",
      browseOtherHref: "/browse/aupairs",
      editTitle: "Edit host family listing",
      editDesc:
        "What you need: au pair / childcare, tutor, house sitter, dog sitter — or a mix.",
    };
  }
  if (role === "AUPAIR") {
    return {
      short: "Sitter",
      full: "Au pair / sitter / tutor",
      browseOther: "Find host families",
      browseOtherHref: "/browse/families",
      editTitle: "Edit your profile",
      editDesc:
        "Services you offer: au pair, tutor, house sitting, dog sitting — or a mix.",
    };
  }
  return {
    short: "User",
    full: "User",
    browseOther: "Browse",
    browseOtherHref: "/browse/aupairs",
    editTitle: "Edit profile",
    editDesc: "",
  };
}

/** Minimum intro video length for job applications (seconds) */
export const MIN_VIDEO_INTRO_SECONDS = 60;

export const PET_TYPE_OPTIONS = [
  "Dogs",
  "Cats",
  "Birds",
  "Fish",
  "Rabbits",
  "Horses",
  "Farm animals",
  "Reptiles",
  "Other pets",
];

/** Optional specialisms within childcare (profile chips) */
export const CHILDCARE_FOCUS_OPTIONS = [
  "Au pairs",
  "Babysitting",
  "Online care",
  "After-school",
  "Special needs",
  "Overnight care",
];

export const CAREGIVING_FOCUS_OPTIONS = [
  "Elderly care",
  "Companionship",
  "Disability support",
  "Personal care",
  "Respite care",
];
