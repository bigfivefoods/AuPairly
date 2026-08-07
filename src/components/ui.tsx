import { cn, initials } from "@/lib/utils";
import { BadgeCheck, Star } from "lucide-react";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "accent" | "ghost" | "danger";
}) {
  const styles = {
    primary: "btn-primary btn-inline",
    secondary: "btn-secondary btn-inline",
    accent: "btn-accent btn-inline",
    ghost: "btn-inline inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold text-stone-700 hover:bg-stone-100 transition",
    danger: "btn-inline inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 font-semibold bg-red-600 text-white hover:bg-red-700 transition",
  };
  return <button className={cn(styles[variant], className)} {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input-field", className)} {...props} />;
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn("input-field min-h-[120px] resize-y", className)}
      {...props}
    />
  );
}

export function Label({ children, htmlFor, className }: { children: ReactNode; htmlFor?: string; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("mb-1.5 block text-sm font-medium text-stone-700", className)}>
      {children}
    </label>
  );
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("input-field appearance-none bg-white", className)} {...props}>
      {children}
    </select>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[var(--shadow)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "accent" | "verified";
  className?: string;
}) {
  const styles = {
    default: "bg-stone-100 text-stone-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    accent: "bg-orange-50 text-orange-700",
    verified: "badge-verified",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", styles[variant], className)}>
      {children}
    </span>
  );
}

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <Badge variant="verified" className={className}>
      <BadgeCheck className="h-3.5 w-3.5" />
      Verified
    </Badge>
  );
}

export function Avatar({
  name,
  image,
  size = "md",
  className,
}: {
  name: string;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  // Fixed square box — must not rely on <img> height (globals set img { height: auto })
  const sizes = {
    sm: "h-8 w-8 min-h-8 min-w-8 text-xs",
    md: "h-11 w-11 min-h-11 min-w-11 text-sm",
    lg: "h-16 w-16 min-h-16 min-w-16 text-lg",
    xl: "h-24 w-24 min-h-24 min-w-24 text-2xl",
  };
  // Prefer uploaded profile photo over initials whenever a URL is present
  const src = typeof image === "string" && image.trim() ? image.trim() : null;

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 aspect-square items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-teal-500 to-teal-700 font-semibold text-white shadow-sm ring-2 ring-white",
        sizes[size],
        className
      )}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className="absolute inset-0 !h-full !w-full max-w-none rounded-full object-cover object-center"
        />
      ) : (
        <span className="select-none">{initials(name)}</span>
      )}
    </div>
  );
}

export function Stars({ rating, count }: { rating: number; count?: number }) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
      <span className="font-semibold text-stone-800">{rating.toFixed(1)}</span>
      {count !== undefined && <span className="text-stone-500">({count})</span>}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
        {icon}
      </div>
      <h3 className="font-display text-xl font-semibold text-stone-900">{title}</h3>
      <p className="mt-2 max-w-sm text-stone-500">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ChipToggle({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-sm font-medium transition",
        selected
          ? "border-teal-600 bg-teal-600 text-white"
          : "border-stone-200 bg-white text-stone-600 hover:border-teal-300 hover:text-teal-700"
      )}
    >
      {label}
    </button>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative z-0 mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-teal-700 sm:text-sm">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl md:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-stone-500 sm:text-base">{description}</p>
        )}
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}
