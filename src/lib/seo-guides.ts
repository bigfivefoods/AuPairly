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
  {
    slug: "house-swap-south-africa",
    title: "House swap in South Africa — how mutual home exchange works",
    description:
      "How house swapping differs from house sitting, how to list dates and destinations, and how to swap safely on AuPairly with verified host families.",
    keywords: [
      "house swap South Africa",
      "home exchange Cape Town",
      "holiday house swap",
      "mutual home exchange",
    ],
    minutes: 7,
    sections: [
      {
        h2: "House swap vs house sitting",
        body: [
          "House sitting is one-way: a sitter looks after your home while you are away. House swap is mutual: you stay in their home while they stay in yours (often at the same time).",
          "On AuPairly, enable House swap on your host listing, set available dates, and list destinations you want to visit. Exact addresses stay private until shortlist.",
        ],
      },
      {
        h2: "What to put on your listing",
        body: [
          "Describe beds, guests, parking, pets, and neighbourhood vibe — not your street address. Add photos of living areas and outdoor space.",
          "Be clear on simultaneous vs flexible dates. Strong photos and honest house summaries get more interest.",
        ],
      },
      {
        h2: "Stay safe",
        body: [
          "Use verified profiles, chat on AuPairly first, and only share keys after shortlist and mutual comfort. Meet virtually before exchange when possible.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is house swap free on AuPairly?",
        answer:
          "Joining and listing is free. Messaging limits follow your membership plan. There is no separate house-swap fee from AuPairly.",
      },
      {
        question: "Can I swap with someone outside South Africa?",
        answer:
          "Yes if both households list on AuPairly and agree terms. Start with same-country swaps while you learn the process.",
      },
    ],
  },
  {
    slug: "find-tutor-south-africa",
    title: "How to find a tutor in South Africa (2026)",
    description:
      "Hire a maths, language, or homework tutor at home or online. What to check, rates signals, and how AuPairly tutoring listings work for host families.",
    keywords: [
      "find tutor South Africa",
      "maths tutor Cape Town",
      "homework help Johannesburg",
      "private tutor near me",
    ],
    minutes: 6,
    sections: [
      {
        h2: "Define the subject and level",
        body: [
          "Be specific: Foundation Phase reading, Grade 9 maths, matric science, or conversational English. Clear briefs attract the right tutors.",
          "Say whether you need in-person, online, or hybrid — and which evenings work.",
        ],
      },
      {
        h2: "Check qualifications and fit",
        body: [
          "Look for study status, qualifications, and a 1-minute intro video. On AuPairly, tutors list under Tutoring alongside childcare if they also babysit.",
          "Ask for a short trial lesson before a long commitment.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can one person offer tutoring and childcare?",
        answer:
          "Yes. Sitters can enable multiple services on one profile — e.g. childcare + tutoring after school.",
      },
    ],
  },
  {
    slug: "dog-sitter-near-me",
    title: "Dog sitter near me — how to book trusted pet care",
    description:
      "Find a dog sitter or walker nearby: what to ask, overnight vs drop-in visits, and how verified pet sitters work on AuPairly.",
    keywords: [
      "dog sitter near me",
      "dog walker Cape Town",
      "pet sitter Johannesburg",
      "overnight dog care",
    ],
    minutes: 5,
    sections: [
      {
        h2: "Describe your pets clearly",
        body: [
          "Breed, age, energy level, medication, and whether they are crate-trained. Hosts who list pet types get better matches.",
          "Share a typical day: walk times, feeding, and any neighbours who help.",
        ],
      },
      {
        h2: "Meet before you hand over keys",
        body: [
          "Do a short meet-and-greet. Keep early chat on AuPairly and shortlist before sharing your address or WhatsApp.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is dog sitting the same as house sitting?",
        answer:
          "Often they combine, but not always. On AuPairly you can request pet sitting only, house sitting only, or both.",
      },
    ],
  },
  {
    slug: "live-in-vs-live-out-au-pair",
    title: "Live-in vs live-out au pair — which fits your family?",
    description:
      "Compare live-in and live-out childcare: hours, pocket money, privacy, and how to list the right arrangement on AuPairly.",
    keywords: [
      "live-in au pair",
      "live-out childcare",
      "au pair room",
      "nanny live in South Africa",
    ],
    minutes: 5,
    sections: [
      {
        h2: "Live-in",
        body: [
          "Usually includes a private room, meals, and cultural exchange. Best when you need early mornings, evenings, or flexible coverage.",
          "Be explicit about days off, overnight duties, and guests.",
        ],
      },
      {
        h2: "Live-out",
        body: [
          "Sitter travels to you for set shifts — after school, school holidays, or full-time days. Often clearer employment-style hours.",
          "Factor transport time and traffic in Cape Town or Joburg.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I change from live-in to live-out later?",
        answer:
          "Yes if both parties agree. Update your AuPairly listing so new applicants see the current arrangement.",
      },
    ],
  },
  {
    slug: "video-intro-au-pair-tips",
    title: "How to film a 1-minute au pair / sitter intro video",
    description:
      "Script and tips for a clear, friendly intro video that unlocks job applications on AuPairly — what hosts want to hear in 60–90 seconds.",
    keywords: [
      "au pair intro video",
      "sitter video introduction",
      "how to introduce yourself to host family",
    ],
    minutes: 4,
    sections: [
      {
        h2: "What to say",
        body: [
          "Name, city, years of experience, services (childcare, tutoring, pets), and what you’re looking for. Smile and speak clearly.",
          "Mention first aid, driving, or languages if relevant. End with when you can start.",
        ],
      },
      {
        h2: "How to record on AuPairly",
        body: [
          "Open Trust → record in the browser or upload MP4/WebM. Confirm the video is at least one minute so you can send application packets.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need professional equipment?",
        answer:
          "No. Natural light, a quiet room, and a phone at eye level is enough. Hosts care more about warmth and clarity than production quality.",
      },
    ],
  },
  {
    slug: "placement-pipeline-host-guide",
    title: "Host guide: from interest to placed (AuPairly pipeline)",
    description:
      "How hosts move candidates through Interested → Interview → Trial → Placed on AuPairly — shortlist, contact privacy, and check-ins.",
    keywords: [
      "hire au pair process",
      "au pair trial week",
      "shortlist candidates childcare",
    ],
    minutes: 6,
    sections: [
      {
        h2: "Shortlist before sharing numbers",
        body: [
          "Phone numbers stay private until shortlist (or later stages). Chat on AuPairly, then shortlist when you’re serious.",
        ],
      },
      {
        h2: "Use the placement board",
        body: [
          "Start a placement from a profile. Drag cards across Interested, Interview, Trial, and Placed. Day-7 and day-30 check-ins help both sides stay supported.",
        ],
      },
    ],
    faqs: [
      {
        question: "When do reviews go public?",
        answer:
          "Star ratings and written reviews are moderated by AuPairly before they appear on profiles.",
      },
    ],
  },
];

export function guideBySlug(slug: string) {
  return SEO_GUIDES.find((g) => g.slug === slug) || null;
}
