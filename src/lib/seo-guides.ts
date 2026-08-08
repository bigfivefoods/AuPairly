/**
 * Indexable guide articles for organic growth (long-tail SEO).
 */

export type SeoGuide = {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  /** Approximate reading minutes */
  minutes: number;
  sections: Array<{ h2: string; body: string[] }>;
  faqs: Array<{ question: string; answer: string }>;
};

export const SEO_GUIDES: SeoGuide[] = [
  {
    slug: "find-au-pair-south-africa",
    title: "How to find an au pair in South Africa (2026)",
    description:
      "Step-by-step guide for South African families: where to look, what to ask, verification, pocket money, and how AuPairly helps you hire safely.",
    keywords: [
      "find au pair South Africa",
      "hire au pair Cape Town",
      "au pair Johannesburg",
      "live-in childcare SA",
    ],
    minutes: 8,
    sections: [
      {
        h2: "Start with a clear brief",
        body: [
          "Write down children’s ages, school runs, languages, live-in vs live-out, and weekly hours. Families who publish a complete listing on AuPairly get more quality interest from sitters.",
          "Include neighbourhood (not full address), start date, and what “success” looks like in the first month.",
        ],
      },
      {
        h2: "Use verification and in-app chat",
        body: [
          "Prefer profiles with a clear photo, city, bio, and Verified badge. On AuPairly, South African members can use VerifyNow (Home Affairs) and international members can use document + liveness checks.",
          "Keep early conversations on-platform. Share phone numbers only after you’re comfortable, and meet first in a public place.",
        ],
      },
      {
        h2: "Discuss pocket money and expectations early",
        body: [
          "Agree weekly pocket money, days off, car use, and household duties in writing. Transparent listings reduce mismatched applications.",
          "When you’re ready to hire seriously, Plus plans unlock unlimited messages so you can compare candidates without daily free limits.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is AuPairly free to join?",
        answer:
          "Yes. Creating a profile and browsing is free. Paid Plus plans unlock unlimited messaging and Discover when you need more volume.",
      },
      {
        question: "Can I hire for babysitting only (not live-in)?",
        answer:
          "Yes. AuPairly covers au pairs, babysitting, after-school care, caregiving, house sitting, and pet sitting — not only live-in au pairs.",
      },
    ],
  },
  {
    slug: "babysitter-vs-au-pair-vs-nanny",
    title: "Babysitter vs au pair vs nanny — which do you need?",
    description:
      "Clear differences between babysitters, au pairs, and nannies — hours, live-in, cost signals, and how to list the right role on AuPairly.",
    keywords: [
      "babysitter vs nanny",
      "au pair vs babysitter",
      "hire nanny South Africa",
    ],
    minutes: 6,
    sections: [
      {
        h2: "Babysitter",
        body: [
          "Short shifts, evenings, or weekends. Usually hourly and live-out. Ideal when you need flexible childcare without a full-time arrangement.",
        ],
      },
      {
        h2: "Au pair",
        body: [
          "Cultural exchange + childcare. Often live-in with pocket money, set hours, and family life included. Strong fit for hosts who want language, energy, and longer stays.",
        ],
      },
      {
        h2: "Nanny",
        body: [
          "Professional childcare as primary work — often full-time, may be live-out, with clearer employment expectations. List duties and schedule clearly so candidates self-select.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can one AuPairly listing cover multiple care types?",
        answer:
          "Yes. Sitters and hosts can select childcare, caregiving, house sitting, and pet sitting on one account.",
      },
    ],
  },
  {
    slug: "elderly-caregiver-at-home",
    title: "How to find a trusted elderly caregiver at home",
    description:
      "How hosts find companionship and elderly care support, what to verify, and safety tips for in-home caregiving via AuPairly.",
    keywords: [
      "elderly caregiver near me",
      "home caregiver South Africa",
      "companionship care",
    ],
    minutes: 7,
    sections: [
      {
        h2: "Describe care needs clearly",
        body: [
          "Mobility, medication reminders (non-medical), companionship hours, overnight needs, and languages. Transparent listings attract the right caregivers.",
        ],
      },
      {
        h2: "Trust and safety",
        body: [
          "Use verified profiles, references, and public first meetings when possible. Never move large payments off-platform without a clear agreement.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is AuPairly a medical staffing agency?",
        answer:
          "No. AuPairly is a marketplace for care connections. Clinical nursing and regulated medical care require licensed providers outside the platform.",
      },
    ],
  },
  {
    slug: "house-sitter-checklist",
    title: "House sitter checklist for hosts (and sitters)",
    description:
      "What to cover before a house sit: keys, alarms, plants, pets, emergency contacts, and how to find house sitters on AuPairly.",
    keywords: [
      "house sitter",
      "house sitting tips",
      "find house sitter South Africa",
    ],
    minutes: 5,
    sections: [
      {
        h2: "Before you leave",
        body: [
          "Wifi, bin days, alarm codes, neighbour contacts, plant schedule, and what is off-limits. Share a written list in-app before handover.",
        ],
      },
      {
        h2: "Finding sitters",
        body: [
          "Publish a house-sitting need on AuPairly with city and dates. Review gallery photos, references, and verification badges before confirming.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can house sitting include pets?",
        answer:
          "Yes — many hosts combine house sitting with pet sitting. Select both services so the right sitters see your listing.",
      },
    ],
  },
  {
    slug: "pet-sitter-near-me",
    title: "How to find a pet sitter near you",
    description:
      "Dog walking, cat sitting, and overnight pet care — what to ask, how to list, and how AuPairly connects hosts with verified pet sitters.",
    keywords: [
      "pet sitter near me",
      "dog sitter",
      "cat sitter South Africa",
    ],
    minutes: 5,
    sections: [
      {
        h2: "List pet details",
        body: [
          "Species, age, temperament, medication, walk length, and yard access. Clear listings get better applications.",
        ],
      },
      {
        h2: "Meet & greet",
        body: [
          "Schedule a short meet with your pet before travel. Keep chat on AuPairly until you trust the arrangement.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do pet sitters need a full profile?",
        answer:
          "Strong profiles with photo, city, bio, and services convert better. Completing ~70% unlocks Discover on AuPairly.",
      },
    ],
  },
  {
    slug: "cape-town-au-pair-guide",
    title: "Cape Town au pair & childcare guide",
    description:
      "Neighbourhoods, transport, languages, and how families and sitters match for childcare in Cape Town on AuPairly.",
    keywords: [
      "au pair Cape Town",
      "babysitter Cape Town",
      "childcare Cape Town",
    ],
    minutes: 7,
    sections: [
      {
        h2: "Popular host areas",
        body: [
          "Southern Suburbs, Atlantic Seaboard, Northern Suburbs, and Stellenbosch corridor all see childcare demand. Always list a public suburb, never a full street address on your public profile.",
        ],
      },
      {
        h2: "Matching tips",
        body: [
          "Mention school runs, languages (English / Afrikaans / other), and whether a car is provided. Browse sitters filtered by Cape Town on AuPairly.",
        ],
      },
    ],
    faqs: [
      {
        question: "Where do I start in Cape Town?",
        answer:
          "Create a free host or sitter profile, set city to Cape Town, publish, and message verified matches. See /cities/cape-town for local listings.",
      },
    ],
  },
  {
    slug: "johannesburg-childcare",
    title: "Johannesburg & Sandton childcare guide",
    description:
      "Finding babysitters, nannies, and au pairs in Johannesburg and Sandton — safety, schools, and AuPairly listings.",
    keywords: [
      "babysitter Johannesburg",
      "nanny Sandton",
      "au pair Joburg",
    ],
    minutes: 6,
    sections: [
      {
        h2: "Safety-first hiring",
        body: [
          "Use verified profiles, references, and public first meetings. Joburg hosts often need reliable school-run support and aftercare coverage.",
        ],
      },
      {
        h2: "Where to list",
        body: [
          "Publish on AuPairly with Johannesburg or Sandton as your city so local sitters can find you. Completing your profile increases Discover ranking.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is Sandton listed separately?",
        answer:
          "Yes — AuPairly has city pages for Johannesburg and Sandton so hosts and sitters can target the right area.",
      },
    ],
  },
  {
    slug: "pocket-money-au-pair-south-africa",
    title: "Au pair pocket money in South Africa — what to expect",
    description:
      "How hosts and sitters discuss weekly pocket money, board, and duties in South Africa. Not legal advice — conversation starters for AuPairly matches.",
    keywords: [
      "au pair pocket money South Africa",
      "au pair salary ZA",
      "live-in childcare cost",
    ],
    minutes: 6,
    sections: [
      {
        h2: "Talk numbers early",
        body: [
          "List a weekly range on your profile. Clarify what is included (room, meals, data, transport). Written agreements prevent conflict.",
        ],
      },
      {
        h2: "Beyond pocket money",
        body: [
          "Hours, days off, overtime, and duties should be explicit. AuPairly is a marketplace — final employment terms are between host and sitter.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does AuPairly set pocket money rates?",
        answer:
          "No. Rates are agreed between hosts and sitters. Transparent listings help both sides filter faster.",
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return SEO_GUIDES.find((g) => g.slug === slug) || null;
}
