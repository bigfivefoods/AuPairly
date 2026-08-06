/**
 * AuPairly multi-service marketplace.
 * One platform for childcare / au pairing, house sitting, and pet sitting.
 */

export const SERVICE_IDS = ["CHILDCARE", "HOUSE_SITTING", "PET_SITTING"] as const;
export type ServiceId = (typeof SERVICE_IDS)[number];

export type ServiceDef = {
  id: ServiceId;
  name: string;
  shortName: string;
  /** Provider-facing (AUPAIR role) */
  providerLabel: string;
  /** Host/client-facing (PARENT role) */
  hostLabel: string;
  tagline: string;
  description: string;
  icon: "baby" | "home" | "paw";
  color: string;
  bg: string;
};

export const SERVICES: Record<ServiceId, ServiceDef> = {
  CHILDCARE: {
    id: "CHILDCARE",
    name: "Childcare / Au pairing",
    shortName: "Childcare",
    providerLabel: "I offer childcare / au pairing",
    hostLabel: "I need childcare / an au pair",
    tagline: "Au pairs, nannies & trusted childcare",
    description:
      "Live-in or live-out childcare, school runs, and cultural exchange-style au pairing.",
    icon: "baby",
    color: "text-teal-800",
    bg: "bg-teal-50 border-teal-200",
  },
  HOUSE_SITTING: {
    id: "HOUSE_SITTING",
    name: "House sitting",
    shortName: "House sitting",
    providerLabel: "I offer house sitting",
    hostLabel: "I need a house sitter",
    tagline: "Trusted sitters while you’re away",
    description:
      "Home care, plant watering, mail, security presence, and property checks.",
    icon: "home",
    color: "text-amber-900",
    bg: "bg-amber-50 border-amber-200",
  },
  PET_SITTING: {
    id: "PET_SITTING",
    name: "Pet sitting",
    shortName: "Pet sitting",
    providerLabel: "I offer pet sitting",
    hostLabel: "I need a pet sitter",
    tagline: "Dogs, cats & pets in safe hands",
    description:
      "In-home pet care, walks, feeding, medication, and overnight stays.",
    icon: "paw",
    color: "text-orange-900",
    bg: "bg-orange-50 border-orange-200",
  },
};

export const SERVICE_LIST = SERVICE_IDS.map((id) => SERVICES[id]);

export function isServiceId(v: unknown): v is ServiceId {
  return typeof v === "string" && (SERVICE_IDS as readonly string[]).includes(v);
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
      short: "Host",
      full: "Host / family",
      browseOther: "Find sitters",
      browseOtherHref: "/browse/aupairs",
      editTitle: "Edit host listing",
      editDesc: "What you need: childcare, house sitting, pet sitting — or a mix.",
    };
  }
  if (role === "AUPAIR") {
    return {
      short: "Sitter",
      full: "Sitter / provider",
      browseOther: "Find hosts",
      browseOtherHref: "/browse/families",
      editTitle: "Edit sitter profile",
      editDesc: "Services you offer: childcare, house sitting, pet sitting — or a mix.",
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
