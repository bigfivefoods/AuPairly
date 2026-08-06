import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for seed");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding AuPairly (Postgres)…");

  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.review.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.report.deleteMany();
  await prisma.auPairProfile.deleteMany();
  await prisma.familyProfile.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash("demo1234", 12);

  await prisma.user.create({
    data: {
      email: "admin@demo.aupairly.me",
      name: "AuPairly Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  const parentDemo = await prisma.user.create({
    data: {
      email: "parent@demo.aupairly.me",
      name: "Alex Rivera",
      passwordHash,
      role: "PARENT",
      familyProfile: {
        create: {
          familyName: "The Rivera Family",
          headline: "Brooklyn family seeking a warm, creative au pair",
          bio: "We're a bilingual family in Park Slope with two curious kids who love parks, cooking, and weekend museums. Looking for someone who wants to be part of family life — not just a job.",
          city: "New York",
          country: "United States",
          addressArea: "Park Slope, Brooklyn",
          childrenCount: 2,
          childrenAges: JSON.stringify(["3", "7"]),
          childrenDetails: "Maya (7) loves reading and soccer. Leo (3) is energetic and into dinosaurs.",
          languages: JSON.stringify(["English", "Spanish"]),
          preferences:
            "Someone patient with toddlers, comfortable with school pickups, and open to practicing Spanish with the kids.",
          duties: JSON.stringify([
            "Childcare",
            "School drop-off / pick-up",
            "Homework supervision",
            "Activities & outings",
            "Meal preparation",
          ]),
          offers: JSON.stringify([
            "Private room",
            "Private bathroom",
            "Meals included",
            "Wi‑Fi",
            "Language practice",
            "Weekend free time",
          ]),
          startDate: new Date("2026-09-01"),
          durationMonths: 12,
          weeklyHours: 35,
          pocketMoney: 250,
          liveIn: true,
          hasPets: true,
          petDetails: "Friendly cat (Mochi)",
          ownRoom: true,
          carProvided: false,
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
  });

  const aupairDemo = await prisma.user.create({
    data: {
      email: "aupair@demo.aupairly.me",
      name: "Sofia Mendes",
      passwordHash,
      role: "AUPAIR",
      aupairProfile: {
        create: {
          headline: "Experienced Portuguese au pair who loves outdoor adventures",
          bio: "I've spent three years caring for children ages 1–10 across Europe. I bring energy, structure, and lots of crafts and park days. Looking for a family that values kindness and open communication.",
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
            "Activities & sports",
            "Meal prep",
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
          country: "Portugal",
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
  });

  const aupairs = [
    {
      name: "Emma Johansson",
      email: "emma@demo.aupairly.me",
      nationality: "Swedish",
      languages: ["Swedish", "English", "German"],
      age: 22,
      city: "Stockholm",
      country: "Sweden",
      headline: "Calm, nature-loving au pair with first-aid cert",
      experienceYears: 2,
      pocketMoneyMin: 220,
      skills: ["Infants (0–1)", "Toddlers (1–3)", "Preschool (3–5)"],
    },
    {
      name: "Lucia Bianchi",
      email: "lucia@demo.aupairly.me",
      nationality: "Italian",
      languages: ["Italian", "English", "French"],
      age: 26,
      city: "Milan",
      country: "Italy",
      headline: "Creative caregiver who turns everyday into adventure",
      experienceYears: 4,
      pocketMoneyMin: 240,
      skills: ["School-age (6–12)", "Arts & crafts", "Music", "Homework help"],
    },
    {
      name: "Yuki Tanaka",
      email: "yuki@demo.aupairly.me",
      nationality: "Japanese",
      languages: ["Japanese", "English"],
      age: 23,
      city: "Tokyo",
      country: "Japan",
      headline: "Patient bilingual au pair, great with shy kids",
      experienceYears: 2,
      pocketMoneyMin: 210,
      skills: ["Preschool (3–5)", "School-age (6–12)", "Homework help", "Meal prep"],
    },
    {
      name: "Chloe Dubois",
      email: "chloe@demo.aupairly.me",
      nationality: "French",
      languages: ["French", "English", "Spanish"],
      age: 25,
      city: "Lyon",
      country: "France",
      headline: "Sporty, organized au pair ready for a US adventure",
      experienceYears: 3,
      pocketMoneyMin: 230,
      skills: ["Toddlers (1–3)", "Activities & sports", "Multiple children"],
    },
  ];

  for (const a of aupairs) {
    await prisma.user.create({
      data: {
        email: a.email,
        name: a.name,
        passwordHash,
        role: "AUPAIR",
        aupairProfile: {
          create: {
            headline: a.headline,
            bio: `Hi! I'm ${a.name.split(" ")[0]}, a ${a.nationality} au pair with ${a.experienceYears} years of experience.`,
            nationality: a.nationality,
            languages: JSON.stringify(a.languages),
            age: a.age,
            gender: "Female",
            experienceYears: a.experienceYears,
            childcareSkills: JSON.stringify(a.skills),
            education: "University student / graduate",
            drivingLicense: true,
            firstAid: true,
            swimming: true,
            nonSmoker: true,
            preferredCountries: JSON.stringify(["United States", "United Kingdom", "Canada", "Australia"]),
            availableFrom: new Date("2026-09-01"),
            durationMonths: 12,
            weeklyHours: 30,
            pocketMoneyMin: a.pocketMoneyMin,
            liveIn: true,
            city: a.city,
            country: a.country,
            status: "ACTIVE",
            isVerified: true,
            rating: 4.7,
            reviewCount: 2,
          },
        },
      },
    });
  }

  const families = [
    {
      name: "Jordan Chen",
      email: "jordan@demo.aupairly.me",
      familyName: "The Chen Family",
      city: "San Francisco",
      country: "United States",
      addressArea: "Noe Valley",
      headline: "Tech family seeking bilingual au pair for two boys",
      childrenCount: 2,
      ages: ["4", "8"],
      pocketMoney: 280,
    },
    {
      name: "Sam Patel",
      email: "sam@demo.aupairly.me",
      familyName: "The Patel Family",
      city: "London",
      country: "United Kingdom",
      addressArea: "Clapham",
      headline: "Welcoming London home looking for a long-term au pair",
      childrenCount: 1,
      ages: ["5"],
      pocketMoney: 220,
    },
    {
      name: "Morgan Blake",
      email: "morgan@demo.aupairly.me",
      familyName: "The Blake Family",
      city: "Berlin",
      country: "Germany",
      addressArea: "Prenzlauer Berg",
      headline: "Creative family of three needs help with preschooler",
      childrenCount: 1,
      ages: ["3"],
      pocketMoney: 200,
    },
    {
      name: "Taylor Brooks",
      email: "taylor@demo.aupairly.me",
      familyName: "The Brooks Family",
      city: "Toronto",
      country: "Canada",
      addressArea: "Leslieville",
      headline: "Outdoor-loving family seeking energetic live-in help",
      childrenCount: 3,
      ages: ["2", "5", "9"],
      pocketMoney: 260,
    },
  ];

  for (const f of families) {
    await prisma.user.create({
      data: {
        email: f.email,
        name: f.name,
        passwordHash,
        role: "PARENT",
        familyProfile: {
          create: {
            familyName: f.familyName,
            headline: f.headline,
            bio: `We're the ${f.familyName.replace("The ", "")} in ${f.city}. We value kindness, curiosity, and balanced screen time.`,
            city: f.city,
            country: f.country,
            addressArea: f.addressArea,
            childrenCount: f.childrenCount,
            childrenAges: JSON.stringify(f.ages),
            childrenDetails: "Happy, active kids who love parks and bedtime stories.",
            languages: JSON.stringify(["English"]),
            preferences: "Reliable, warm, and communicative.",
            duties: JSON.stringify([
              "Childcare",
              "School drop-off / pick-up",
              "Activities & outings",
              "Light housework",
            ]),
            offers: JSON.stringify([
              "Private room",
              "Meals included",
              "Wi‑Fi",
              "Weekend free time",
              "Vacation days",
            ]),
            startDate: new Date("2026-10-01"),
            durationMonths: 12,
            weeklyHours: 35,
            pocketMoney: f.pocketMoney,
            liveIn: true,
            hasPets: false,
            ownRoom: true,
            carProvided: false,
            status: "ACTIVE",
            isVerified: true,
            rating: 4.8,
            reviewCount: 1,
          },
        },
      },
    });
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
            body: "Hi Sofia! We loved your profile — especially your experience with toddlers. Would you be open to a video chat this week?",
          },
          {
            senderId: aupairDemo.id,
            body: "Hi Alex! Thank you so much 😊 I'd love that. I'm free Thursday or Friday afternoon (your time).",
          },
          {
            senderId: parentDemo.id,
            body: "Perfect — let's do Thursday at 5pm ET. Looking forward to meeting you!",
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
      comment:
        "Sofia was thoughtful, punctual, and wonderful with our kids during trial chats. Highly recommend!",
    },
  });
  await prisma.review.create({
    data: {
      authorId: aupairDemo.id,
      targetId: parentDemo.id,
      rating: 5,
      comment: "The Rivera family is warm and clear about expectations. Great communication.",
    },
  });

  console.log("Seed complete.");
  console.log("  Admin:   admin@demo.aupairly.me / demo1234");
  console.log("  Parent:  parent@demo.aupairly.me / demo1234");
  console.log("  Au pair: aupair@demo.aupairly.me / demo1234");
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
