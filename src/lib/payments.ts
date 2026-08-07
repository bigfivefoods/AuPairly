import { prisma } from "@/lib/prisma";

export type PaymentKind =
  | "MEMBERSHIP"
  | "BOOST"
  | "SUCCESS_FEE"
  | "MARKETPLACE"
  | "DEMO"
  | "OTHER";

export type PaymentStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

/**
 * Record a payment on the user ledger (idempotent when `reference` is set).
 */
export async function recordPayment(input: {
  userId: string;
  kind: PaymentKind;
  amountCents: number;
  description: string;
  reference?: string | null;
  provider?: string;
  status?: PaymentStatus;
  currency?: string;
  paidAt?: Date;
  meta?: Record<string, unknown> | null;
}) {
  const reference = input.reference?.trim() || null;
  const data = {
    userId: input.userId,
    kind: input.kind,
    status: input.status || "SUCCESS",
    amountCents: Math.max(0, Math.round(input.amountCents)),
    currency: input.currency || "ZAR",
    description: input.description,
    reference,
    provider: input.provider || "paystack",
    meta: input.meta ? JSON.stringify(input.meta) : null,
    paidAt: input.paidAt || new Date(),
  };

  if (reference) {
    return prisma.paymentTransaction.upsert({
      where: { reference },
      create: data,
      update: {
        status: data.status,
        amountCents: data.amountCents,
        description: data.description,
        meta: data.meta,
        paidAt: data.paidAt,
      },
    });
  }

  return prisma.paymentTransaction.create({ data });
}

export function formatZar(cents: number) {
  return `R${(cents / 100).toLocaleString("en-ZA", {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

export function paymentKindLabel(kind: string) {
  switch (kind) {
    case "MEMBERSHIP":
      return "Membership";
    case "BOOST":
      return "Profile boost";
    case "SUCCESS_FEE":
      return "Placement success fee";
    case "MARKETPLACE":
      return "Marketplace";
    case "DEMO":
      return "Demo / test";
    default:
      return kind;
  }
}
