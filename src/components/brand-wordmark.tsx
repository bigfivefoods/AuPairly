import { cn } from "@/lib/utils";

/**
 * AuPairly logo wordmark: Au + ly share the base colour; Pair is accent.
 */
export function BrandWordmark({
  className,
  pairClassName = "text-teal-600",
  as: Tag = "span",
}: {
  className?: string;
  /** Colour for “Pair” only */
  pairClassName?: string;
  as?: "span" | "div" | "p";
}) {
  return (
    <Tag className={cn("font-display tracking-tight", className)}>
      Au
      <span className={pairClassName}>Pair</span>
      ly
    </Tag>
  );
}
