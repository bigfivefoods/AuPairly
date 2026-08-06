/**
 * Tiny client-safe helper — keep separate from the large dictionaries module
 * so Turbopack/webpack always resolve a real function export.
 */

export type ServiceLabelId =
  | "CHILDCARE"
  | "CAREGIVING"
  | "HOUSE_SITTING"
  | "PET_SITTING";

export type ServiceLabelDict = {
  service_childcare: string;
  service_caregiving: string;
  service_house_sitting: string;
  service_pet_sitting: string;
};

const FALLBACK: Record<ServiceLabelId, string> = {
  CHILDCARE: "Childcare",
  CAREGIVING: "Caregiving",
  HOUSE_SITTING: "House sitting",
  PET_SITTING: "Pet sitting",
};

export function serviceLabel(
  dict: Partial<ServiceLabelDict> | null | undefined,
  id: ServiceLabelId | string
): string {
  const key = id as ServiceLabelId;
  if (!dict) return FALLBACK[key] || String(id);

  switch (key) {
    case "CHILDCARE":
      return dict.service_childcare || FALLBACK.CHILDCARE;
    case "CAREGIVING":
      return dict.service_caregiving || FALLBACK.CAREGIVING;
    case "HOUSE_SITTING":
      return dict.service_house_sitting || FALLBACK.HOUSE_SITTING;
    case "PET_SITTING":
      return dict.service_pet_sitting || FALLBACK.PET_SITTING;
    default:
      return FALLBACK[key as ServiceLabelId] || String(id);
  }
}
