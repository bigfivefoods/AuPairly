import Link from "next/link";
import { ShieldCheck, MapPin, Users, Phone } from "lucide-react";

/** Public-first meet tips — show before first in-person / after match */
export function SafetyMeetChecklist({
  compact,
}: {
  compact?: boolean;
}) {
  const items = [
    {
      icon: <MapPin className="h-4 w-4" />,
      text: "First meet in a public place (café, park)",
    },
    {
      icon: <Users className="h-4 w-4" />,
      text: "Tell a friend where you are and when you’ll check in",
    },
    {
      icon: <Phone className="h-4 w-4" />,
      text: "Keep early chats on AuPairly — share numbers only when you trust",
    },
    {
      icon: <ShieldCheck className="h-4 w-4" />,
      text: "Prefer verified profiles and mutual reviews",
    },
  ];

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-teal-100 bg-teal-50/50 px-3 py-3"
          : "rounded-2xl border border-teal-200 bg-teal-50/60 px-4 py-4"
      }
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-teal-900">
        <ShieldCheck className="h-4 w-4" />
        Before you meet in person
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item.text} className="flex gap-2 text-xs text-teal-900/90 sm:text-sm">
            <span className="mt-0.5 shrink-0 text-teal-700">{item.icon}</span>
            {item.text}
          </li>
        ))}
      </ul>
      {!compact && (
        <Link
          href="/safety"
          className="mt-3 inline-block text-xs font-semibold text-teal-800 hover:underline"
        >
          Full safety guide →
        </Link>
      )}
    </div>
  );
}
