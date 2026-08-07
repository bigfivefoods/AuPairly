import { isVerifyNowConfigured } from "@/lib/kyc/verifynow";
import { isDiditConfigured } from "@/lib/kyc/didit";

export type KycRegion = "ZA" | "INTERNATIONAL";

export function resolveKycRegion(country?: string | null): KycRegion {
  const c = (country || "").trim().toUpperCase();
  if (
    c === "ZA" ||
    c === "ZAF" ||
    c === "SOUTH AFRICA" ||
    c === "SOUTH-AFRICA" ||
    c.includes("SOUTH AFRICA")
  ) {
    return "ZA";
  }
  return "INTERNATIONAL";
}

export function kycProvidersStatus() {
  return {
    verifynow: isVerifyNowConfigured(),
    didit: isDiditConfigured(),
    facebook: Boolean(
      process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET
    ),
  };
}
