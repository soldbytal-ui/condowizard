/**
 * Comprehensive Pre-Construction Project Scraper & Upserter
 *
 * Sources scraped: miamicondoinvestments.com, miamiluxuryhomes.com, manhattanmiami.com,
 * condoblackbook.com, miamipre.com, newconstructionsouthflorida.com, web search results
 *
 * Adds new projects, geocodes with Mapbox, generates footprints, upserts to Supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// ── Neighborhood slug mapping ──────────────────────────────────────
const NEIGHBORHOOD_SLUGS: Record<string, string> = {
  'brickell': 'brickell',
  'downtown miami': 'downtown-miami',
  'downtown': 'downtown-miami',
  'edgewater': 'edgewater',
  'miami beach': 'miami-beach',
  'south beach': 'south-beach',
  'coconut grove': 'coconut-grove',
  'coral gables': 'coral-gables',
  'sunny isles beach': 'sunny-isles-beach',
  'sunny isles': 'sunny-isles-beach',
  'surfside': 'surfside',
  'bal harbour': 'bal-harbour',
  'bay harbor islands': 'bay-harbor-islands',
  'bay harbor': 'bay-harbor-islands',
  'key biscayne': 'key-biscayne',
  'fisher island': 'key-biscayne',
  'midtown': 'midtown-wynwood',
  'wynwood': 'midtown-wynwood',
  'midtown/wynwood': 'midtown-wynwood',
  'design district': 'design-district',
  'aventura': 'aventura',
  'north bay village': 'north-bay-village',
  'north miami beach': 'north-miami-beach',
  'fort lauderdale': 'fort-lauderdale',
  'hollywood': 'hollywood',
  'hollywood beach': 'hollywood',
  'hallandale beach': 'hallandale-beach',
  'hallandale': 'hallandale-beach',
  'pompano beach': 'pompano-beach',
  'palm beach': 'palm-beach',
  'west palm beach': 'west-palm-beach',
  'boca raton': 'boca-raton',
  'delray beach': 'boca-raton',
  'north beach': 'miami-beach',
  'arts district': 'downtown-miami',
  'brickell key': 'brickell',
  'overtown': 'downtown-miami',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── NEW PROJECTS DATA ──────────────────────────────────────────────
// Compiled from scraping miamicondoinvestments.com, miamiluxuryhomes.com,
// manhattanmiami.com, condoblackbook.com blog, web search results
interface NewProject {
  name: string;
  address: string;
  neighborhood: string;
  developer: string;
  architect?: string;
  floors: number;
  totalUnits: number;
  priceMin?: number;
  priceMax?: number;
  estCompletion: string;
  status: string;
  category: string;
  description: string;
  amenities: string[];
  unitTypes?: string;
  type?: string; // condo, townhome, subdivision
}

const NEW_PROJECTS: NewProject[] = [
  // ── DOWNTOWN / WORLDCENTER ──
  {
    name: '501 First Residences',
    address: '501 NE 1st Ave, Miami, FL 33132',
    neighborhood: 'downtown miami',
    developer: 'Aria Development Group',
    architect: 'Arquitectonica',
    floors: 40,
    totalUnits: 448,
    priceMin: 400000,
    priceMax: 1200000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: '501 First Residences is a 40-story luxury condominium tower rising in the heart of Downtown Miami. Developed by Aria Development Group with architecture by Arquitectonica, this project brings 448 residences to one of Miami\'s most dynamic neighborhoods near the Arts & Entertainment District.',
    amenities: ['Resort-style pool deck', 'State-of-the-art fitness center', 'Co-working spaces', 'Yoga studio', 'BBQ area', 'Children\'s play area', 'Pet spa', '24-hour concierge', 'Valet parking'],
    unitTypes: 'Studios, 1-3 Bedrooms',
  },
  {
    name: 'The Crosby Miami Worldcenter',
    address: '640 N Miami Ave, Miami, FL 33136',
    neighborhood: 'downtown miami',
    developer: 'Related Group, Merrimac Ventures',
    architect: 'Arquitectonica',
    floors: 31,
    totalUnits: 450,
    priceMin: 450000,
    priceMax: 1500000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: 'The Crosby at Miami Worldcenter is a 31-story residential tower offering 450 luxury residences in Downtown Miami\'s transformative Miami Worldcenter district. This project by Related Group features a lifestyle-driven approach to urban living with extensive amenities and walkability.',
    amenities: ['Rooftop pool and lounge', 'Fitness center', 'Co-working lounge', 'Theater room', 'Social club', 'Dog park', 'Bicycle storage', 'Smart home technology', 'Package lockers'],
    unitTypes: 'Studios, 1-3 Bedrooms',
  },
  // ── BRICKELL ──
  {
    name: 'Una Residences',
    address: '175 SE 25th Rd, Miami, FL 33129',
    neighborhood: 'brickell',
    developer: 'OKO Group, Cain International',
    architect: 'Adrian Smith + Gordon Gill',
    floors: 47,
    totalUnits: 135,
    priceMin: 2900000,
    priceMax: 21000000,
    estCompletion: '2026',
    status: 'NEAR_COMPLETION',
    category: 'ULTRA_LUXURY',
    description: 'Una Residences is a 47-story waterfront tower on the shores of Biscayne Bay in Brickell. Designed by Adrian Smith + Gordon Gill Architecture, this ultra-luxury development by OKO Group offers 135 expansive residences with floor-to-ceiling windows, private elevator access, and direct bay views.',
    amenities: ['Bayfront infinity pool', 'Private marina', 'Spa and wellness center', 'Fitness center by Anatomy', 'Wine cellar', 'Children\'s playroom', 'Theater', 'Business center', 'Concierge', 'Sunset lounge'],
    unitTypes: '2-5 Bedrooms, Penthouses',
  },
  {
    name: 'Visions at Brickell Station',
    address: '1136 SW 3rd Ave, Miami, FL 33130',
    neighborhood: 'brickell',
    developer: 'Newgard Development Group',
    floors: 8,
    totalUnits: 111,
    priceMin: 350000,
    priceMax: 750000,
    estCompletion: '2027',
    status: 'PRE_CONSTRUCTION',
    category: 'AFFORDABLE_LUXURY',
    description: 'Visions at Brickell Station offers an accessible entry point into the coveted Brickell neighborhood. This 8-story boutique development by Newgard Development Group provides 111 thoughtfully designed residences steps from the Brickell City Centre Metromover station.',
    amenities: ['Rooftop pool', 'Fitness center', 'Co-working space', 'Package room', 'Bicycle storage', 'Pet-friendly amenities'],
    unitTypes: 'Studios, 1-2 Bedrooms',
  },
  // ── BAY HARBOR ISLANDS ──
  {
    name: 'Onda Residences',
    address: '1135 103rd Street, Bay Harbor Islands, FL 33154',
    neighborhood: 'bay harbor islands',
    developer: 'Verzasca Group',
    architect: 'Kobi Karp',
    floors: 8,
    totalUnits: 41,
    priceMin: 1400000,
    priceMax: 4500000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Onda Residences is a boutique waterfront condominium in Bay Harbor Islands offering 41 luxury residences. Designed by Kobi Karp Architecture, this intimate development features flowing, wave-inspired architecture with direct Intracoastal Waterway views and private boat slips.',
    amenities: ['Waterfront pool', 'Private boat slips', 'Fitness center', 'Rooftop terrace', 'Summer kitchen', 'Private storage', 'Concierge services'],
    unitTypes: '2-4 Bedrooms',
  },
  {
    name: 'Alana Bay Harbor Islands',
    address: '1030 93rd St, Bay Harbor Islands, FL 33154',
    neighborhood: 'bay harbor islands',
    developer: 'Two Roads Development',
    floors: 8,
    totalUnits: 32,
    priceMin: 1350000,
    priceMax: 3500000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Alana Bay Harbor Islands is an intimate waterfront condominium offering 32 luxury residences in the tranquil island enclave of Bay Harbor Islands. This boutique project by Two Roads Development emphasizes wellness-focused living with expansive waterfront views.',
    amenities: ['Bayfront pool', 'Wellness center', 'Yoga deck', 'Private boat dock', 'Rooftop lounge', 'Summer kitchen', 'EV charging'],
    unitTypes: '2-3 Bedrooms',
  },
  // ── SOUTH BEACH ──
  {
    name: 'Villa17',
    address: '1709 Jefferson Ave, Miami Beach, FL 33139',
    neighborhood: 'south beach',
    developer: 'Vertical Developments',
    floors: 5,
    totalUnits: 10,
    priceMin: 1800000,
    priceMax: 3200000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Villa17 is an ultra-exclusive boutique condominium in the heart of South Beach. With only 10 residences across 5 stories, this intimate development offers a private, villa-like living experience in one of Miami Beach\'s most desirable locations.',
    amenities: ['Rooftop pool', 'Private terraces', 'Concierge', 'Secure parking', 'Smart home technology'],
    unitTypes: '2-3 Bedrooms',
  },
  // ── FORT LAUDERDALE ──
  {
    name: 'Sage Intracoastal Residences',
    address: '2893 E Sunrise Blvd, Fort Lauderdale, FL 33304',
    neighborhood: 'fort lauderdale',
    developer: 'Property Markets Group (PMG)',
    floors: 28,
    totalUnits: 44,
    priceMin: 2000000,
    priceMax: 3500000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Sage Intracoastal Residences is a 28-story boutique tower by PMG on the Intracoastal Waterway in Fort Lauderdale. With just 44 residences, this exclusive development offers panoramic water views and a resort-caliber amenity package.',
    amenities: ['Infinity pool overlooking Intracoastal', 'Private marina', 'Spa and wellness center', 'Fitness center', 'Social lounge', 'Private wine storage', 'Concierge', 'Valet parking'],
    unitTypes: '2-4 Bedrooms',
  },
  {
    name: 'Andare Residences by Pininfarina',
    address: '551 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304',
    neighborhood: 'fort lauderdale',
    developer: 'Kolter Urban',
    architect: 'Pininfarina',
    floors: 45,
    totalUnits: 163,
    priceMin: 2150000,
    priceMax: 8000000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Andare Residences by Pininfarina is a striking 45-story oceanfront tower designed by the legendary Italian design house Pininfarina. Located on Fort Lauderdale Beach, this Kolter Urban development offers 163 residences with Italian-inspired design and unobstructed Atlantic Ocean views.',
    amenities: ['Oceanfront pool deck', 'Spa by Pininfarina', 'Fitness center', 'Social club', 'Private dining room', 'Wine vault', 'Pet grooming spa', 'Electric vehicle charging', 'Beach services'],
    unitTypes: '2-4 Bedrooms, Penthouses',
  },
  {
    name: 'Ombelle Residences',
    address: '525 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304',
    neighborhood: 'fort lauderdale',
    developer: 'Dependable Equities',
    floors: 44,
    totalUnits: 775,
    priceMin: 400000,
    priceMax: 2500000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: 'Ombelle Residences is Fort Lauderdale\'s largest new oceanfront condominium development, offering 775 residences across 44 stories. This ambitious project provides an accessible entry into beachfront living with a vast array of amenities and resort-style services.',
    amenities: ['Oceanfront pool', 'Spa and wellness center', 'Multiple fitness studios', 'Co-working spaces', 'Theater room', 'Children\'s playroom', 'Dog park', 'Tennis courts', 'Beach club'],
    unitTypes: 'Studios, 1-4 Bedrooms',
  },
  {
    name: 'Sereno Fort Lauderdale',
    address: '2900 Riomar St, Fort Lauderdale, FL 33304',
    neighborhood: 'fort lauderdale',
    developer: 'Kolter Urban',
    floors: 14,
    totalUnits: 76,
    priceMin: 1800000,
    priceMax: 5000000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Sereno Fort Lauderdale is a 14-story boutique waterfront condominium offering 76 residences along the Intracoastal Waterway. This Kolter Urban project emphasizes serene waterfront living with spacious layouts and high-end finishes throughout.',
    amenities: ['Waterfront pool', 'Fitness center', 'Yoga studio', 'Kayak launch', 'Social lounge', 'Private storage', 'EV charging'],
    unitTypes: '2-3 Bedrooms, Penthouses',
  },
  {
    name: 'Viceroy Residences Fort Lauderdale',
    address: '3101 Bayshore Dr, Fort Lauderdale, FL 33304',
    neighborhood: 'fort lauderdale',
    developer: 'Related Group, BH Group',
    floors: 45,
    totalUnits: 370,
    priceMin: 600000,
    priceMax: 3000000,
    estCompletion: '2029',
    status: 'PRE_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Viceroy Residences Fort Lauderdale is a 45-story waterfront tower by Related Group and BH Group, bringing the Viceroy hospitality brand to Fort Lauderdale. The development offers 370 residences with full hotel services, a private marina, and panoramic Intracoastal views.',
    amenities: ['Waterfront pool', 'Viceroy spa', 'Fitness center', 'Private marina', 'Restaurant', 'Rooftop bar', 'Business center', 'Concierge', 'Kids club'],
    unitTypes: 'Studios, 1-4 Bedrooms',
  },
  // ── WEST PALM BEACH ──
  {
    name: 'South Flagler House',
    address: '1160 S Flagler Dr, West Palm Beach, FL 33401',
    neighborhood: 'west palm beach',
    developer: 'Related Companies',
    architect: 'Robert A.M. Stern Architects',
    floors: 28,
    totalUnits: 105,
    priceMin: 6000000,
    priceMax: 35000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'ULTRA_LUXURY',
    description: 'South Flagler House is an ultra-luxury waterfront development by Related Companies, designed by Robert A.M. Stern Architects. Rising 28 stories on the Intracoastal Waterway in West Palm Beach, this landmark project offers 105 residences catering to the influx of wealth migrating to Palm Beach County.',
    amenities: ['Waterfront infinity pool', 'Full-service spa', 'Private dining by Jean-Georges', 'Fitness center by Anatomy', 'Marina', 'Wine vault', 'Private gardens', 'Concierge', 'Valet'],
    unitTypes: '2-5 Bedrooms, Penthouses',
  },
  {
    name: 'The Berkeley West Palm Beach',
    address: '300 Banyan Blvd, West Palm Beach, FL 33401',
    neighborhood: 'west palm beach',
    developer: 'Savanna',
    floors: 28,
    totalUnits: 193,
    priceMin: 1200000,
    priceMax: 6000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'The Berkeley is a 28-story luxury condominium in the heart of downtown West Palm Beach. Developed by Savanna, this project offers 193 residences with sweeping views of the Intracoastal Waterway and the Palm Beach skyline, positioned in the rapidly growing financial hub of South Florida.',
    amenities: ['Pool deck with cabanas', 'Fitness center', 'Social lounge', 'Co-working space', 'Dog spa', 'Wine room', 'Private dining', 'EV charging', 'Concierge'],
    unitTypes: '1-4 Bedrooms',
  },
  {
    name: 'Shorecrest West Palm Beach',
    address: '1000 S Flagler Dr, West Palm Beach, FL 33401',
    neighborhood: 'west palm beach',
    developer: 'Rabina Properties',
    architect: 'OMA (Rem Koolhaas)',
    floors: 27,
    totalUnits: 100,
    priceMin: 3500000,
    priceMax: 20000000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'ULTRA_LUXURY',
    description: 'Shorecrest is a landmark 27-story residential tower in West Palm Beach designed by OMA, the firm of Pritzker Prize-winning architect Rem Koolhaas. With a distinctive curvilinear facade, this Rabina Properties development offers 100 ultra-luxury residences overlooking the Intracoastal Waterway.',
    amenities: ['Infinity pool', 'Full spa and wellness center', 'Private beach club', 'Marina access', 'Fine dining restaurant', 'Library lounge', 'Fitness center', 'Children\'s area', '24-hour concierge'],
    unitTypes: '2-5 Bedrooms, Penthouses',
  },
  // ── HOLLYWOOD ──
  {
    name: 'Icon Beach Residences',
    address: '1301 S Ocean Dr, Hollywood, FL 33019',
    neighborhood: 'hollywood',
    developer: 'Related Group, BH Group',
    floors: 37,
    totalUnits: 350,
    priceMin: 825000,
    priceMax: 2600000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: 'Icon Beach Residences is a 37-story oceanfront condominium by Related Group and BH Group on Hollywood Beach. This beachfront tower offers 350 residences with direct ocean views, a full suite of resort-style amenities, and easy access to the iconic Hollywood Beach Broadwalk.',
    amenities: ['Oceanfront pool deck', 'Spa and wellness center', 'Fitness center', 'Beach club', 'Social lounge', 'Children\'s room', 'Business center', 'Concierge', 'Valet parking'],
    unitTypes: '1-3 Bedrooms',
  },
  // ── BOCA RATON ──
  {
    name: 'Glass House Boca Raton',
    address: '298 SE Mizner Blvd, Boca Raton, FL 33432',
    neighborhood: 'boca raton',
    developer: 'Elad National Properties',
    architect: 'Garcia Stromberg',
    floors: 10,
    totalUnits: 28,
    priceMin: 3000000,
    priceMax: 8000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Glass House Boca Raton is the first modern glass condominium in downtown Boca Raton. With only 28 luxury residences across 10 stories, this Elad National Properties development offers expansive layouts from 2,550 to 3,990 square feet overlooking Lake Boca Raton and the Intracoastal.',
    amenities: ['Rooftop pool and sky lounge', 'Fitness center', 'Wine room', 'Private storage', 'EV charging', 'Concierge'],
    unitTypes: '2-4 Bedrooms',
  },
  {
    name: 'Boca Beach House',
    address: '2150 N Ocean Blvd, Boca Raton, FL 33431',
    neighborhood: 'boca raton',
    developer: 'Penn-Florida Companies',
    floors: 5,
    totalUnits: 32,
    priceMin: 2500000,
    priceMax: 7000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Boca Beach House features 32 expansive flow-through residences set within a lushly landscaped 3.2-acre property overlooking Lake Boca Raton. This boutique oceanfront community offers a rare combination of beachside living with spacious layouts and a private club-like atmosphere.',
    amenities: ['Oceanfront pool', 'Private beach access', 'Fitness center', 'Social room', 'Landscaped gardens', 'Secure parking'],
    unitTypes: '2-3 Bedrooms',
  },
  {
    name: 'Onix Delray Beach',
    address: '105 SE 1st Ave, Delray Beach, FL 33444',
    neighborhood: 'boca raton',
    developer: 'Savanna Fund',
    floors: 4,
    totalUnits: 26,
    priceMin: 1569000,
    priceMax: 3200000,
    estCompletion: '2028',
    status: 'PRE_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Onix Delray Beach is a boutique 4-story condominium offering 26 luxury residences in the vibrant heart of downtown Delray Beach. This intimate development features thoughtfully designed layouts with premium finishes and walkable access to Atlantic Avenue\'s renowned dining and shopping scene.',
    amenities: ['Rooftop pool', 'Fitness center', 'Social lounge', 'Private storage', 'Secure parking'],
    unitTypes: '2-3 Bedrooms',
  },
  // ── WYNWOOD / EDGEWATER ADDITIONS ──
  {
    name: 'Alchemy Wynwood Residences',
    address: '18 NW 23rd St, Miami, FL 33127',
    neighborhood: 'wynwood',
    developer: 'Alchemy-ABR Investment Partners',
    architect: 'Arquitectonica',
    floors: 12,
    totalUnits: 186,
    priceMin: 500000,
    priceMax: 1500000,
    estCompletion: '2029',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: 'Alchemy Wynwood Residences is a 12-story development bringing 186 luxury residences to the heart of the Wynwood Arts District. Designed by Arquitectonica with 13,500 sq ft of ground-floor retail, this project captures the creative energy of one of Miami\'s most dynamic neighborhoods.',
    amenities: ['Rooftop pool and deck', 'Fitness center', 'Coworking spaces', 'Art gallery', 'Retail promenade', 'Dog park', 'Bicycle storage', 'Package lockers'],
    unitTypes: 'Studios, 1-3 Bedrooms',
  },
  {
    name: 'Edgewater 36',
    address: '2600 NE 2nd Ave, Miami, FL 33137',
    neighborhood: 'edgewater',
    developer: 'Black Salmon, TSG',
    architect: 'Arquitectonica',
    floors: 36,
    totalUnits: 229,
    priceMin: 700000,
    priceMax: 2500000,
    estCompletion: '2029',
    status: 'PRE_CONSTRUCTION',
    category: 'PREMIUM',
    description: 'Edgewater 36 is a striking 36-story tower in Miami\'s Edgewater neighborhood featuring a unique diagrid structural design by Arquitectonica. Developed by Black Salmon and TSG, this 229-unit project includes ground-floor retail and panoramic views of Biscayne Bay.',
    amenities: ['Pool deck with bay views', 'Fitness center', 'Spa', 'Social lounge', 'Co-working space', 'Dog park', 'Bicycle storage', 'EV charging'],
    unitTypes: '1-3 Bedrooms',
  },
  // ── MORE FORT LAUDERDALE ──
  {
    name: 'Riva Residenze',
    address: '1110 SE 3rd Ave, Fort Lauderdale, FL 33316',
    neighborhood: 'fort lauderdale',
    developer: 'Riva Development',
    floors: 7,
    totalUnits: 36,
    priceMin: 3000000,
    priceMax: 9000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Riva Residenze is a yacht-inspired luxury development in Fort Lauderdale offering 36 single-family home-sized residences. Each unit features private elevator entry, oversized terraces, and views of the New River, capturing the nautical lifestyle Fort Lauderdale is renowned for.',
    amenities: ['Waterfront pool', 'Private boat slips', 'Fitness center', 'Social club', 'Private storage', 'Concierge'],
    unitTypes: '3-4 Bedrooms',
  },
  {
    name: 'Bungalow East Residences',
    address: '2500 E Las Olas Blvd, Fort Lauderdale, FL 33301',
    neighborhood: 'fort lauderdale',
    developer: 'Stiles Corporation',
    floors: 5,
    totalUnits: 24,
    priceMin: 2000000,
    priceMax: 5000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'Bungalow East Residences is a boutique 5-story condominium on East Las Olas Boulevard offering 24 luxury residences. This Stiles Corporation project provides an intimate, neighborhood-scale development with walkable access to Fort Lauderdale\'s premier dining and shopping corridor.',
    amenities: ['Rooftop pool', 'Fitness center', 'Social room', 'Secure parking', 'Bicycle storage'],
    unitTypes: '2-3 Bedrooms',
  },
  // ── ADDITIONAL PROJECTS FROM SEARCH RESULTS ──
  {
    name: 'La Baia North',
    address: '9201 E Bay Harbor Dr, Bay Harbor Islands, FL 33154',
    neighborhood: 'bay harbor islands',
    developer: 'Château Group',
    floors: 8,
    totalUnits: 57,
    priceMin: 1500000,
    priceMax: 5000000,
    estCompletion: '2027',
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY',
    description: 'La Baia North is the newest phase of the La Baia waterfront community in Bay Harbor Islands by Château Group. This 8-story building features 57 ultra-luxury residences with direct waterfront access, continuing the success of the original La Baia development.',
    amenities: ['Waterfront pool', 'Private marina', 'Spa', 'Fitness center', 'Club room', 'Children\'s area', 'Concierge'],
    unitTypes: '2-4 Bedrooms',
  },
];

// ── Geocoding ──────────────────────────────────────────────────────
async function geocode(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
    return null;
  } catch (e) {
    console.error(`Geocode failed for ${address}:`, e);
    return null;
  }
}

// ── Generate simple rectangular footprint ──────────────────────────
function generateFootprint(lat: number, lng: number, floors: number): object {
  const size = Math.min(0.0003, 0.0001 + floors * 0.000003);
  const halfW = size / 2;
  const halfH = size / 2.5;
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - halfW, lat - halfH],
      [lng + halfW, lat - halfH],
      [lng + halfW, lat + halfH],
      [lng - halfW, lat + halfH],
      [lng - halfW, lat - halfH],
    ]],
  };
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Fetching existing projects and neighborhoods...');

  // Get existing projects
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('name, slug');
  const existingSlugs = new Set((existingProjects || []).map(p => p.slug));
  const existingNames = new Set((existingProjects || []).map(p => p.name.toLowerCase()));

  // Get neighborhoods
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, slug');
  const hoodMap = new Map((neighborhoods || []).map(n => [n.slug, n.id]));

  // Get developers
  const { data: developers } = await supabase
    .from('developers')
    .select('id, name, slug');
  const devMap = new Map((developers || []).map(d => [d.slug, d.id]));
  const devNameMap = new Map((developers || []).map(d => [d.name.toLowerCase(), d.id]));

  let added = 0;
  let skipped = 0;

  for (const project of NEW_PROJECTS) {
    const slug = slugify(project.name);

    // Deduplicate
    if (existingSlugs.has(slug) || existingNames.has(project.name.toLowerCase())) {
      console.log(`⏭️  Skip (exists): ${project.name}`);
      skipped++;
      continue;
    }

    // Resolve neighborhood
    const hoodSlug = NEIGHBORHOOD_SLUGS[project.neighborhood.toLowerCase()];
    const neighborhoodId = hoodSlug ? hoodMap.get(hoodSlug) : null;

    // Resolve or create developer
    const devSlug = slugify(project.developer);
    let developerId = devMap.get(devSlug) || devNameMap.get(project.developer.toLowerCase()) || null;

    if (!developerId && project.developer) {
      console.log(`  🏢 Creating developer: ${project.developer}`);
      const { data: newDev, error: devErr } = await supabase
        .from('developers')
        .upsert({
          name: project.developer,
          slug: devSlug,
        }, { onConflict: 'slug' })
        .select('id')
        .single();
      if (newDev) {
        developerId = newDev.id;
        devMap.set(devSlug, newDev.id);
      } else if (devErr) {
        // Try to fetch it
        const { data: existing } = await supabase
          .from('developers')
          .select('id')
          .eq('slug', devSlug)
          .single();
        if (existing) developerId = existing.id;
      }
    }

    // Geocode
    console.log(`  📍 Geocoding: ${project.name}...`);
    const coords = await geocode(project.address);
    if (!coords) {
      console.log(`  ⚠️  Could not geocode ${project.name}, skipping`);
      continue;
    }

    // Generate footprint
    const footprint = generateFootprint(coords.lat, coords.lng, project.floors);

    // Upsert project
    const { error } = await supabase.from('projects').upsert({
      name: project.name,
      slug,
      address: project.address,
      neighborhoodId,
      developerId,
      architect: project.architect || null,
      status: project.status,
      estCompletion: project.estCompletion,
      totalUnits: project.totalUnits,
      floors: project.floors,
      priceMin: project.priceMin || null,
      priceMax: project.priceMax || null,
      description: project.description,
      amenities: project.amenities,
      category: project.category,
      unitTypes: project.unitTypes || null,
      latitude: coords.lat,
      longitude: coords.lng,
      footprint,
      featured: false,
    }, { onConflict: 'slug' });

    if (error) {
      console.error(`  ❌ Error upserting ${project.name}:`, error.message);
    } else {
      console.log(`  ✅ Added: ${project.name} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`);
      added++;
      existingSlugs.add(slug);
    }

    // Rate limit geocoding
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n📊 Results: ${added} added, ${skipped} skipped (already existed)`);
  console.log(`Total projects now: ${(existingProjects?.length || 0) + added}`);
}

main().catch(console.error);
