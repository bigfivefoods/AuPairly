/**
 * AuPair Connect — peer community helpers (sitter ↔ sitter, same area).
 */

export type PeerProximity = "city" | "region" | "country" | "any";

export function proximityLabel(p: PeerProximity): string {
  switch (p) {
    case "city":
      return "Same city";
    case "region":
      return "Same region";
    case "country":
      return "Same country";
    default:
      return "Nearby";
  }
}

/** Score how close two free-text places are (for sorting). */
export function peerProximity(
  me: { city?: string | null; region?: string | null; country?: string | null },
  them: { city?: string | null; region?: string | null; country?: string | null }
): PeerProximity {
  const norm = (s?: string | null) => (s || "").trim().toLowerCase();
  const myCity = norm(me.city);
  const myRegion = norm(me.region);
  const myCountry = norm(me.country);
  const theirCity = norm(them.city);
  const theirRegion = norm(them.region);
  const theirCountry = norm(them.country);

  if (myCity && theirCity && (myCity === theirCity || theirCity.includes(myCity) || myCity.includes(theirCity))) {
    return "city";
  }
  if (
    myCountry &&
    theirCountry &&
    myCountry === theirCountry &&
    myRegion &&
    theirRegion &&
    (myRegion === theirRegion || theirRegion.includes(myRegion) || myRegion.includes(theirRegion))
  ) {
    return "region";
  }
  if (myCountry && theirCountry && myCountry === theirCountry) {
    return "country";
  }
  return "any";
}

export function peerIcebreaker(firstName: string, city?: string | null): string {
  const name = firstName.split(" ")[0] || "there";
  const place = city?.trim();
  if (place) {
    return `Hi ${name}! I'm also a sitter near ${place} and would love to connect — always nice to make friends when you're abroad. Hope you're settling in well 😊`;
  }
  return `Hi ${name}! I'm also an au pair / sitter and would love to connect as friends — always good to know someone who's on a similar journey. Hope you're doing well 😊`;
}
