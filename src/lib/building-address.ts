// Utilities for converting between building addresses and URL slugs.
// A building slug is the address without unit/apt info, e.g. "300-front-st-w".

const STREET_SUFFIXES = [
  'st', 'ave', 'blvd', 'rd', 'dr', 'cres', 'way', 'ter', 'crt', 'ct',
  'ln', 'pl', 'sq', 'mews', 'pkwy', 'hwy', 'trail', 'gate', 'circle',
  'cir', 'grove', 'grv', 'heights', 'hts', 'ridge',
];
const STREET_DIRECTIONS = ['w', 'e', 'n', 's', 'nw', 'ne', 'sw', 'se'];

export interface BuildingAddress {
  streetNumber: string;
  streetName: string;
  streetSuffix?: string;
  streetDirection?: string;
}

function slugPart(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function slugifyBuildingAddress(addr: BuildingAddress): string {
  const parts = [addr.streetNumber, addr.streetName, addr.streetSuffix, addr.streetDirection]
    .filter(Boolean)
    .join(' ');
  return slugPart(parts);
}

// Take a full address string (may include unit) and return a building slug.
// "300 Front St W #1208" → "300-front-st-w"
// "300 Front St W" → "300-front-st-w"
export function slugifyFullAddress(addr: string): string {
  if (!addr) return '';
  const stripped = addr.replace(/[,#].*$/, '').replace(/\bunit\s+\S+/gi, '').trim();
  return slugPart(stripped);
}

// Parse a slug back to address components.
// "300-front-st-w" → { streetNumber: "300", streetName: "Front", streetSuffix: "St", streetDirection: "W" }
// "155-yorkville-ave" → { streetNumber: "155", streetName: "Yorkville", streetSuffix: "Ave" }
// "151-dan-leckie-way" → { streetNumber: "151", streetName: "Dan Leckie", streetSuffix: "Way" }
export function parseAddressFromSlug(slug: string): BuildingAddress | null {
  if (!slug) return null;
  const tokens = slug.toLowerCase().split('-').filter(Boolean);
  if (tokens.length < 2) return null;

  // First token should be the street number
  const streetNumber = tokens[0];
  if (!/^\d+[a-z]?$/.test(streetNumber)) return null;

  const rest = tokens.slice(1);
  let streetDirection: string | undefined;
  let streetSuffix: string | undefined;

  // Last token: direction?
  if (rest.length > 1 && STREET_DIRECTIONS.includes(rest[rest.length - 1])) {
    streetDirection = rest.pop()!.toUpperCase();
  }

  // Last remaining token: suffix?
  if (rest.length > 1 && STREET_SUFFIXES.includes(rest[rest.length - 1])) {
    const s = rest.pop()!;
    streetSuffix = s.charAt(0).toUpperCase() + s.slice(1);
  }

  if (rest.length === 0) return null;

  const streetName = rest
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ');

  return { streetNumber, streetName, streetSuffix, streetDirection };
}

// Format a parsed address back into a human-readable string.
// { streetNumber: "300", streetName: "Front", streetSuffix: "St", streetDirection: "W" } → "300 Front St W"
export function formatAddress(addr: BuildingAddress): string {
  return [addr.streetNumber, addr.streetName, addr.streetSuffix, addr.streetDirection]
    .filter(Boolean)
    .join(' ');
}
