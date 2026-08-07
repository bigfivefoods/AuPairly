/**
 * Display helpers — platform billing is ZAR (Paystack).
 */

export function formatZar(amount: number | null | undefined, opts?: { compact?: boolean }) {
  if (amount == null || Number.isNaN(Number(amount))) return null;
  const n = Number(amount);
  if (opts?.compact) {
    return `R${n.toLocaleString("en-ZA")}`;
  }
  return `R${n.toLocaleString("en-ZA", { maximumFractionDigits: 0 })}`;
}

/** Weekly pocket money / stipend on listings */
export function formatWeeklyStipend(
  amount: number | null | undefined,
  opts?: { prefix?: string }
) {
  const formatted = formatZar(amount);
  if (!formatted) return null;
  const prefix = opts?.prefix ?? "from ";
  return `${prefix}${formatted}/wk`;
}
