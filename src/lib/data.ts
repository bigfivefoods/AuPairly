export type AuPair = {
  id: string;
  name: string;
  age: number;
  nationality: string;
  languages: string[];
  experience: number; // years
  rating: number;
  reviewCount: number;
  availability: string;
  photo: string;
  bio: string;
  skills: string[];
  location: string;
};

export type Family = {
  id: string;
  name: string;
  location: string;
  children: number;
  childrenAges: string;
  languages: string[];
  photo: string;
  bio: string;
  needs: string[];
  rating: number;
  reviewCount: number;
};

export const auPairs: AuPair[] = [
  {
    id: "1",
    name: "Sofia Müller",
    age: 22,
    nationality: "German",
    languages: ["German", "English", "French"],
    experience: 3,
    rating: 4.9,
    reviewCount: 18,
    availability: "Available from Sep 2026",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    bio: "I am a passionate, energetic au pair from Munich with 3 years of experience caring for children aged 0–10. I love outdoor activities, arts & crafts, and helping kids learn languages.",
    skills: ["Infant care", "Cooking", "Arts & crafts", "Swimming", "First aid"],
    location: "Munich, Germany",
  },
  {
    id: "2",
    name: "Emma Johansson",
    age: 24,
    nationality: "Swedish",
    languages: ["Swedish", "English", "Spanish"],
    experience: 4,
    rating: 5.0,
    reviewCount: 22,
    availability: "Available from Aug 2026",
    photo: "https://randomuser.me/api/portraits/women/68.jpg",
    bio: "Experienced au pair from Stockholm with a background in early childhood education. I bring warmth, structure, and tons of creativity to every household I join.",
    skills: ["Early education", "Homework help", "Cooking", "Music", "CPR certified"],
    location: "Stockholm, Sweden",
  },
  {
    id: "3",
    name: "Camille Dupont",
    age: 21,
    nationality: "French",
    languages: ["French", "English"],
    experience: 2,
    rating: 4.7,
    reviewCount: 11,
    availability: "Available from Oct 2026",
    photo: "https://randomuser.me/api/portraits/women/21.jpg",
    bio: "Bonjour! I'm Camille from Lyon. I have two younger siblings so I've been caring for children my whole life. I'm patient, fun, and eager to become part of a wonderful family.",
    skills: ["Language tutoring", "Cooking", "Sports", "Arts & crafts"],
    location: "Lyon, France",
  },
  {
    id: "4",
    name: "Lena Hofer",
    age: 23,
    nationality: "Austrian",
    languages: ["German", "English", "Italian"],
    experience: 3,
    rating: 4.8,
    reviewCount: 15,
    availability: "Available now",
    photo: "https://randomuser.me/api/portraits/women/55.jpg",
    bio: "I grew up in Vienna and have always loved working with children. My experience ranges from newborns to teenagers. I also teach piano and can help with school assignments.",
    skills: ["Piano", "Infant care", "Homework help", "Cooking", "Swimming"],
    location: "Vienna, Austria",
  },
  {
    id: "5",
    name: "Mia Andersen",
    age: 20,
    nationality: "Danish",
    languages: ["Danish", "English", "German"],
    experience: 1,
    rating: 4.6,
    reviewCount: 7,
    availability: "Available from Jan 2027",
    photo: "https://randomuser.me/api/portraits/women/32.jpg",
    bio: "Hi! I'm Mia from Copenhagen. Even though I'm newer to au pairing, I have extensive experience babysitting and volunteering at a local kindergarten for two years.",
    skills: ["Childcare", "Cooking", "Art", "Outdoor activities"],
    location: "Copenhagen, Denmark",
  },
  {
    id: "6",
    name: "Isabella Rossi",
    age: 25,
    nationality: "Italian",
    languages: ["Italian", "English", "Spanish"],
    experience: 5,
    rating: 4.9,
    reviewCount: 29,
    availability: "Available from Sep 2026",
    photo: "https://randomuser.me/api/portraits/women/78.jpg",
    bio: "With 5 years of au pair experience across three countries, I bring a wealth of cultural understanding and childcare expertise. I hold a childcare certificate and am CPR trained.",
    skills: ["CPR certified", "Special needs care", "Cooking", "Languages", "First aid"],
    location: "Rome, Italy",
  },
];

export const families: Family[] = [
  {
    id: "1",
    name: "The Henderson Family",
    location: "New York, USA",
    children: 2,
    childrenAges: "3 and 6 years",
    languages: ["English"],
    photo: "https://randomuser.me/api/portraits/women/42.jpg",
    bio: "We are a warm, active family of 4 looking for a caring au pair to help with our two girls. We live in Manhattan and love exploring the city, art museums, and weekend hikes.",
    needs: ["School pickup", "Homework help", "Light cooking", "Weekend outings"],
    rating: 4.8,
    reviewCount: 6,
  },
  {
    id: "2",
    name: "The Schmidt Family",
    location: "Berlin, Germany",
    children: 1,
    childrenAges: "18 months",
    languages: ["German", "English"],
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    bio: "We are a bilingual couple seeking an au pair to care for our toddler son. We value patience, creativity, and a love of learning in our home.",
    needs: ["Infant care", "Playdates", "Light housework", "Bilingual support"],
    rating: 4.9,
    reviewCount: 4,
  },
  {
    id: "3",
    name: "The Nakamura Family",
    location: "Tokyo, Japan",
    children: 3,
    childrenAges: "4, 7, and 10 years",
    languages: ["Japanese", "English"],
    photo: "https://randomuser.me/api/portraits/women/57.jpg",
    bio: "We have a vibrant household with three energetic kids! We are looking for a responsible, enthusiastic au pair who can help with afternoon activities and English language practice.",
    needs: ["English tutoring", "After-school activities", "Cooking", "Sports"],
    rating: 4.7,
    reviewCount: 8,
  },
];
