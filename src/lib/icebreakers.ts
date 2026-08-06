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
      `Hi ${name}! We're a family${place} looking for a caring au pair.${lang} Would you like a short intro call this week?`,
      `Hello ${name} — your profile stood out. We have ${ctx.childrenCount || "young"} kid(s). What ages have you cared for most?`,
      `Hi ${name}, do you prefer live-in or live-out, and when could you start?`,
      `Hi ${name}! School runs are important for us. Are you comfortable driving / public transport here?`,
      `Hello ${name} — we'd love to hear about a typical day when you cared for children.`,
    ];
  }

  return [
    `Hi ${name}! I'm an au pair interested in your family${place}.${lang} Open to a quick video hello?`,
    `Hello ${name}, I have ${ctx.experienceYears ?? "several"} year(s) of childcare experience. What are your kids' favourite activities?`,
    `Hi ${name} — when are you hoping someone can start, and is the role live-in?`,
    `Hi ${name}! Happy to share references and my first-aid / driving details. What matters most to you?`,
    `Hello ${name}, I'd love to learn more about your daily routine and expectations.`,
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
