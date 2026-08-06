/**
 * Pure placement helpers — safe to import from Client Components.
 * (Do not import prisma here.)
 */

export const PLACEMENT_STATUSES = [
  "INTERESTED",
  "INTERVIEW",
  "TRIAL",
  "PLACED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type PlacementStatus = (typeof PLACEMENT_STATUSES)[number];

export const PLACEMENT_LABELS: Record<string, string> = {
  INTERESTED: "Interested",
  INTERVIEW: "Interview",
  TRIAL: "Trial week",
  PLACED: "Placed",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

export function defaultContract(params: {
  parentName: string;
  aupairName: string;
  city?: string;
  pocketMoney?: string;
  weeklyHours?: string;
  startDate?: string;
}) {
  return `AUPAIRLY PLACEMENT AGREEMENT (template)

This informal agreement is between ${params.parentName} (Host Family) and ${params.aupairName} (Au Pair).

1. Location: ${params.city || "[city]"}
2. Start date: ${params.startDate || "[date]"}
3. Weekly hours: ${params.weeklyHours || "[hours]"} (cultural exchange / childcare as agreed)
4. Pocket money: ${params.pocketMoney || "[amount]"} per week
5. Accommodation: private room / as discussed
6. Notice period: 2 weeks written notice by either party
7. Both parties agree to AuPairly Community Guidelines and applicable local laws.

This template is not legal advice. Adapt for your jurisdiction (including South Africa labour / immigration rules). Sign only after independent review.

Host family: ________________  Date: ______
Au pair: _____________________  Date: ______
`;
}
