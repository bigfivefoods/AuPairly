import { redirect } from "next/navigation";

export const metadata = { title: "Billing" };

/**
 * Seller storefront / payouts are disabled.
 * AuPairly only charges subscription membership (and optional listing boosts).
 */
export default function ConnectPage() {
  redirect("/billing");
}
