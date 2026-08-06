import { Mail, MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

/**
 * Shared Contact us block — email + WhatsApp.
 */
export function ContactUs({
  className,
  compact = false,
  title = "Contact us",
}: {
  className?: string;
  compact?: boolean;
  title?: string;
}) {
  if (compact) {
    return (
      <div className={cn("space-y-1.5 text-sm text-stone-500", className)}>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
          {title}
        </p>
        <a
          href={BRAND.emailHref}
          className="flex items-center gap-2 hover:text-teal-700"
        >
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {BRAND.email}
        </a>
        <a
          href={BRAND.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-teal-700"
        >
          <MessageCircle className="h-3.5 w-3.5 shrink-0" />
          WhatsApp {BRAND.whatsapp}
        </a>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/80 to-white p-5 shadow-sm sm:p-6",
        className
      )}
    >
      <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-500">
        Reach the AuPairly team by email or WhatsApp — we usually reply within one business day.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href={BRAND.emailHref}
          className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-teal-300 hover:text-teal-800"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
            <Mail className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-stone-400">
              Email
            </span>
            <span className="block truncate">{BRAND.email}</span>
          </span>
        </a>
        <a
          href={BRAND.whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-medium uppercase tracking-wide text-stone-400">
              WhatsApp
            </span>
            <span className="block">{BRAND.whatsapp}</span>
          </span>
        </a>
      </div>
    </div>
  );
}
