/**
 * Chat icebreakers & interview helpers — client-safe.
 */

export type IcebreakerContext = {
  myRole: "AUPAIR" | "PARENT" | string;
  theirName: string;
  city?: string | null;
  sharedLanguages?: string[];
  childrenCount?: number | null;
  experienceYears?: number | null;
};

export function icebreakers(ctx: IcebreakerContext): string[] {
  const name = ctx.theirName?.split(" ")[0] || "there";
  const place = ctx.city ? ` in ${ctx.city}` : "";
  const lang =
    ctx.sharedLanguages && ctx.sharedLanguages.length
      ? ` We both speak ${ctx.sharedLanguages[0]}.`
      : "";

  if (ctx.myRole === "PARENT") {
    return [
      `Hi ${name}! We're looking for trusted help${place}.${lang} Open to a short intro call this week?`,
      `Hello ${name} — your profile stood out. We need support with ${ctx.childrenCount ? `${ctx.childrenCount} kid(s)` : "our household"}. What experience fits best?`,
      `Hi ${name}, when could you start, and are you free evenings/weekends?`,
      `Hi ${name}! Do you drive / use public transport, and which services do you offer most?`,
      `Hello ${name} — we'd love a typical day example (childcare, caregiving, house or pets).`,
      `Hi ${name}, we can chat on AuPairly first — then meet in a public place if it feels right.`,
    ];
  }

  return [
    `Hi ${name}! I'm interested in helping your household${place}.${lang} Open to a quick video hello?`,
    `Hello ${name}, I have ${ctx.experienceYears ?? "several"} year(s) of care experience. What matters most to you?`,
    `Hi ${name} — when are you hoping someone can start? Happy to share refs.`,
    `Hi ${name}! I offer childcare / caregiving / house & pet sitting — which do you need most?`,
    `Hello ${name}, I'd love to learn your daily routine and expectations.`,
    `Hi ${name} — we can stay on AuPairly until we both feel comfortable meeting publicly.`,
  ];
}

export function interviewSystemMessage(opts: {
  proposerName: string;
  when: Date | string;
  durationMin: number;
  note?: string | null;
  meetingUrl?: string | null;
}): string {
  const when =
    opts.when instanceof Date ? opts.when : new Date(opts.when);
  const whenLabel = when.toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const note = opts.note ? `\nNote: ${opts.note}` : "";
  const link = opts.meetingUrl ? `\nLink: ${opts.meetingUrl}` : "";
  return `📅 Interview proposed by ${opts.proposerName}\nWhen: ${whenLabel}\nDuration: ${opts.durationMin} min${note}${link}\n\nReply to accept or suggest another time.`;
}

/** Soft safety prompt when message looks like sharing contact too early */
export function safetyWarningForMessage(body: string): string | null {
  const t = body.toLowerCase();
  const patterns = [
    /whatsapp/,
    /\b\+?\d{10,}\b/,
    /\b0\d{9}\b/,
    /telegram/,
    /@gmail\.com/,
    /@yahoo\./,
    /@icloud\./,
    /meet me at my house/,
    /send me your address/,
  ];
  if (patterns.some((p) => p.test(t))) {
    return "Tip: Keep early chats on AuPairly. Avoid sharing phone numbers or home addresses until you trust each other — meet in public first.";
  }
  return null;
}
