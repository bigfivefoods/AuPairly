/**
 * Structured offer letter + trial feedback — client-safe pure helpers.
 */

export type OfferLetter = {
  startDate?: string;
  endDate?: string;
  weeklyHours?: string;
  pocketMoneyZar?: string;
  liveIn?: boolean;
  ownRoom?: boolean;
  duties?: string;
  schoolRuns?: string;
  leaveDays?: string;
  noticeWeeks?: string;
  extra?: string;
};

export function emptyOffer(): OfferLetter {
  return {
    startDate: "",
    endDate: "",
    weeklyHours: "30",
    pocketMoneyZar: "",
    liveIn: true,
    ownRoom: true,
    duties: "Childcare, light help with kids' meals, school runs as agreed",
    schoolRuns: "",
    leaveDays: "As agreed",
    noticeWeeks: "2",
    extra: "",
  };
}

export function formatOfferLetter(
  offer: OfferLetter,
  names: { parentName: string; aupairName: string; city?: string }
): string {
  return `AUPAIRLY OFFER LETTER

Host family: ${names.parentName}
Au pair: ${names.aupairName}
Location: ${names.city || "[city]"}

Start date: ${offer.startDate || "[date]"}
End / review date: ${offer.endDate || "[optional]"}
Weekly hours: ${offer.weeklyHours || "[hours]"}
Pocket money: R${offer.pocketMoneyZar || "[amount]"} per week
Arrangement: ${offer.liveIn ? "Live-in" : "Live-out"}${offer.ownRoom ? " · private room" : ""}
School runs: ${offer.schoolRuns || "As discussed"}
Duties: ${offer.duties || "As discussed"}
Leave: ${offer.leaveDays || "As agreed"}
Notice: ${offer.noticeWeeks || "2"} weeks written notice

${offer.extra ? `Additional terms:\n${offer.extra}\n` : ""}
This is a template for discussion — not legal advice. Adapt for South African labour, immigration, and tax rules. Both parties should review independently before accepting.

Generated via AuPairly placement tools.
`;
}

export type TrialFeedback = {
  wouldHire: boolean | null;
  rating: number | null;
  strengths: string;
  concerns: string;
  notes: string;
};
