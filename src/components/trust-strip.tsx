import { Shield, Star, Clock, BadgeCheck, Video, FileCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export function TrustStrip({
  isVerified,
  rating,
  reviewCount,
  safetyScore,
  responseLabel,
  isUrgent,
  hasVideo,
  hasReferences,
  placementVerified,
  isFeatured,
  isFounding,
  className,
}: {
  isVerified?: boolean;
  rating?: number | null;
  reviewCount?: number | null;
  safetyScore?: number | null;
  responseLabel?: string | null;
  isUrgent?: boolean;
  hasVideo?: boolean;
  hasReferences?: boolean;
  placementVerified?: boolean;
  isFeatured?: boolean;
  /** Thin-city founding boost */
  isFounding?: boolean;
  className?: string;
}) {
  const chips: { key: string; label: string; icon: React.ReactNode; className: string }[] = [];

  if (isFounding || isFeatured) {
    chips.push({
      key: "f",
      label: isFounding ? "Founding member" : "Featured",
      icon: <Award className="h-3 w-3" />,
      className: "bg-amber-50 text-amber-900",
    });
  }
  if (isVerified) {
    chips.push({
      key: "v",
      label: "ID verified",
      icon: <BadgeCheck className="h-3 w-3" />,
      className: "bg-emerald-50 text-emerald-800",
    });
  }
  if (hasVideo) {
    chips.push({
      key: "vid",
      label: "Video intro",
      icon: <Video className="h-3 w-3" />,
      className: "bg-violet-50 text-violet-900",
    });
  }
  if (hasReferences) {
    chips.push({
      key: "ref",
      label: "References",
      icon: <FileCheck className="h-3 w-3" />,
      className: "bg-sky-50 text-sky-900",
    });
  }
  if (placementVerified) {
    chips.push({
      key: "pv",
      label: "Placement verified",
      icon: <Award className="h-3 w-3" />,
      className: "bg-teal-100 text-teal-900",
    });
  }
  if (responseLabel) {
    chips.push({
      key: "r",
      label: responseLabel,
      icon: <Clock className="h-3 w-3" />,
      className: "bg-teal-50 text-teal-800",
    });
  }
  if (typeof safetyScore === "number" && safetyScore >= 60) {
    chips.push({
      key: "s",
      label: `Safety ${safetyScore}`,
      icon: <Shield className="h-3 w-3" />,
      className: "bg-stone-100 text-stone-700",
    });
  }
  if (rating && rating > 0) {
    chips.push({
      key: "stars",
      label: `${rating.toFixed(1)}${reviewCount ? ` · ${reviewCount}` : ""}`,
      icon: <Star className="h-3 w-3" />,
      className: "bg-amber-50 text-amber-900",
    });
  }
  if (isUrgent) {
    chips.push({
      key: "u",
      label: "Urgent need",
      icon: <Shield className="h-3 w-3" />,
      className: "bg-orange-100 text-orange-900",
    });
  }

  if (!chips.length) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {chips.map((c) => (
        <span
          key={c.key}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            c.className
          )}
        >
          {c.icon}
          {c.label}
        </span>
      ))}
    </div>
  );
}
