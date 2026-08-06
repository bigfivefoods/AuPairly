import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { SERVICE_LIST, serializeServices, type ServiceId } from "../src/lib/services";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seed");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function clearAll() {
  // Order respects FKs
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.report.deleteMany();
  await prisma.interest.deleteMany().catch(() => null);
  await prisma.notification.deleteMany().catch(() => null);
  await prisma.swipe.deleteMany().catch(() => null);
  await prisma.usageCounter.deleteMany().catch(() => null);
  await prisma.subscription.deleteMany().catch(() => null);
  await prisma.profileServiceTag.deleteMany().catch(() => null);
  await prisma.placementCheckIn.deleteMany().catch(() => null);
  await prisma.placement.deleteMany().catch(() => null);
  await prisma.applicationPacket.deleteMany().catch(() => null);
  await prisma.interviewProposal.deleteMany().catch(() => null);
  await prisma.shortlistItem.deleteMany().catch(() => null);
  await prisma.availabilitySlot.deleteMany().catch(() => null);
  await prisma.savedSearch.deleteMany().catch(() => null);
  await prisma.boostEvent.deleteMany().catch(() => null);
  await prisma.pushSubscription.deleteMany().catch(() => null);
  await prisma.secureDocument.deleteMany().catch(() => null);
  await prisma.referenceRequest.deleteMany().catch(() => null);
  await prisma.story.deleteMany().catch(() => null);
  await prisma.supportTicket.deleteMany().catch(() => null);
  await prisma.marketplaceProduct.deleteMany().catch(() => null);
  await prisma.auPairProfile.deleteMany();
  await prisma.familyProfile.deleteMany();
  await prisma.user.deleteMany();
}

async function seedServiceCatalog() {
  for (const [i, s] of SERVICE_LIST.entries()) {
    await prisma.serviceCategory.upsert({
      where: { id: s.id },
      create: {
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        slug: s.slug,
        description: s.description,
        examples: JSON.stringify(s.examples),
        sortOrder: i + 1,
        active: true,
      },
      update: {
        name: s.name,
        shortName: s.shortName,
        slug: s.slug,
        description: s.description,
        examples: JSON.stringify(s.examples),
        sortOrder: i + 1,
        active: true,
      },
    });
  }
}

async function tagProfile(
  profileRole: "AUPAIR" | "FAMILY",
  profileId: string,
  services: ServiceId[]
) {
  await prisma.profileServiceTag.deleteMany({
    where: { profileRole, profileId },
  });
  await prisma.profileServiceTag.createMany({
    data: services.map((serviceId) => ({
      profileRole,
      profileId,
      serviceId,
    })),
    skipDuplicates: true,
  });
}

async function main() {
  console.log("Seeding AuPairly multi-service marketplace on Supabase…");

  await clearAll();
  await seedServiceCatalog();

  const passwordHash = await bcrypt.hash("demo1234", 12);

  await prisma.user.create({
    data: {
      email: "admin@demo.aupairly.me",
      name: "AuPairly Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  // ── Hosts ──────────────────────────────────────────────────────
  const parentDemo = await prisma.user.create({
    data: {
      email: "parent@demo.aupairly.me",
      name: "Alex Rivera",
      passwordHash,
      role: "PARENT",
      familyProfile: {
        create: {
          familyName: "The Rivera Family",
          headline: "Brooklyn family seeking warm childcare + weekend pet help",
          bio: "Bilingual family with two kids and a friendly cat. Looking for childcare and occasional pet sitting.",
          city: "New York",
          region: "New York",
          country: "United States",
          continent: "NA",
          addressArea: "Park Slope, Brooklyn",
          childrenCount: 2,
          childrenAges: JSON.stringify(["3", "7"]),
          childrenDetails: "Maya (7) loves reading. Leo (3) is energetic.",
          languages: JSON.stringify(["English", "Spanish"]),
          preferences: "Patient with toddlers; open to Spanish practice.",
          duties: JSON.stringify(["Childcare", "School drop-off / pick-up", "Activities & outings"]),
          offers: JSON.stringify(["Private room", "Meals included", "Wi‑Fi", "Weekend free time"]),
          startDate: new Date("2026-09-01"),
          durationMonths: 12,
          weeklyHours: 35,
          pocketMoney: 250,
          liveIn: true,
          hasPets: true,
          petDetails: "Friendly cat (Mochi)",
          petTypes: JSON.stringify(["Cats"]),
          ownRoom: true,
          services: serializeServices(["CHILDCARE", "PET_SITTING"]),
          status: "ACTIVE",
          isVerified: true,
          rating: 5,
          reviewCount: 1,
        },
      },
      verifications: {
        create: [
          { type: "ID", status: "VERIFIED", reviewedAt: new Date() },
          { type: "SELFIE", status: "VERIFIED", reviewedAt: new Date() },
        ],
      },
    },
    include: { familyProfile: true },
  });
  if (parentDemo.familyProfile) {
    await tagProfile("FAMILY", parentDemo.familyProfile.id, ["CHILDCARE", "PET_SITTING"]);
  }

  const hostSpecs: {
    name: string;
    email: string;
    familyName: string;
    city: string;
    country: string;
    continent: string;
    region?: string;
    headline: string;
    services: ServiceId[];
    childrenCount: number;
    ages: string[];
    pocketMoney: number;
    hasPets?: boolean;
    petTypes?: string[];
    houseNotes?: string;
  }[] = [
    {
      name: "Jordan Chen",
      email: "jordan@demo.aupairly.me",
      familyName: "The Chen Family",
      city: "San Francisco",
      country: "United States",
      continent: "NA",
      region: "California",
      headline: "Seeking bilingual childcare for two boys",
      services: ["CHILDCARE"],
      childrenCount: 2,
      ages: ["4", "8"],
      pocketMoney: 280,
    },
    {
      name: "Nora Adeyemi",
      email: "nora@demo.aupairly.me",
      familyName: "Adeyemi Household",
      city: "Cape Town",
      country: "South Africa",
      continent: "AF",
      region: "Western Cape",
      headline: "Companionship & light caregiving for Mum (75)",
      services: ["CAREGIVING"],
      childrenCount: 0,
      ages: [],
      pocketMoney: 180,
    },
    {
      name: "Sam Patel",
      email: "sam@demo.aupairly.me",
      familyName: "The Patel Home",
      city: "London",
      country: "United Kingdom",
      continent: "EU",
      region: "England",
      headline: "Holiday house sitter needed for 3 weeks in August",
      services: ["HOUSE_SITTING"],
      childrenCount: 0,
      ages: [],
      pocketMoney: 0,
      houseNotes: "Plants, mail, alarm. No parties. Near tube.",
    },
    {
      name: "Morgan Blake",
      email: "morgan@demo.aupairly.me",
      familyName: "Blake Pets",
      city: "Berlin",
      country: "Germany",
      continent: "EU",
      region: "Berlin",
      headline: "Overnight dog sitter for two golden retrievers",
      services: ["PET_SITTING"],
      childrenCount: 0,
      ages: [],
      pocketMoney: 150,
      hasPets: true,
      petTypes: ["Dogs"],
    },
    {
      name: "Taylor Brooks",
      email: "taylor@demo.aupairly.me",
      familyName: "The Brooks Family",
      city: "Toronto",
      country: "Canada",
      continent: "NA",
      region: "Ontario",
      headline: "Childcare + house/pet cover while we travel",
      services: ["CHILDCARE", "HOUSE_SITTING", "PET_SITTING"],
      childrenCount: 3,
      ages: ["2", "5", "9"],
      pocketMoney: 260,
      hasPets: true,
      petTypes: ["Dogs", "Cats"],
      houseNotes: "Live-in preferred during our 2-week trip.",
    },
  ];

  for (const f of hostSpecs) {
    const u = await prisma.user.create({
      data: {
        email: f.email,
        name: f.name,
        passwordHash,
        role: "PARENT",
        familyProfile: {
          create: {
            familyName: f.familyName,
            headline: f.headline,
            bio: `Host in ${f.city}. Looking for verified help via AuPairly.`,
            city: f.city,
            region: f.region,
            country: f.country,
            continent: f.continent,
            childrenCount: f.childrenCount || 1,
            childrenAges: JSON.stringify(f.ages.length ? f.ages : ["0"]),
            languages: JSON.stringify(["English"]),
            preferences: "Reliable, warm, clear communication.",
            duties: JSON.stringify(
              f.services.includes("CHILDCARE")
                ? ["Childcare", "Activities & outings"]
                : f.services.includes("CAREGIVING")
                  ? ["Companionship", "Light personal support"]
                  : ["As agreed"]
            ),
            offers: JSON.stringify(["Wi‑Fi", "Meals included"]),
            startDate: new Date("2026-10-01"),
            durationMonths: 6,
            weeklyHours: 30,
            pocketMoney: f.pocketMoney || null,
            liveIn: f.services.includes("HOUSE_SITTING") || f.services.includes("CHILDCARE"),
            hasPets: Boolean(f.hasPets),
            petTypes: JSON.stringify(f.petTypes || []),
            houseSittingNotes: f.houseNotes || null,
            services: serializeServices(f.services),
            status: "ACTIVE",
            isVerified: true,
            rating: 4.8,
            reviewCount: 1,
          },
        },
      },
      include: { familyProfile: true },
    });
    if (u.familyProfile) await tagProfile("FAMILY", u.familyProfile.id, f.services);
  }

  // ── Sitters ────────────────────────────────────────────────────
  const aupairDemo = await prisma.user.create({
    data: {
      email: "aupair@demo.aupairly.me",
      name: "Sofia Mendes",
      passwordHash,
      role: "AUPAIR",
      aupairProfile: {
        create: {
          headline: "Au pair + pet-friendly sitter — outdoor adventures",
          bio: "Three years caring for kids 1–10 across Europe. Also happy with cats and short house sits.",
          nationality: "Portuguese",
          languages: JSON.stringify(["Portuguese", "English", "Spanish", "French"]),
          age: 24,
          gender: "Female",
          experienceYears: 3,
          childcareSkills: JSON.stringify([
            "Toddlers (1–3)",
            "Preschool (3–5)",
            "School-age (6–12)",
            "Homework help",
            "Arts & crafts",
          ]),
          education: "Early Childhood Education diploma",
          drivingLicense: true,
          firstAid: true,
          swimming: true,
          nonSmoker: true,
          preferredCountries: JSON.stringify(["United States", "United Kingdom", "Canada", "Germany"]),
          availableFrom: new Date("2026-08-15"),
          durationMonths: 12,
          weeklyHours: 30,
          pocketMoneyMin: 200,
          liveIn: true,
          city: "Lisbon",
          region: null,
          country: "Portugal",
          continent: "EU",
          services: serializeServices(["CHILDCARE", "PET_SITTING", "HOUSE_SITTING"]),
          petTypes: JSON.stringify(["Cats", "Dogs"]),
          houseSittingNotes: "Comfortable with plants, mail, and quiet stays.",
          status: "ACTIVE",
          isVerified: true,
          rating: 5,
          reviewCount: 1,
        },
      },
      verifications: {
        create: [
          { type: "ID", status: "VERIFIED", reviewedAt: new Date() },
          { type: "SELFIE", status: "VERIFIED", reviewedAt: new Date() },
          { type: "REFERENCES", status: "VERIFIED", reviewedAt: new Date() },
        ],
      },
    },
    include: { aupairProfile: true },
  });
  if (aupairDemo.aupairProfile) {
    await tagProfile("AUPAIR", aupairDemo.aupairProfile.id, [
      "CHILDCARE",
      "PET_SITTING",
      "HOUSE_SITTING",
    ]);
  }

  const sitterSpecs: {
    name: string;
    email: string;
    nationality: string;
    languages: string[];
    age: number;
    city: string;
    country: string;
    continent: string;
    region?: string;
    headline: string;
    experienceYears: number;
    services: ServiceId[];
    petTypes?: string[];
    houseNotes?: string;
    careFocus?: string[];
  }[] = [
    {
      name: "Emma Johansson",
      email: "emma@demo.aupairly.me",
      nationality: "Swedish",
      languages: ["Swedish", "English", "German"],
      age: 22,
      city: "Stockholm",
      country: "Sweden",
      continent: "EU",
      headline: "Calm childcare specialist with first-aid cert",
      experienceYears: 2,
      services: ["CHILDCARE"],
      careFocus: ["Babysitting", "After-school", "Overnight care"],
    },
    {
      name: "Grace Ndlovu",
      email: "grace@demo.aupairly.me",
      nationality: "South African",
      languages: ["English", "Zulu", "Afrikaans"],
      age: 34,
      city: "Johannesburg",
      country: "South Africa",
      continent: "AF",
      region: "Gauteng",
      headline: "Experienced caregiver — elderly care & companionship",
      experienceYears: 8,
      services: ["CAREGIVING"],
      careFocus: ["Elderly care", "Companionship", "Respite care"],
    },
    {
      name: "Daniel Okonkwo",
      email: "daniel@demo.aupairly.me",
      nationality: "Nigerian",
      languages: ["English", "Yoruba"],
      age: 29,
      city: "Cape Town",
      country: "South Africa",
      continent: "AF",
      region: "Western Cape",
      headline: "Reliable house sitter — short & long stays",
      experienceYears: 4,
      services: ["HOUSE_SITTING"],
      houseNotes: "Property checks, plants, mail. References available.",
    },
    {
      name: "Mia Torres",
      email: "mia@demo.aupairly.me",
      nationality: "Spanish",
      languages: ["Spanish", "English", "Catalan"],
      age: 27,
      city: "Barcelona",
      country: "Spain",
      continent: "EU",
      headline: "Dog walker & overnight pet sitter",
      experienceYears: 5,
      services: ["PET_SITTING"],
      petTypes: ["Dogs", "Cats"],
    },
    {
      name: "Lucia Bianchi",
      email: "lucia@demo.aupairly.me",
      nationality: "Italian",
      languages: ["Italian", "English", "French"],
      age: 26,
      city: "Milan",
      country: "Italy",
      continent: "EU",
      headline: "Childcare + caregiving — multi-generational homes",
      experienceYears: 4,
      services: ["CHILDCARE", "CAREGIVING"],
      careFocus: ["Special needs", "Companionship", "After-school"],
    },
    {
      name: "Chloe Dubois",
      email: "chloe@demo.aupairly.me",
      nationality: "French",
      languages: ["French", "English", "Spanish"],
      age: 25,
      city: "Lyon",
      country: "France",
      continent: "EU",
      headline: "House & pet sitter for travel seasons",
      experienceYears: 3,
      services: ["HOUSE_SITTING", "PET_SITTING"],
      petTypes: ["Dogs", "Cats", "Birds"],
      houseNotes: "Holiday sits, multi-week stays, plant care.",
    },
  ];

  for (const a of sitterSpecs) {
    const u = await prisma.user.create({
      data: {
        email: a.email,
        name: a.name,
        passwordHash,
        role: "AUPAIR",
        aupairProfile: {
          create: {
            headline: a.headline,
            bio: `Hi! I'm ${a.name.split(" ")[0]}, offering ${a.services.join(", ").toLowerCase()} with ${a.experienceYears} years of experience.`,
            nationality: a.nationality,
            languages: JSON.stringify(a.languages),
            age: a.age,
            gender: "Female",
            experienceYears: a.experienceYears,
            childcareSkills: JSON.stringify(
              a.services.includes("CHILDCARE")
                ? ["Toddlers (1–3)", "Preschool (3–5)", "School-age (6–12)"]
                : []
            ),
            education: "University / professional training",
            drivingLicense: true,
            firstAid: true,
            swimming: true,
            nonSmoker: true,
            preferredCountries: JSON.stringify(["United States", "United Kingdom", "South Africa", "Canada"]),
            availableFrom: new Date("2026-09-01"),
            durationMonths: 12,
            weeklyHours: 30,
            pocketMoneyMin: 180,
            liveIn: a.services.includes("HOUSE_SITTING") || a.services.includes("CHILDCARE"),
            city: a.city,
            region: a.region,
            country: a.country,
            continent: a.continent,
            services: serializeServices(a.services),
            petTypes: JSON.stringify(a.petTypes || []),
            houseSittingNotes: a.houseNotes || null,
            careFocus: JSON.stringify(a.careFocus || []),
            status: "ACTIVE",
            isVerified: true,
            rating: 4.7,
            reviewCount: 2,
          },
        },
      },
      include: { aupairProfile: true },
    });
    if (u.aupairProfile) await tagProfile("AUPAIR", u.aupairProfile.id, a.services);
  }

  const [userAId, userBId] =
    parentDemo.id < aupairDemo.id
      ? [parentDemo.id, aupairDemo.id]
      : [aupairDemo.id, parentDemo.id];

  const conv = await prisma.conversation.create({
    data: {
      userAId,
      userBId,
      messages: {
        create: [
          {
            senderId: parentDemo.id,
            body: "Hi Sofia! We loved your profile — childcare and pet care is perfect for us. Video chat this week?",
          },
          {
            senderId: aupairDemo.id,
            body: "Hi Alex! I'd love that 😊 Free Thursday or Friday afternoon.",
          },
        ],
      },
    },
  });

  await prisma.review.create({
    data: {
      authorId: parentDemo.id,
      targetId: aupairDemo.id,
      rating: 5,
      comment: "Wonderful with kids and respectful of our home & cat.",
    },
  });
  await prisma.review.create({
    data: {
      authorId: aupairDemo.id,
      targetId: parentDemo.id,
      rating: 5,
      comment: "Clear expectations and warm communication.",
    },
  });

  const catCount = await prisma.serviceCategory.count();
  const tagCount = await prisma.profileServiceTag.count();

  console.log("Seed complete.");
  console.log(`  ServiceCategory rows: ${catCount}`);
  console.log(`  ProfileServiceTag rows: ${tagCount}`);
  console.log("  Admin:   admin@demo.aupairly.me / demo1234");
  console.log("  Host:    parent@demo.aupairly.me / demo1234");
  console.log("  Sitter:  aupair@demo.aupairly.me / demo1234");
  console.log("  Also: grace@ (caregiving), daniel@ (house), mia@ (pets) — demo1234");
  console.log(`  Sample conversation: ${conv.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
