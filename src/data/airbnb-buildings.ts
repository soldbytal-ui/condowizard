export interface AirbnbBuilding {
  address: string;
  registrations: number;
  ward: string;
  neighbourhood: string;
  lat: number;
  lng: number;
  slug: string;
  buildingName?: string;
}

export const AIRBNB_BUILDINGS: AirbnbBuilding[] = [
  { address: "300 Front St W", registrations: 237, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6422, lng: -79.3942, slug: "300-front-st-w", buildingName: "Tridel Delsuites" },
  { address: "251 Jarvis St", registrations: 196, ward: "Toronto Centre", neighbourhood: "Garden District", lat: 43.6607, lng: -79.3748, slug: "251-jarvis-st", buildingName: "Jarvis Condos" },
  { address: "14 York St", registrations: 168, ward: "Spadina-Fort York", neighbourhood: "Harbourfront", lat: 43.6411, lng: -79.3801, slug: "14-york-st", buildingName: "ICE Condos Phase 1" },
  { address: "21 Iceboat Ter", registrations: 158, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6380, lng: -79.3988, slug: "21-iceboat-ter", buildingName: "Nautilus at Waterview" },
  { address: "101 Peter St", registrations: 117, ward: "Spadina-Fort York", neighbourhood: "Entertainment District", lat: 43.6489, lng: -79.3944, slug: "101-peter-st", buildingName: "Peter Street Condos" },
  { address: "12 York St", registrations: 113, ward: "Spadina-Fort York", neighbourhood: "Harbourfront", lat: 43.6414, lng: -79.3804, slug: "12-york-st", buildingName: "ICE Condos Phase 2" },
  { address: "151 Dan Leckie Way", registrations: 111, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6380, lng: -79.3968, slug: "151-dan-leckie-way", buildingName: "Parade 2" },
  { address: "155 Yorkville Ave", registrations: 94, ward: "University-Rosedale", neighbourhood: "Yorkville", lat: 43.6714, lng: -79.3917, slug: "155-yorkville-ave", buildingName: "Four Seasons Private Residences" },
  { address: "65 Bremner Blvd", registrations: 69, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6423, lng: -79.3869, slug: "65-bremner-blvd", buildingName: "Maple Leaf Square" },
  { address: "55 Bremner Blvd", registrations: 62, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6419, lng: -79.3859, slug: "55-bremner-blvd", buildingName: "Maple Leaf Square South" },
  { address: "215 Fort York Blvd", registrations: 59, ward: "Spadina-Fort York", neighbourhood: "Fort York", lat: 43.6389, lng: -79.3963, slug: "215-fort-york-blvd", buildingName: "Library District" },
  { address: "209 Fort York Blvd", registrations: 58, ward: "Spadina-Fort York", neighbourhood: "Fort York", lat: 43.6391, lng: -79.3959, slug: "209-fort-york-blvd" },
  { address: "210 Victoria St", registrations: 57, ward: "Toronto Centre", neighbourhood: "Garden District", lat: 43.6559, lng: -79.3793, slug: "210-victoria-st" },
  { address: "955 Bay St", registrations: 55, ward: "Toronto Centre", neighbourhood: "Bay Street Corridor", lat: 43.6636, lng: -79.3867, slug: "955-bay-st" },
  { address: "30 Nelson St", registrations: 52, ward: "Spadina-Fort York", neighbourhood: "Entertainment District", lat: 43.6497, lng: -79.3925, slug: "30-nelson-st" },
  { address: "219 Fort York Blvd", registrations: 47, ward: "Spadina-Fort York", neighbourhood: "Fort York", lat: 43.6387, lng: -79.3966, slug: "219-fort-york-blvd" },
  { address: "832 Bay St", registrations: 47, ward: "University-Rosedale", neighbourhood: "Bay Street Corridor", lat: 43.6613, lng: -79.3864, slug: "832-bay-st" },
  { address: "231 Fort York Blvd", registrations: 45, ward: "Spadina-Fort York", neighbourhood: "Fort York", lat: 43.6386, lng: -79.3970, slug: "231-fort-york-blvd" },
  { address: "188 Cumberland St", registrations: 37, ward: "University-Rosedale", neighbourhood: "Yorkville", lat: 43.6710, lng: -79.3900, slug: "188-cumberland-st", buildingName: "Yorkville Plaza" },
  { address: "560 Front St W", registrations: 34, ward: "Spadina-Fort York", neighbourhood: "Fort York", lat: 43.6397, lng: -79.4021, slug: "560-front-st-w" },
  { address: "8 The Esplanade", registrations: 33, ward: "Toronto Centre", neighbourhood: "St. Lawrence", lat: 43.6464, lng: -79.3747, slug: "8-the-esplanade" },
  { address: "85 Queens Wharf Rd", registrations: 32, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6370, lng: -79.3987, slug: "85-queens-wharf-rd" },
  { address: "628 Fleet St", registrations: 31, ward: "Spadina-Fort York", neighbourhood: "Bathurst Quay", lat: 43.6368, lng: -79.4042, slug: "628-fleet-st" },
  { address: "38 Grenville St", registrations: 30, ward: "Toronto Centre", neighbourhood: "Bay Street Corridor", lat: 43.6633, lng: -79.3852, slug: "38-grenville-st" },
  { address: "8 Colborne St", registrations: 29, ward: "Toronto Centre", neighbourhood: "Old Town", lat: 43.6494, lng: -79.3754, slug: "8-colborne-st" },
  { address: "161 Roehampton Ave", registrations: 28, ward: "Don Valley West", neighbourhood: "Yonge-Eglinton", lat: 43.7083, lng: -79.3965, slug: "161-roehampton-ave" },
  { address: "8 Mercer St", registrations: 27, ward: "Spadina-Fort York", neighbourhood: "Entertainment District", lat: 43.6469, lng: -79.3926, slug: "8-mercer-st" },
  { address: "600 Fleet St", registrations: 26, ward: "Spadina-Fort York", neighbourhood: "Bathurst Quay", lat: 43.6374, lng: -79.4030, slug: "600-fleet-st" },
  { address: "8 York St", registrations: 25, ward: "Spadina-Fort York", neighbourhood: "Harbourfront", lat: 43.6418, lng: -79.3810, slug: "8-york-st" },
  { address: "88 Blue Jays Way", registrations: 24, ward: "Spadina-Fort York", neighbourhood: "Entertainment District", lat: 43.6441, lng: -79.3911, slug: "88-blue-jays-way" },
  { address: "8 Charlotte St", registrations: 23, ward: "Spadina-Fort York", neighbourhood: "King West", lat: 43.6465, lng: -79.3938, slug: "8-charlotte-st" },
  { address: "500 Lake Shore Blvd W", registrations: 22, ward: "Spadina-Fort York", neighbourhood: "CityPlace", lat: 43.6364, lng: -79.3977, slug: "500-lake-shore-blvd-w" },
  { address: "33 Bay St", registrations: 21, ward: "Spadina-Fort York", neighbourhood: "Harbourfront", lat: 43.6429, lng: -79.3774, slug: "33-bay-st" },
  { address: "8 Telegram Mews", registrations: 20, ward: "Spadina-Fort York", neighbourhood: "King West", lat: 43.6427, lng: -79.4033, slug: "8-telegram-mews" },
  { address: "125 Peter St", registrations: 19, ward: "Spadina-Fort York", neighbourhood: "Entertainment District", lat: 43.6483, lng: -79.3949, slug: "125-peter-st" },
  { address: "225 Webb Dr", registrations: 19, ward: "N/A", neighbourhood: "Mississauga City Centre", lat: 43.5911, lng: -79.6434, slug: "225-webb-dr" },
  { address: "36 Lisgar St", registrations: 18, ward: "Spadina-Fort York", neighbourhood: "King West", lat: 43.6399, lng: -79.4093, slug: "36-lisgar-st" },
  { address: "7 King St E", registrations: 17, ward: "Toronto Centre", neighbourhood: "St. Lawrence", lat: 43.6489, lng: -79.3755, slug: "7-king-st-e" },
  { address: "600 Queens Quay W", registrations: 16, ward: "Spadina-Fort York", neighbourhood: "Harbourfront", lat: 43.6370, lng: -79.3953, slug: "600-queens-quay-w" },
  { address: "2 Eva Rd", registrations: 15, ward: "Etobicoke-Lakeshore", neighbourhood: "Islington", lat: 43.6349, lng: -79.5253, slug: "2-eva-rd" },
];

export function parseAddress(addr: string): { streetNumber: string; streetName: string; streetSuffix: string; streetDirection?: string } | null {
  const m = addr.match(/^(\d+)\s+(.+?)\s+(St|Ave|Blvd|Rd|Dr|Cres|Way|Ter|Crt|Ln|Pl|Sq|Mews)\s*(W|E|N|S)?$/i);
  if (!m) return null;
  return { streetNumber: m[1], streetName: m[2], streetSuffix: m[3], streetDirection: m[4] || undefined };
}

export function getBuildingBySlug(slug: string): AirbnbBuilding | undefined {
  return AIRBNB_BUILDINGS.find((b) => b.slug === slug);
}

export const TOTAL_REGISTRATIONS = AIRBNB_BUILDINGS.reduce((s, b) => s + b.registrations, 0);
export const TOTAL_BUILDINGS = AIRBNB_BUILDINGS.length;
