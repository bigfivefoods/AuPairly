/**
 * Global location taxonomy for AuPairly.
 * Continent → country → province/state (where we have data) → city (free text).
 */

export type ContinentCode =
  | "AF"
  | "AS"
  | "EU"
  | "NA"
  | "SA"
  | "OC"
  | "AN";

export type Continent = {
  code: ContinentCode;
  name: string;
};

export const CONTINENTS: Continent[] = [
  { code: "AF", name: "Africa" },
  { code: "AS", name: "Asia" },
  { code: "EU", name: "Europe" },
  { code: "NA", name: "North America" },
  { code: "SA", name: "South America" },
  { code: "OC", name: "Oceania" },
  { code: "AN", name: "Antarctica" },
];

export type CountryDef = {
  name: string;
  /** ISO 3166-1 alpha-2 */
  code: string;
  continent: ContinentCode;
  /** States / provinces / regions when useful for search */
  regions?: string[];
};

/** Major subdivisions used for search & forms */
export const REGIONS: Record<string, string[]> = {
  "South Africa": [
    "Eastern Cape",
    "Free State",
    "Gauteng",
    "KwaZulu-Natal",
    "Limpopo",
    "Mpumalanga",
    "North West",
    "Northern Cape",
    "Western Cape",
  ],
  "United States": [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada",
    "New Hampshire", "New Jersey", "New Mexico", "New York",
    "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
    "West Virginia", "Wisconsin", "Wyoming", "District of Columbia",
  ],
  Canada: [
    "Alberta", "British Columbia", "Manitoba", "New Brunswick",
    "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia",
    "Nunavut", "Ontario", "Prince Edward Island", "Quebec",
    "Saskatchewan", "Yukon",
  ],
  Australia: [
    "Australian Capital Territory", "New South Wales", "Northern Territory",
    "Queensland", "South Australia", "Tasmania", "Victoria", "Western Australia",
  ],
  "United Kingdom": [
    "England", "Scotland", "Wales", "Northern Ireland",
  ],
  Germany: [
    "Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen",
    "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern",
    "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland",
    "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia",
  ],
  France: [
    "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Brittany",
    "Centre-Val de Loire", "Corsica", "Grand Est", "Hauts-de-France",
    "Île-de-France", "Normandy", "Nouvelle-Aquitaine", "Occitanie",
    "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
  ],
  Spain: [
    "Andalusia", "Aragon", "Asturias", "Balearic Islands", "Basque Country",
    "Canary Islands", "Cantabria", "Castile and León", "Castilla-La Mancha",
    "Catalonia", "Extremadura", "Galicia", "La Rioja", "Madrid", "Murcia",
    "Navarre", "Valencia",
  ],
  Italy: [
    "Abruzzo", "Aosta Valley", "Apulia", "Basilicata", "Calabria",
    "Campania", "Emilia-Romagna", "Friuli-Venezia Giulia", "Lazio",
    "Liguria", "Lombardy", "Marche", "Molise", "Piedmont", "Sardinia",
    "Sicily", "Trentino-Alto Adige", "Tuscany", "Umbria", "Veneto",
  ],
  Brazil: [
    "Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará",
    "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão",
    "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará",
    "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro",
    "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima",
    "Santa Catarina", "São Paulo", "Sergipe", "Tocantins",
  ],
  India: [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
    "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
    "Uttarakhand", "West Bengal", "Delhi",
  ],
  Mexico: [
    "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
    "Chiapas", "Chihuahua", "Coahuila", "Colima", "Durango", "Guanajuato",
    "Guerrero", "Hidalgo", "Jalisco", "Mexico City", "México", "Michoacán",
    "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla", "Querétaro",
    "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco",
    "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
  ],
  China: [
    "Anhui", "Beijing", "Chongqing", "Fujian", "Gansu", "Guangdong",
    "Guangxi", "Guizhou", "Hainan", "Hebei", "Heilongjiang", "Henan",
    "Hong Kong", "Hubei", "Hunan", "Inner Mongolia", "Jiangsu", "Jiangxi",
    "Jilin", "Liaoning", "Macau", "Ningxia", "Qinghai", "Shaanxi",
    "Shandong", "Shanghai", "Shanxi", "Sichuan", "Tianjin", "Tibet",
    "Xinjiang", "Yunnan", "Zhejiang",
  ],
  "United Arab Emirates": [
    "Abu Dhabi", "Ajman", "Dubai", "Fujairah", "Ras Al Khaimah",
    "Sharjah", "Umm Al Quwain",
  ],
  Nigeria: [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
    "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
    "Enugu", "FCT", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina",
    "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo",
    "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara",
  ],
  Kenya: [
    "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Kiambu", "Machakos",
    "Kajiado", "Kilifi", "Uasin Gishu", "Other",
  ],
  "New Zealand": [
    "Auckland", "Bay of Plenty", "Canterbury", "Gisborne", "Hawke's Bay",
    "Manawatū-Whanganui", "Marlborough", "Nelson", "Northland", "Otago",
    "Southland", "Taranaki", "Tasman", "Waikato", "Wellington", "West Coast",
  ],
  Argentina: [
    "Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes",
    "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza",
    "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis",
    "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego",
    "Tucumán", "Ciudad Autónoma de Buenos Aires",
  ],
  Japan: [
    "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima",
    "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa",
    "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu",
    "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Osaka", "Hyogo", "Nara",
    "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi",
    "Tokushima", "Kagawa", "Ehime", "Kochi", "Fukuoka", "Saga", "Nagasaki",
    "Kumamoto", "Oita", "Miyazaki", "Kagoshima", "Okinawa",
  ],
};

/**
 * World countries by continent (common English names).
 * Regions attached from REGIONS where defined.
 */
const COUNTRY_SEED: Omit<CountryDef, "regions">[] = [
  // Africa
  { name: "Algeria", code: "DZ", continent: "AF" },
  { name: "Angola", code: "AO", continent: "AF" },
  { name: "Benin", code: "BJ", continent: "AF" },
  { name: "Botswana", code: "BW", continent: "AF" },
  { name: "Burkina Faso", code: "BF", continent: "AF" },
  { name: "Burundi", code: "BI", continent: "AF" },
  { name: "Cabo Verde", code: "CV", continent: "AF" },
  { name: "Cameroon", code: "CM", continent: "AF" },
  { name: "Central African Republic", code: "CF", continent: "AF" },
  { name: "Chad", code: "TD", continent: "AF" },
  { name: "Comoros", code: "KM", continent: "AF" },
  { name: "Congo", code: "CG", continent: "AF" },
  { name: "Democratic Republic of the Congo", code: "CD", continent: "AF" },
  { name: "Côte d'Ivoire", code: "CI", continent: "AF" },
  { name: "Djibouti", code: "DJ", continent: "AF" },
  { name: "Egypt", code: "EG", continent: "AF" },
  { name: "Equatorial Guinea", code: "GQ", continent: "AF" },
  { name: "Eritrea", code: "ER", continent: "AF" },
  { name: "Eswatini", code: "SZ", continent: "AF" },
  { name: "Ethiopia", code: "ET", continent: "AF" },
  { name: "Gabon", code: "GA", continent: "AF" },
  { name: "Gambia", code: "GM", continent: "AF" },
  { name: "Ghana", code: "GH", continent: "AF" },
  { name: "Guinea", code: "GN", continent: "AF" },
  { name: "Guinea-Bissau", code: "GW", continent: "AF" },
  { name: "Kenya", code: "KE", continent: "AF" },
  { name: "Lesotho", code: "LS", continent: "AF" },
  { name: "Liberia", code: "LR", continent: "AF" },
  { name: "Libya", code: "LY", continent: "AF" },
  { name: "Madagascar", code: "MG", continent: "AF" },
  { name: "Malawi", code: "MW", continent: "AF" },
  { name: "Mali", code: "ML", continent: "AF" },
  { name: "Mauritania", code: "MR", continent: "AF" },
  { name: "Mauritius", code: "MU", continent: "AF" },
  { name: "Morocco", code: "MA", continent: "AF" },
  { name: "Mozambique", code: "MZ", continent: "AF" },
  { name: "Namibia", code: "NA", continent: "AF" },
  { name: "Niger", code: "NE", continent: "AF" },
  { name: "Nigeria", code: "NG", continent: "AF" },
  { name: "Rwanda", code: "RW", continent: "AF" },
  { name: "São Tomé and Príncipe", code: "ST", continent: "AF" },
  { name: "Senegal", code: "SN", continent: "AF" },
  { name: "Seychelles", code: "SC", continent: "AF" },
  { name: "Sierra Leone", code: "SL", continent: "AF" },
  { name: "Somalia", code: "SO", continent: "AF" },
  { name: "South Africa", code: "ZA", continent: "AF" },
  { name: "South Sudan", code: "SS", continent: "AF" },
  { name: "Sudan", code: "SD", continent: "AF" },
  { name: "Tanzania", code: "TZ", continent: "AF" },
  { name: "Togo", code: "TG", continent: "AF" },
  { name: "Tunisia", code: "TN", continent: "AF" },
  { name: "Uganda", code: "UG", continent: "AF" },
  { name: "Zambia", code: "ZM", continent: "AF" },
  { name: "Zimbabwe", code: "ZW", continent: "AF" },
  // Asia
  { name: "Afghanistan", code: "AF", continent: "AS" },
  { name: "Armenia", code: "AM", continent: "AS" },
  { name: "Azerbaijan", code: "AZ", continent: "AS" },
  { name: "Bahrain", code: "BH", continent: "AS" },
  { name: "Bangladesh", code: "BD", continent: "AS" },
  { name: "Bhutan", code: "BT", continent: "AS" },
  { name: "Brunei", code: "BN", continent: "AS" },
  { name: "Cambodia", code: "KH", continent: "AS" },
  { name: "China", code: "CN", continent: "AS" },
  { name: "Cyprus", code: "CY", continent: "AS" },
  { name: "Georgia", code: "GE", continent: "AS" },
  { name: "India", code: "IN", continent: "AS" },
  { name: "Indonesia", code: "ID", continent: "AS" },
  { name: "Iran", code: "IR", continent: "AS" },
  { name: "Iraq", code: "IQ", continent: "AS" },
  { name: "Israel", code: "IL", continent: "AS" },
  { name: "Japan", code: "JP", continent: "AS" },
  { name: "Jordan", code: "JO", continent: "AS" },
  { name: "Kazakhstan", code: "KZ", continent: "AS" },
  { name: "Kuwait", code: "KW", continent: "AS" },
  { name: "Kyrgyzstan", code: "KG", continent: "AS" },
  { name: "Laos", code: "LA", continent: "AS" },
  { name: "Lebanon", code: "LB", continent: "AS" },
  { name: "Malaysia", code: "MY", continent: "AS" },
  { name: "Maldives", code: "MV", continent: "AS" },
  { name: "Mongolia", code: "MN", continent: "AS" },
  { name: "Myanmar", code: "MM", continent: "AS" },
  { name: "Nepal", code: "NP", continent: "AS" },
  { name: "North Korea", code: "KP", continent: "AS" },
  { name: "Oman", code: "OM", continent: "AS" },
  { name: "Pakistan", code: "PK", continent: "AS" },
  { name: "Palestine", code: "PS", continent: "AS" },
  { name: "Philippines", code: "PH", continent: "AS" },
  { name: "Qatar", code: "QA", continent: "AS" },
  { name: "Saudi Arabia", code: "SA", continent: "AS" },
  { name: "Singapore", code: "SG", continent: "AS" },
  { name: "South Korea", code: "KR", continent: "AS" },
  { name: "Sri Lanka", code: "LK", continent: "AS" },
  { name: "Syria", code: "SY", continent: "AS" },
  { name: "Taiwan", code: "TW", continent: "AS" },
  { name: "Tajikistan", code: "TJ", continent: "AS" },
  { name: "Thailand", code: "TH", continent: "AS" },
  { name: "Timor-Leste", code: "TL", continent: "AS" },
  { name: "Turkey", code: "TR", continent: "AS" },
  { name: "Turkmenistan", code: "TM", continent: "AS" },
  { name: "United Arab Emirates", code: "AE", continent: "AS" },
  { name: "Uzbekistan", code: "UZ", continent: "AS" },
  { name: "Vietnam", code: "VN", continent: "AS" },
  { name: "Yemen", code: "YE", continent: "AS" },
  // Europe
  { name: "Albania", code: "AL", continent: "EU" },
  { name: "Andorra", code: "AD", continent: "EU" },
  { name: "Austria", code: "AT", continent: "EU" },
  { name: "Belarus", code: "BY", continent: "EU" },
  { name: "Belgium", code: "BE", continent: "EU" },
  { name: "Bosnia and Herzegovina", code: "BA", continent: "EU" },
  { name: "Bulgaria", code: "BG", continent: "EU" },
  { name: "Croatia", code: "HR", continent: "EU" },
  { name: "Czech Republic", code: "CZ", continent: "EU" },
  { name: "Denmark", code: "DK", continent: "EU" },
  { name: "Estonia", code: "EE", continent: "EU" },
  { name: "Finland", code: "FI", continent: "EU" },
  { name: "France", code: "FR", continent: "EU" },
  { name: "Germany", code: "DE", continent: "EU" },
  { name: "Greece", code: "GR", continent: "EU" },
  { name: "Hungary", code: "HU", continent: "EU" },
  { name: "Iceland", code: "IS", continent: "EU" },
  { name: "Ireland", code: "IE", continent: "EU" },
  { name: "Italy", code: "IT", continent: "EU" },
  { name: "Kosovo", code: "XK", continent: "EU" },
  { name: "Latvia", code: "LV", continent: "EU" },
  { name: "Liechtenstein", code: "LI", continent: "EU" },
  { name: "Lithuania", code: "LT", continent: "EU" },
  { name: "Luxembourg", code: "LU", continent: "EU" },
  { name: "Malta", code: "MT", continent: "EU" },
  { name: "Moldova", code: "MD", continent: "EU" },
  { name: "Monaco", code: "MC", continent: "EU" },
  { name: "Montenegro", code: "ME", continent: "EU" },
  { name: "Netherlands", code: "NL", continent: "EU" },
  { name: "North Macedonia", code: "MK", continent: "EU" },
  { name: "Norway", code: "NO", continent: "EU" },
  { name: "Poland", code: "PL", continent: "EU" },
  { name: "Portugal", code: "PT", continent: "EU" },
  { name: "Romania", code: "RO", continent: "EU" },
  { name: "Russia", code: "RU", continent: "EU" },
  { name: "San Marino", code: "SM", continent: "EU" },
  { name: "Serbia", code: "RS", continent: "EU" },
  { name: "Slovakia", code: "SK", continent: "EU" },
  { name: "Slovenia", code: "SI", continent: "EU" },
  { name: "Spain", code: "ES", continent: "EU" },
  { name: "Sweden", code: "SE", continent: "EU" },
  { name: "Switzerland", code: "CH", continent: "EU" },
  { name: "Ukraine", code: "UA", continent: "EU" },
  { name: "United Kingdom", code: "GB", continent: "EU" },
  { name: "Vatican City", code: "VA", continent: "EU" },
  // North America
  { name: "Antigua and Barbuda", code: "AG", continent: "NA" },
  { name: "Bahamas", code: "BS", continent: "NA" },
  { name: "Barbados", code: "BB", continent: "NA" },
  { name: "Belize", code: "BZ", continent: "NA" },
  { name: "Canada", code: "CA", continent: "NA" },
  { name: "Costa Rica", code: "CR", continent: "NA" },
  { name: "Cuba", code: "CU", continent: "NA" },
  { name: "Dominica", code: "DM", continent: "NA" },
  { name: "Dominican Republic", code: "DO", continent: "NA" },
  { name: "El Salvador", code: "SV", continent: "NA" },
  { name: "Grenada", code: "GD", continent: "NA" },
  { name: "Guatemala", code: "GT", continent: "NA" },
  { name: "Haiti", code: "HT", continent: "NA" },
  { name: "Honduras", code: "HN", continent: "NA" },
  { name: "Jamaica", code: "JM", continent: "NA" },
  { name: "Mexico", code: "MX", continent: "NA" },
  { name: "Nicaragua", code: "NI", continent: "NA" },
  { name: "Panama", code: "PA", continent: "NA" },
  { name: "Saint Kitts and Nevis", code: "KN", continent: "NA" },
  { name: "Saint Lucia", code: "LC", continent: "NA" },
  { name: "Saint Vincent and the Grenadines", code: "VC", continent: "NA" },
  { name: "Trinidad and Tobago", code: "TT", continent: "NA" },
  { name: "United States", code: "US", continent: "NA" },
  // South America
  { name: "Argentina", code: "AR", continent: "SA" },
  { name: "Bolivia", code: "BO", continent: "SA" },
  { name: "Brazil", code: "BR", continent: "SA" },
  { name: "Chile", code: "CL", continent: "SA" },
  { name: "Colombia", code: "CO", continent: "SA" },
  { name: "Ecuador", code: "EC", continent: "SA" },
  { name: "Guyana", code: "GY", continent: "SA" },
  { name: "Paraguay", code: "PY", continent: "SA" },
  { name: "Peru", code: "PE", continent: "SA" },
  { name: "Suriname", code: "SR", continent: "SA" },
  { name: "Uruguay", code: "UY", continent: "SA" },
  { name: "Venezuela", code: "VE", continent: "SA" },
  // Oceania
  { name: "Australia", code: "AU", continent: "OC" },
  { name: "Fiji", code: "FJ", continent: "OC" },
  { name: "Kiribati", code: "KI", continent: "OC" },
  { name: "Marshall Islands", code: "MH", continent: "OC" },
  { name: "Micronesia", code: "FM", continent: "OC" },
  { name: "Nauru", code: "NR", continent: "OC" },
  { name: "New Zealand", code: "NZ", continent: "OC" },
  { name: "Palau", code: "PW", continent: "OC" },
  { name: "Papua New Guinea", code: "PG", continent: "OC" },
  { name: "Samoa", code: "WS", continent: "OC" },
  { name: "Solomon Islands", code: "SB", continent: "OC" },
  { name: "Tonga", code: "TO", continent: "OC" },
  { name: "Tuvalu", code: "TV", continent: "OC" },
  { name: "Vanuatu", code: "VU", continent: "OC" },
];

export const COUNTRIES: CountryDef[] = COUNTRY_SEED.map((c) => ({
  ...c,
  regions: REGIONS[c.name],
}));

/** Sorted country names for simple selects */
export const COUNTRY_OPTIONS: string[] = COUNTRIES.map((c) => c.name).sort((a, b) =>
  a.localeCompare(b)
);

export function continentName(code?: string | null): string | null {
  if (!code) return null;
  return CONTINENTS.find((c) => c.code === code)?.name || code;
}

export function countriesForContinent(continent?: string | null): CountryDef[] {
  if (!continent) return COUNTRIES;
  return COUNTRIES.filter((c) => c.continent === continent);
}

export function countryByName(name?: string | null): CountryDef | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  return COUNTRIES.find((c) => c.name.toLowerCase() === n);
}

export function regionsForCountry(country?: string | null): string[] {
  if (!country) return [];
  return REGIONS[country] || countryByName(country)?.regions || [];
}

export function continentForCountry(country?: string | null): ContinentCode | null {
  return countryByName(country)?.continent || null;
}

export function formatFullLocation(parts: {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  continent?: string | null;
}): string {
  const bits = [
    parts.city,
    parts.region,
    parts.country,
    parts.continent ? continentName(parts.continent) : null,
  ].filter(Boolean) as string[];
  return bits.join(", ") || "Location TBD";
}
