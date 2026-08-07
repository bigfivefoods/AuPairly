import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * AuPairly brand logo (wordmark + heart mark).
 * Source assets in /public/logo-*.png — colours:
 * Au + heart = gold from logo-source.jpg; Pairly = site --primary-dark (#0f766e).
 */
export function BrandLogo({
  className,
  priority = false,
  variant = "nav",
}: {
  className?: string;
  priority?: boolean;
  /** nav = compact header height; full = marketing blocks */
  variant?: "nav" | "full";
}) {
  if (variant === "full") {
    return (
      <Image
        src="/logo-transparent.png"
        alt="AuPairly"
        width={869}
        height={387}
        className={cn("h-auto w-[11rem] sm:w-[14rem]", className)}
        priority={priority}
      />
    );
  }

  return (
    <Image
      src="/logo-nav.png"
      alt="AuPairly"
      width={200}
      height={79}
      className={cn(
        "h-8 w-auto sm:h-9 object-contain object-left",
        className
      )}
      priority={priority}
    />
  );
}
