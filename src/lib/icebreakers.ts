/**
 * Chat icebreakers & interview helpers — client-safe.
 */

export type IcebreakerContext = {
  myRole: "AUPAIR" | "PARENT" | string;
  theirName: string;
  /** Their listing city (host household / their base) */
  city?: string | null;
  /** Your profile city — used so sitters introduce themselves from their base */
  myCity?: string | null;
  sharedLanguages?: string[];
  childrenCount?: number | null;
  experienceYears?: number | null;
  /** Primary service focus e.g. TUTORING | PET_SITTING | HOUSE_SWAP */
  service?: string | null;
};

export function icebreakers(ctx: IcebreakerContext): string[] {
  const name = ctx.theirName?.split(" ")[0] || "there";
  const theirPlace = ctx.city?.trim();
  const myPlace = ctx.myCity?.trim();
  const place = theirPlace ? ` in ${theirPlace}` : "";
  const based = myPlace ? ` I'm based in ${myPlace}.` : "";
  const lang =
    ctx.sharedLanguages && ctx.sharedLanguages.length
      ? ` We both speak ${ctx.sharedLanguages[0]}.`
      : "";
  const svc = (ctx.service || "").toUpperCase();

  if (svc.includes("TUTOR")) {
    if (ctx.myRole === "PARENT") {
      return [
        `Hi ${name}! We're looking for a tutor${place}.${lang} Which subjects and levels do you teach?`,
        `Hello ${name} — do you offer in-person, online, or both? We need help after school.`,
        `Hi ${name}, what's your approach to homework support and exam prep?`,
        `Hi ${name}! Open to a short trial lesson this week?`,
      ];
    }
    return [
      `Hi ${name}!${based} I tutor and would love to help${place}.${lang} Which subjects matter most?`,
      `Hello ${name}, I can do homework support / exam prep.${based} What grade levels?`,
      `Hi ${name} — I offer in-person and online sessions. When works for you?${based}`,
    ];
  }

  if (svc.includes("PET") || svc.includes("DOG")) {
    if (ctx.myRole === "PARENT") {
      return [
        `Hi ${name}! We need a dog/pet sitter${place}. Comfortable with our pets' routine?`,
        `Hello ${name} — do you do overnight stays, drop-ins, or walks?`,
        `Hi ${name}, open to a meet-and-greet with our pets first?`,
      ];
    }
    return [
      `Hi ${name}!${based} I offer dog walking / pet sitting${place}. Happy to meet your pets first.`,
      `Hello ${name}, I can do overnight or drop-in care.${based} What do you need?`,
    ];
  }

  if (svc.includes("HOUSE_SWAP") || svc.includes("SWAP")) {
    return [
      `Hi ${name}! Interested in a house swap${place}. Do our dates overlap?`,
      `Hello ${name} — we're looking at ${myPlace || "your area"}. Open to a simultaneous exchange?`,
      `Hi ${name}, happy to share more about our home and preferred windows on AuPairly first.`,
    ];
  }

  if (svc.includes("HOUSE_SIT")) {
    if (ctx.myRole === "PARENT") {
      return [
        `Hi ${name}! We need a house sitter${place}. Available for our travel dates?`,
        `Hello ${name} — any experience with plants, alarms, or mail while hosts are away?`,
      ];
    }
    return [
      `Hi ${name}!${based} I house sit and can look after plants/property${place}. When are your dates?`,
    ];
  }

  if (ctx.myRole === "PARENT") {
    return [
      `Hi ${name}! We're looking for trusted help${place}.${lang} Open to a short intro call this week?`,
      `Hello ${name} — your profile stood out. We need support with ${ctx.childrenCount ? `${ctx.childrenCount} kid(s)` : "our household"}${place}. What experience fits best?`,
      `Hi ${name}, when could you start, and are you free evenings/weekends?`,
      `Hi ${name}! Do you drive / use public transport, and which services do you offer most?`,
      `Hello ${name} — we'd love a typical day example (childcare, tutoring, caregiving, house or pets).`,
      `Hi ${name}, we can chat on AuPairly first — then meet in a public place if it feels right.`,
    ];
  }

  return [
    `Hi ${name}!${based} I'm interested in helping your household${place}.${lang} Open to a quick video hello?`,
    `Hello ${name}, I have ${ctx.experienceYears ?? "several"} year(s) of care experience.${based} What matters most to you?`,
    `Hi ${name} — when are you hoping someone can start? Happy to share refs.${based}`,
    `Hi ${name}! I offer childcare / tutoring / caregiving / house & pet sitting — which do you need most?${based}`,
    `Hello ${name}, I'd love to learn your daily routine and expectations.${based}`,
    `Hi ${name} — we can stay on AuPairly until we both feel comfortable meeting publicly.${based}`,
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
    return "Phone numbers stay private until shortlisting. Keep early chats on AuPairly — meet in public once you’re both comfortable.";
  }
  return null;
}
