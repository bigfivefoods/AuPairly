/** Popular SA cities for SEO landing pages & filters */
export const SA_CITIES = [
  { slug: "cape-town", name: "Cape Town", province: "Western Cape" },
  { slug: "johannesburg", name: "Johannesburg", province: "Gauteng" },
  { slug: "pretoria", name: "Pretoria", province: "Gauteng" },
  { slug: "durban", name: "Durban", province: "KwaZulu-Natal" },
  { slug: "stellenbosch", name: "Stellenbosch", province: "Western Cape" },
  { slug: "sandton", name: "Sandton", province: "Gauteng" },
  { slug: "centurion", name: "Centurion", province: "Gauteng" },
  { slug: "somerset-west", name: "Somerset West", province: "Western Cape" },
  { slug: "bloemfontein", name: "Bloemfontein", province: "Free State" },
  { slug: "port-elizabeth", name: "Gqeberha", province: "Eastern Cape" },
] as const;

export function cityFromSlug(slug: string) {
  return SA_CITIES.find((c) => c.slug === slug) || null;
}
