import { isVerifyNowConfigured } from "@/lib/kyc/verifynow";
import { isDiditConfigured } from "@/lib/kyc/didit";
import { facebookAppId, isFacebookConfigured } from "@/lib/facebook";

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
    /** Fully ready when app id + secret; app id alone is enough for OAuth start UI */
    facebook: isFacebookConfigured() || Boolean(facebookAppId()),
  };
}
