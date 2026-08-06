/**
 * City coordinates for map browse (privacy-safe: city centre only, never street address).
 * South Africa hubs + common international au pair destinations.
 */

export type CityPin = {
  city: string;
  country: string;
  lat: number;
  lng: number;
  /** Optional aliases for matching profile.city strings */
  aliases?: string[];
};

export const CITY_PINS: CityPin[] = [
  // South Africa
  { city: "Cape Town", country: "South Africa", lat: -33.9249, lng: 18.4241, aliases: ["CapeTown", "Kaapstad"] },
  { city: "Johannesburg", country: "South Africa", lat: -26.2041, lng: 28.0473, aliases: ["Joburg", "Jo'burg", "Jozi"] },
  { city: "Pretoria", country: "South Africa", lat: -25.7479, lng: 28.2293, aliases: ["Tshwane"] },
  { city: "Durban", country: "South Africa", lat: -29.8587, lng: 31.0218 },
  { city: "Stellenbosch", country: "South Africa", lat: -33.9321, lng: 18.8602 },
  { city: "Port Elizabeth", country: "South Africa", lat: -33.9608, lng: 25.6022, aliases: ["Gqeberha"] },
  { city: "Bloemfontein", country: "South Africa", lat: -29.0852, lng: 26.1596 },
  // Europe (common)
  { city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278 },
  { city: "Paris", country: "France", lat: 48.8566, lng: 2.3522 },
  { city: "Berlin", country: "Germany", lat: 52.52, lng: 13.405 },
  { city: "Munich", country: "Germany", lat: 48.1351, lng: 11.582 },
  { city: "Amsterdam", country: "Netherlands", lat: 52.3676, lng: 4.9041 },
  { city: "Madrid", country: "Spain", lat: 40.4168, lng: -3.7038 },
  { city: "Barcelona", country: "Spain", lat: 41.3874, lng: 2.1686 },
  { city: "Rome", country: "Italy", lat: 41.9028, lng: 12.4964 },
  { city: "Dublin", country: "Ireland", lat: 53.3498, lng: -6.2603 },
  // Elsewhere
  { city: "New York", country: "United States", lat: 40.7128, lng: -74.006, aliases: ["NYC"] },
  { city: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, aliases: ["LA"] },
  { city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093 },
  { city: "Toronto", country: "Canada", lat: 43.6532, lng: -79.3832 },
  { city: "Dubai", country: "United Arab Emirates", lat: 25.2048, lng: 55.2708 },
];

export function matchCityPin(
  city?: string | null,
  country?: string | null
): CityPin | null {
  if (!city) return null;
  const c = city.trim().toLowerCase();
  const co = (country || "").trim().toLowerCase();

  for (const pin of CITY_PINS) {
    const names = [pin.city, ...(pin.aliases || [])].map((n) => n.toLowerCase());
    if (!names.some((n) => c === n || c.includes(n) || n.includes(c))) continue;
    if (co && pin.country.toLowerCase() !== co && !co.includes(pin.country.toLowerCase().slice(0, 5))) {
      // country mismatch — still allow if city unique enough
      const sameName = CITY_PINS.filter((p) => p.city.toLowerCase() === pin.city.toLowerCase());
      if (sameName.length > 1) continue;
    }
    return pin;
  }
  return null;
}

/** Project lat/lng into 0–100% of a mercator-ish map box (good enough for pins). */
export function projectToPercent(lat: number, lng: number): { x: number; y: number } {
  // Simple equirectangular: lng -180..180 → 0..100, lat 85..-85 → 0..100
  const x = ((lng + 180) / 360) * 100;
  const y = ((85 - lat) / 170) * 100;
  return {
    x: Math.min(98, Math.max(2, x)),
    y: Math.min(98, Math.max(2, y)),
  };
}

export type MapCluster = {
  pin: CityPin;
  count: number;
  /** profile ids for listing under this city */
  profileIds: string[];
};

export function clusterByCity(
  rows: { id: string; city?: string | null; country?: string | null }[]
): MapCluster[] {
  const map = new Map<string, MapCluster>();
  for (const row of rows) {
    const pin = matchCityPin(row.city, row.country);
    if (!pin) continue;
    const key = `${pin.city}|${pin.country}`;
    const existing = map.get(key);
    if (existing) {
      existing.count++;
      existing.profileIds.push(row.id);
    } else {
      map.set(key, { pin, count: 1, profileIds: [row.id] });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}
