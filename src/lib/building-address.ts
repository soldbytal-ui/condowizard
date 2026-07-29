// Utilities for converting between building addresses and URL slugs.
// A building slug is the address without unit/apt info, e.g. "300-front-st-w".

// Both short and long forms of street suffixes are recognised on parse. All
// forms normalise to the TREB abbreviated suffix that Repliers returns in
// the `address.streetSuffix` field ("St" / "Ave" / "Blvd" / ...).
const SUFFIX_MAP: Record<string, string> = {
  street: 'St', st: 'St',
  avenue: 'Ave', ave: 'Ave',
  boulevard: 'Blvd', blvd: 'Blvd',
  road: 'Rd', rd: 'Rd',
  drive: 'Dr', dr: 'Dr',
  crescent: 'Cres', cres: 'Cres',
  court: 'Crt', crt: 'Crt', ct: 'Crt',
  lane: 'Lane', ln: 'Lane',
  place: 'Pl', pl: 'Pl',
  terrace: 'Ter', ter: 'Ter',
  way: 'Way',
  trail: 'Trail', trl: 'Trail',
  circle: 'Cir', cir: 'Cir',
  square: 'Sq', sq: 'Sq',
  gardens: 'Gdns', gdns: 'Gdns',
  grove: 'Grve', grv: 'Grve',
  heights: 'Hts', hts: 'Hts',
  parkway: 'Pkwy', pkwy: 'Pkwy',
  mews: 'Mews',
  gate: 'Gate',
  highway: 'Hwy', hwy: 'Hwy',
  ridge: 'Ridge',
};

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
// "300-front-st-w"     → { streetNumber: "300", streetName: "Front",     streetSuffix: "St",  streetDirection: "W" }
// "284-king-street"    → { streetNumber: "284", streetName: "King",      streetSuffix: "St" }
// "8-pemberton-avenue" → { streetNumber: "8",   streetName: "Pemberton", streetSuffix: "Ave" }
// "155-yorkville-ave"  → { streetNumber: "155", streetName: "Yorkville", streetSuffix: "Ave" }
// "151-dan-leckie-way" → { streetNumber: "151", streetName: "Dan Leckie", streetSuffix: "Way" }
export function parseAddressFromSlug(slug: string): BuildingAddress | null {
  if (!slug) return null;
  const tokens = slug.toLowerCase().split('-').filter(Boolean);
  if (tokens.length < 2) return null;

  // First token should be the street number (optionally followed by a letter, e.g. "12a")
  const streetNumber = tokens[0];
  if (!/^\d+[a-z]?$/.test(streetNumber)) return null;

  const rest = tokens.slice(1);
  let streetDirection: string | undefined;
  let streetSuffix: string | undefined;

  // Last token: direction?
  if (rest.length > 1 && STREET_DIRECTIONS.includes(rest[rest.length - 1])) {
    streetDirection = rest.pop()!.toUpperCase();
  }

  // Last remaining token: suffix (recognise both "st" and "street", normalise to "St")
  if (rest.length > 1) {
    const last = rest[rest.length - 1];
    const normalised = SUFFIX_MAP[last];
    if (normalised) {
      rest.pop();
      streetSuffix = normalised;
    }
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
