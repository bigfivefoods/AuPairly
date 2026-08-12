/**
 * Ops runbook content for management team (client-safe).
 */

export type RunbookSection = {
  id: string;
  title: string;
  steps: string[];
  hrefs?: { label: string; href: string }[];
};

export const OPS_RUNBOOK: RunbookSection[] = [
  {
    id: "verify",
    title: "Identity verification (24–36h target)",
    steps: [
      "Open Admin → Verification queue.",
      "Check ID document vs selfie face match; reject with a clear reason if blurry/mismatched.",
      "Approve only when name/age plausibly match the profile.",
      "Member gets notified on decision — no need to email manually.",
    ],
    hrefs: [{ label: "Admin queue", href: "/admin" }],
  },
  {
    id: "reviews",
    title: "Review moderation",
    steps: [
      "Open Admin → Reviews queue.",
      "Publish reviews that are fair and non-abusive; reject spam or personal data dumps.",
      "Prefer mutual publish rules already in product; override only for safety.",
    ],
    hrefs: [{ label: "Admin", href: "/admin" }],
  },
  {
    id: "reports",
    title: "Safety reports (priority)",
    steps: [
      "Triage open reports within 24 hours.",
      "If harassment / scams / minors: suspend account immediately (suspend reason required).",
      "Preserve evidence in support notes; do not share private docs publicly.",
    ],
    hrefs: [
      { label: "Support", href: "/support" },
      { label: "Admin", href: "/admin" },
    ],
  },
  {
    id: "suspend",
    title: "Suspend / ban",
    steps: [
      "Management → find user → suspend with reason.",
      "Suspended users cannot log in or message.",
      "Lift suspend only after owner review.",
    ],
    hrefs: [{ label: "Management", href: "/manage" }],
  },
  {
    id: "density",
    title: "City density (ghost towns)",
    steps: [
      "Check Ghost towns on this page weekly.",
      "Invite local hosts + sitters via Invite link and school/parent groups.",
      "Prioritise metros until each has 5+ active listings on both sides.",
    ],
  },
  {
    id: "billing",
    title: "Billing / Paystack",
    steps: [
      "Confirm live keys on Vercel Production (sk_live_ / pk_live_).",
      "Webhook: /api/billing/webhook — event charge.success.",
      "If plan stuck: check PaymentTransaction + User.plan in Management.",
    ],
  },
  {
    id: "crons",
    title: "Cron health",
    steps: [
      "Cron last runs should update daily (alerts, activation).",
      "If a job is stale >26h, check Vercel Cron + CRON_SECRET.",
      "Management receives SLA email when queues age past 36h.",
    ],
  },
];
