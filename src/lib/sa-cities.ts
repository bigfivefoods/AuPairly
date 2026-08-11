/** Popular SA cities for SEO landing pages & filters */

export type SaCity = {
  slug: string;
  name: string;
  province: string;
  /** Optional SEO blurb for city landing pages */
  blurb?: string;
};

export const SA_CITIES: SaCity[] = [
  {
    slug: "cape-town",
    name: "Cape Town",
    province: "Western Cape",
    blurb:
      "Atlantic seaboard, Southern Suburbs, and Northern Suburbs hosts looking for au pairs, babysitters, and pet sitters.",
  },
  {
    slug: "johannesburg",
    name: "Johannesburg",
    province: "Gauteng",
    blurb:
      "Joburg families hire childcare and caregivers across Sandton, Rosebank, Midrand, and the northern suburbs.",
  },
  {
    slug: "pretoria",
    name: "Pretoria",
    province: "Gauteng",
    blurb:
      "Tshwane hosts and sitters for school runs, live-in au pairs, and elderly care.",
  },
  {
    slug: "durban",
    name: "Durban",
    province: "KwaZulu-Natal",
    blurb:
      "Coastal climate, bilingual homes, and year-round demand for childcare and house sitting.",
  },
  {
    slug: "stellenbosch",
    name: "Stellenbosch",
    province: "Western Cape",
    blurb: "Wine-country families and students seeking flexible childcare and pet care.",
  },
  {
    slug: "sandton",
    name: "Sandton",
    province: "Gauteng",
    blurb: "High demand for verified nannies, after-school care, and live-in au pairs.",
  },
  {
    slug: "centurion",
    name: "Centurion",
    province: "Gauteng",
    blurb: "Family suburbs between Pretoria and Joburg — strong childcare demand.",
  },
  {
    slug: "somerset-west",
    name: "Somerset West",
    province: "Western Cape",
    blurb: "Helderberg hosts seeking trusted sitters and house sitters.",
  },
  {
    slug: "bloemfontein",
    name: "Bloemfontein",
    province: "Free State",
    blurb: "Growing demand for childcare and elderly caregiving in the Free State capital.",
  },
  {
    slug: "port-elizabeth",
    name: "Gqeberha",
    province: "Eastern Cape",
    blurb: "Eastern Cape coastal families looking for babysitters and caregivers.",
  },
  {
    slug: "gqeberha",
    name: "Gqeberha",
    province: "Eastern Cape",
    blurb: "Find au pairs, babysitters, and pet sitters in Gqeberha (Port Elizabeth).",
  },
  {
    slug: "east-london",
    name: "East London",
    province: "Eastern Cape",
    blurb: "Buffalo City hosts and sitters for childcare and house sitting.",
  },
  {
    slug: "polokwane",
    name: "Polokwane",
    province: "Limpopo",
    blurb: "Limpopo families seeking verified childcare and caregiving support.",
  },
  {
    slug: "nelspruit",
    name: "Mbombela",
    province: "Mpumalanga",
    blurb: "Mbombela (Nelspruit) care marketplace for hosts and sitters.",
  },
  {
    slug: "mbombela",
    name: "Mbombela",
    province: "Mpumalanga",
  },
  {
    slug: "kimberley",
    name: "Kimberley",
    province: "Northern Cape",
  },
  {
    slug: "pietermaritzburg",
    name: "Pietermaritzburg",
    province: "KwaZulu-Natal",
  },
  {
    slug: "ballito",
    name: "Ballito",
    province: "KwaZulu-Natal",
    blurb: "North Coast families looking for babysitters, au pairs, and pet sitters.",
  },
  {
    slug: "umhlanga",
    name: "Umhlanga",
    province: "KwaZulu-Natal",
  },
  {
    slug: "paarl",
    name: "Paarl",
    province: "Western Cape",
  },
  {
    slug: "george",
    name: "George",
    province: "Western Cape",
  },
  {
    slug: "knysna",
    name: "Knysna",
    province: "Western Cape",
  },
  {
    slug: "hermanus",
    name: "Hermanus",
    province: "Western Cape",
  },
  {
    slug: "fourways",
    name: "Fourways",
    province: "Gauteng",
  },
  {
    slug: "randburg",
    name: "Randburg",
    province: "Gauteng",
  },
  {
    slug: "roodepoort",
    name: "Roodepoort",
    province: "Gauteng",
  },
  {
    slug: "midrand",
    name: "Midrand",
    province: "Gauteng",
  },
  {
    slug: "bryanston",
    name: "Bryanston",
    province: "Gauteng",
  },
  {
    slug: "claremont",
    name: "Claremont",
    province: "Western Cape",
  },
  {
    slug: "sea-point",
    name: "Sea Point",
    province: "Western Cape",
  },
  {
    slug: "southbroom",
    name: "Southbroom",
    province: "KwaZulu-Natal",
    blurb:
      "South Coast KZN hosts and sitters — holiday homes, au pairs, and pet care near the beach.",
  },
  {
    slug: "pietermaritzburg",
    name: "Pietermaritzburg",
    province: "KwaZulu-Natal",
    blurb: "Midlands capital — childcare, tutors, and house sitting demand.",
  },
  {
    slug: "hilton",
    name: "Hilton",
    province: "KwaZulu-Natal",
  },
  {
    slug: "howick",
    name: "Howick",
    province: "KwaZulu-Natal",
  },
  {
    slug: "kimberley",
    name: "Kimberley",
    province: "Northern Cape",
  },
  {
    slug: "rustenburg",
    name: "Rustenburg",
    province: "North West",
  },
  {
    slug: "potchefstroom",
    name: "Potchefstroom",
    province: "North West",
  },
  {
    slug: "welkom",
    name: "Welkom",
    province: "Free State",
  },
  {
    slug: "franschhoek",
    name: "Franschhoek",
    province: "Western Cape",
    blurb: "Wine-route hosts seeking house sitters, pet care, and childcare.",
  },
  {
    slug: "plettenberg-bay",
    name: "Plettenberg Bay",
    province: "Western Cape",
    blurb: "Garden Route holiday homes — house sitting and pet sitting peak in season.",
  },
];

export function cityFromSlug(slug: string) {
  return SA_CITIES.find((c) => c.slug === slug) || null;
}

/** Unique city names (dedupe Gqeberha aliases etc.) for UI chips */
export function uniqueSaCitiesForNav() {
  const seen = new Set<string>();
  return SA_CITIES.filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
