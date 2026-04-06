/**
 * CondoWizard.ca — Comprehensive Seed Script
 *
 * Seeds neighborhoods, developers, projects, geocodes, SEO descriptions,
 * blog posts, and an admin user into Supabase.
 *
 * Usage: node scripts/seed-all.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// ─── Helpers ────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^=\s#]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateId() {
  return crypto.randomUUID().replace(/-/g, '');
}

function parsePrice(priceStr) {
  if (!priceStr || priceStr === '--' || priceStr === 'TBD' || priceStr === 'N/A') return null;
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  if (!cleaned) return null;
  const num = parseFloat(cleaned);
  if (priceStr.toLowerCase().includes('m') && num < 1000) return Math.round(num * 1_000_000);
  if (priceStr.toLowerCase().includes('k') && num < 100_000) return Math.round(num * 1000);
  return Math.round(num);
}

function parseStatus(status) {
  const s = (status || '').toLowerCase().trim();
  if (s.includes('pre-launch') || s.includes('pre launch')) return 'PRE_LAUNCH';
  if (s.includes('near completion') || s.includes('nearly complete')) return 'NEAR_COMPLETION';
  if (s.includes('under construction')) return 'UNDER_CONSTRUCTION';
  if (s.includes('completed') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

function parseCategory(cat) {
  const c = (cat || '').toLowerCase().trim();
  if (c.includes('ultra')) return 'ULTRA_LUXURY';
  if (c.includes('branded')) return 'LUXURY_BRANDED';
  if (c.includes('affordable')) return 'AFFORDABLE_LUXURY';
  if (c.includes('premium')) return 'PREMIUM';
  if (c.includes('luxury')) return 'LUXURY';
  return 'PREMIUM';
}

function generateFootprint(lat, lng, floors) {
  const mPerDegLat = 111320;
  const mPerDegLng = 111320 * Math.cos((lat * Math.PI) / 180);
  let w, h;
  if (floors >= 60) { w = 50; h = 30; }
  else if (floors >= 40) { w = 40; h = 25; }
  else if (floors >= 20) { w = 30; h = 20; }
  else { w = 20; h = 15; }
  const dLat = h / 2 / mPerDegLat;
  const dLng = w / 2 / mPerDegLng;
  return {
    type: 'Polygon',
    coordinates: [[
      [lng - dLng, lat - dLat],
      [lng + dLng, lat - dLat],
      [lng + dLng, lat + dLat],
      [lng - dLng, lat + dLat],
      [lng - dLng, lat - dLat],
    ]],
  };
}

// ─── Anthropic API helper ───────────────────────────────────────────────────

async function callAnthropic(prompt, maxTokens = 2048) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text || '';
}

// ─── Stats tracker ──────────────────────────────────────────────────────────

const stats = {
  neighborhoods: 0,
  developers: 0,
  projects: 0,
  geocoded: 0,
  seoGenerated: 0,
  blogPosts: 0,
  adminUser: false,
};

// ═════════════════════════════════════════════════════════════════════════════
// STEP 1: Seed Neighborhoods
// ═════════════════════════════════════════════════════════════════════════════

const NEIGHBORHOODS = [
  {
    name: 'Downtown Core',
    slug: 'downtown-core',
    region: 'Toronto',
    displayOrder: 1,
    avgPriceStudio: 550000,
    avgPrice1br: 700000,
    avgPrice2br: 1100000,
    avgPrice3br: 1800000,
    description: `Toronto's financial and cultural heart centered around the Financial District, PATH underground network, Union Station, and the waterfront. Home to the CN Tower, Rogers Centre, and the Scotiabank Arena, the Downtown Core is the most densely developed area in the country, with a skyline that continues to transform year after year. Bay Street's towers house the headquarters of Canada's largest banks, while the surrounding streets pulse with energy from morning commuters to late-night theatre crowds along King Street.

The neighbourhood offers unparalleled transit connectivity. Union Station serves as the hub for the TTC subway (Lines 1 and 2), GO Transit commuter rail to every corner of the GTA, and the UP Express to Pearson Airport. The PATH system connects over 30 kilometres of underground shopping and walkways, making it possible to live, work, and shop without stepping outside during Toronto's coldest months.

Pre-construction activity in the Downtown Core remains intense, with dozens of towers in various stages of development. Buyers here are typically professionals, investors, and newcomers to Canada who value walkability and proximity to employment centres. Prices reflect the premium of being at the absolute centre of Canada's largest city, though studios and one-bedrooms remain the most accessible entry points into this market.`,
  },
  {
    name: 'King West',
    slug: 'king-west',
    region: 'Toronto',
    displayOrder: 2,
    avgPriceStudio: 600000,
    avgPrice1br: 750000,
    avgPrice2br: 1200000,
    avgPrice3br: 2000000,
    description: `King West is one of Toronto's trendiest neighbourhoods, stretching along King Street West from University Avenue to Dufferin Street. Once a garment manufacturing district, it has reinvented itself as the city's premier dining, nightlife, and entertainment destination. The stretch between Bathurst and Spadina is packed with some of the best restaurants in the city, rooftop bars, boutique hotels, and a thriving arts scene anchored by TIFF Bell Lightbox and the Royal Alexandra Theatre.

Transit access is strong, with the 504 King streetcar providing a direct east-west connection and St. Andrew station on Line 1 at the eastern edge. The neighbourhood is highly walkable, with a Walk Score consistently above 95. Cycling infrastructure along Richmond and Adelaide provides additional commuting options for residents.

Pre-construction condos in King West command a premium thanks to the lifestyle factor. Projects here tend to be mid-rise to tall towers with design-forward aesthetics, appealing to young professionals and couples who want to be in the middle of the action.`,
  },
  {
    name: 'Liberty Village',
    slug: 'liberty-village',
    region: 'Toronto',
    displayOrder: 3,
    avgPriceStudio: 500000,
    avgPrice1br: 650000,
    avgPrice2br: 950000,
    avgPrice3br: 1400000,
    description: `Liberty Village is a self-contained urban community nestled south of King Street West between Dufferin Street and Strachan Avenue. Built on the grounds of a former industrial park, the neighbourhood retains its red-brick heritage character while embracing a modern, tech-forward identity. It has become a hub for creative agencies, tech startups, and media companies, giving it a youthful, entrepreneurial energy.

Transit has historically been Liberty Village's biggest challenge, but the arrival of the Ontario Line and improvements to the Exhibition GO station have significantly improved connectivity. The 504 King streetcar runs along the northern edge, and the Gardiner Expressway provides quick vehicle access to downtown and the western suburbs.

Pre-construction pricing in Liberty Village is more accessible than neighbouring King West or CityPlace, making it a popular entry point for first-time buyers and investors. The community has a strong social fabric, with farmers' markets, outdoor festivals, and a dog-friendly culture.`,
  },
  {
    name: 'Queen West',
    slug: 'queen-west',
    region: 'Toronto',
    displayOrder: 4,
    avgPriceStudio: 520000,
    avgPrice1br: 680000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: `Queen West has long been regarded as one of Canada's most creative and culturally significant streets. Stretching from University Avenue westward through the Art & Design District, Ossington, and into Parkdale, Queen West was once named one of the world's coolest neighbourhoods by Vogue. The strip is home to independent boutiques, vintage shops, the Museum of Contemporary Art (MOCA), Drake Hotel, and Gladstone House.

The neighbourhood is served by the 501 Queen streetcar, one of the longest streetcar routes in North America, and is within walking distance of Osgoode and St. Patrick stations on Line 1. Trinity Bellwoods Park serves as the social heart of the area.

Development along Queen West has been measured compared to the tower-heavy corridors to the south and east, with a mix of mid-rise projects and boutique condos that respect the low-rise streetscape. Buyers here tend to prioritize character and lifestyle over square footage.`,
  },
  {
    name: 'Yorkville',
    slug: 'yorkville',
    region: 'Toronto',
    displayOrder: 5,
    avgPriceStudio: 800000,
    avgPrice1br: 1200000,
    avgPrice2br: 2500000,
    avgPrice3br: 4000000,
    description: `Yorkville is Toronto's most prestigious residential address, a luxury enclave centred around Bloor Street between Avenue Road and Yonge Street. Home to flagship stores from Chanel, Hermes, Louis Vuitton, and Tiffany, as well as the Hazelton Hotel, the Royal Ontario Museum, and some of the city's finest dining establishments, Yorkville represents the pinnacle of upscale Toronto living.

Transit is excellent, with Bay and Bloor-Yonge stations providing connections across the entire TTC subway network. The neighbourhood is steps from the University of Toronto's St. George campus and the Royal Conservatory of Music. The annual Toronto International Film Festival transforms the area each September.

Pre-construction in Yorkville is defined by ultra-luxury projects with premium finishes, concierge services, and price points that rival the most expensive markets in North America. Buyers here are high-net-worth individuals, empty nesters downsizing from Rosedale or Forest Hill estates, and international purchasers seeking a blue-chip Toronto address.`,
  },
  {
    name: 'The Annex',
    slug: 'the-annex',
    region: 'Toronto',
    displayOrder: 6,
    avgPriceStudio: 480000,
    avgPrice1br: 640000,
    avgPrice2br: 950000,
    avgPrice3br: 1400000,
    description: `The Annex is one of Toronto's most established and intellectually vibrant neighbourhoods, bounded roughly by Bloor Street to the south, Dupont to the north, Bathurst to the west, and Avenue Road to the east. Its tree-lined streets are home to beautifully preserved Victorian and Edwardian houses, while Bloor Street offers an eclectic mix of bookshops, independent restaurants, and music venues like Lee's Palace.

The neighbourhood is anchored by the University of Toronto, giving it a youthful academic energy. Spadina and Bathurst stations on Line 2 provide easy subway access, and the area is exceptionally bike-friendly with dedicated lanes along Bloor Street. The Bata Shoe Museum and Hot Docs Ted Rogers Cinema make The Annex a cultural destination.

Pre-construction development in The Annex is limited by heritage protections and low-rise zoning on residential streets, which keeps supply tight and values stable. New projects tend to cluster along Bloor and Dupont, offering boutique-scale condos that appeal to academics, professionals, and downsizers.`,
  },
  {
    name: 'Midtown',
    slug: 'midtown',
    region: 'Toronto',
    displayOrder: 7,
    avgPriceStudio: 500000,
    avgPrice1br: 670000,
    avgPrice2br: 1050000,
    avgPrice3br: 1600000,
    description: `Midtown Toronto generally refers to the area between St. Clair Avenue and Eglinton Avenue, centred along Yonge Street. It encompasses established residential enclaves like Deer Park, Summerhill, and Moore Park, offering a more relaxed pace of life than the downtown core while remaining thoroughly urban. The neighbourhood is popular with families and professionals.

Transit is a defining feature of Midtown, with St. Clair, Summerhill, Rosedale, and Davisville stations on Line 1 providing quick subway access to downtown in under 15 minutes. The St. Clair streetcar connects east and west, and the Eglinton Crosstown LRT has added a major new rapid transit line along the northern boundary. GO Transit's Leaside and Oriole stations are also nearby.

Pre-construction in Midtown focuses on the Yonge Street corridor, where planning permissions allow for taller buildings amid the otherwise low-rise residential fabric. Projects here attract move-up buyers, empty nesters, and young families who want top-ranked schools and green space without sacrificing urban convenience.`,
  },
  {
    name: 'Yonge & Eglinton',
    slug: 'yonge-eglinton',
    region: 'Toronto',
    displayOrder: 8,
    avgPriceStudio: 490000,
    avgPrice1br: 650000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: `Yonge and Eglinton, affectionately known as "Young and Eligible," is one of Toronto's most active development nodes. The intersection has become a forest of construction cranes, with dozens of towers reshaping the skyline of this midtown hub. The neighbourhood combines the energy of a secondary downtown with the residential charm of the surrounding tree-lined streets.

The area is a transit powerhouse. Eglinton station on Line 1 sits at the intersection, and the Eglinton Crosstown LRT now provides rapid east-west service stretching from Mount Dennis to Kennedy station. This connectivity has been a major catalyst for development and property values.

Buyers at Yonge and Eglinton are drawn by the neighbourhood's completeness: excellent dining along Yonge Street, proximity to the Yonge Eglinton Centre, access to Eglinton Park and Sherwood Park, and some of the best public and private schools in the city.`,
  },
  {
    name: 'North York',
    slug: 'north-york',
    region: 'Toronto',
    displayOrder: 9,
    avgPriceStudio: 420000,
    avgPrice1br: 560000,
    avgPrice2br: 800000,
    avgPrice3br: 1200000,
    description: `North York is a vast former municipality stretching across the northern portion of Toronto, with its urban core centred around the Yonge Street corridor between Sheppard Avenue and Finch Avenue. The North York City Centre, anchored by Mel Lastman Square and the Toronto Centre for the Arts, functions as a secondary downtown.

Transit infrastructure is excellent along the Yonge corridor, with Finch, North York Centre, Sheppard-Yonge, and several other Line 1 stations providing direct subway service to downtown in 25-30 minutes. The Sheppard Line (Line 4) extends eastward toward Don Mills. Highway 401 provides vehicle access to all corners of the GTA.

Pre-construction in North York offers some of the best value in the city, with prices significantly below downtown while still providing genuine urban density and walkability along the Yonge corridor. The area attracts a diverse mix of buyers including newcomers, families seeking more space, and investors targeting the strong rental market.`,
  },
  {
    name: 'Scarborough',
    slug: 'scarborough',
    region: 'Toronto',
    displayOrder: 10,
    avgPriceStudio: 380000,
    avgPrice1br: 490000,
    avgPrice2br: 700000,
    avgPrice3br: 1000000,
    description: `Scarborough is Toronto's eastern borough, a sprawling and culturally diverse area stretching from Victoria Park Avenue to the Rouge River. It is home to the Scarborough Bluffs, a dramatic geological formation rising 65 metres above Lake Ontario, and Rouge National Urban Park. Scarborough Town Centre serves as the commercial hub.

Transit is evolving rapidly. Line 2 currently terminates at Kennedy station, and the Eglinton Crosstown LRT's eastern terminus at Kennedy improves east-west connectivity. GO Transit's Rouge Hill, Guildwood, and Scarborough stations provide commuter rail service along the Lakeshore East line.

Pre-construction in Scarborough represents some of the most affordable new-build opportunities in the City of Toronto. The borough's incredible culinary diversity, natural beauty, and improving transit make it increasingly attractive to first-time buyers and investors looking for growth potential.`,
  },
  {
    name: 'Etobicoke',
    slug: 'etobicoke',
    region: 'Toronto',
    displayOrder: 11,
    avgPriceStudio: 400000,
    avgPrice1br: 530000,
    avgPrice2br: 780000,
    avgPrice3br: 1100000,
    description: `Etobicoke is Toronto's western borough, encompassing diverse communities from the lakefront to the northern reaches of the city along the Humber River valley. Key centres include the Queensway corridor, Mimico, Humber Bay Shores, Islington-City Centre West, and the residential enclaves of Kingsway and Princess Margaret.

Transit options include Line 2's western terminus at Kipling station, stations at Royal York, Old Mill, and Islington, and GO Transit's Lakeshore West line with stops at Mimico and Long Branch. The Gardiner Expressway and Highway 427 provide vehicle access to downtown and Pearson Airport.

Humber Bay Shores has emerged as one of the GTA's most active pre-construction markets, offering waterfront living with skyline views at prices well below the downtown core. The borough's lakeside parks provide green space and cycling trails that add significant lifestyle value.`,
  },
  {
    name: 'Leaside',
    slug: 'leaside',
    region: 'Toronto',
    displayOrder: 12,
    avgPriceStudio: 500000,
    avgPrice1br: 680000,
    avgPrice2br: 1050000,
    avgPrice3br: 1600000,
    description: `Leaside is one of Toronto's most coveted family neighbourhoods, a leafy residential enclave east of Yonge Street defined by its excellent schools, safe streets, and strong community spirit. Originally developed as a planned garden suburb in the 1920s, Leaside features well-maintained bungalows and a charming commercial strip along Bayview Avenue.

The neighbourhood sits adjacent to the sprawling Leaside ravine system, offering hiking and cycling trails that connect to the Don Valley trail network. Leaside station on the future Ontario Line will dramatically improve rapid transit access. GO Transit's Leaside station on the Barrie line provides commuter rail service.

Pre-construction opportunities in Leaside proper are limited due to its predominantly low-rise residential character, but developments along the Laird Drive industrial corridor are bringing new condo inventory to the area.`,
  },
  {
    name: 'Leslieville',
    slug: 'leslieville',
    region: 'Toronto',
    displayOrder: 13,
    avgPriceStudio: 470000,
    avgPrice1br: 620000,
    avgPrice2br: 900000,
    avgPrice3br: 1350000,
    description: `Leslieville is a vibrant east-end neighbourhood stretching along Queen Street East from the Don River to Greenwood Avenue. Once a working-class industrial area, Leslieville has undergone a dramatic transformation into one of Toronto's most desirable communities for young families and creatives. The main strip is lined with independent coffee shops, brunch spots, and design showrooms.

Transit access is provided by the 501 Queen streetcar with connections to Broadview subway station on Line 2. The neighbourhood is highly bikeable, with the Martin Goodman Trail along the waterfront accessible via a short ride south. Greenwood Park and Ashbridges Bay provide ample green space.

Pre-construction in Leslieville is primarily mid-rise. The Unilever precinct and surrounding former industrial lands to the south are being transformed into a massive mixed-use community. Leslieville appeals to buyers who want a neighbourhood with genuine personality and an east-end lifestyle.`,
  },
  {
    name: 'Riverside',
    slug: 'riverside',
    region: 'Toronto',
    displayOrder: 14,
    avgPriceStudio: 480000,
    avgPrice1br: 640000,
    avgPrice2br: 930000,
    avgPrice3br: 1400000,
    description: `Riverside is a compact, character-rich neighbourhood east of the Don River, centred along Queen Street East between the Don Valley and Broadview Avenue. It is home to some of Toronto's most acclaimed dining establishments and is anchored culturally by the Broadview Hotel.

The neighbourhood benefits from excellent transit, with Broadview station on Line 2 at its doorstep and the 501 Queen and 504 King streetcars running through. The Don Valley trail system is immediately accessible. The planned East Harbour transit hub will bring Ontario Line, GO Transit, and SmartTrack service.

Pre-construction interest in Riverside has surged as buyers recognize its proximity to downtown, authentic neighbourhood feel, and the transformative impact of the East Harbour development.`,
  },
  {
    name: 'Danforth',
    slug: 'danforth',
    region: 'Toronto',
    displayOrder: 15,
    avgPriceStudio: 440000,
    avgPrice1br: 580000,
    avgPrice2br: 850000,
    avgPrice3br: 1250000,
    description: `The Danforth is one of Toronto's great neighbourhood streets, stretching along Danforth Avenue from Broadview to Victoria Park. Known historically as Greektown for its concentration of Greek restaurants and bakeries, the Danforth has evolved into a multicultural, family-friendly corridor with the annual Taste of the Danforth festival.

Transit access is superb, with Line 2 running directly beneath Danforth Avenue and stations at Broadview, Chester, Pape, Donlands, Greenwood, Coxwell, and Woodbine. This gives residents direct subway access to downtown and connections across the city.

Pre-construction along the Danforth is gaining momentum as city planning encourages gentle density along transit corridors. Projects tend to be mid-rise buildings concentrated near subway stations, attracting families and first-time buyers who want Line 2 subway access at prices below the downtown core.`,
  },
  {
    name: 'High Park',
    slug: 'high-park',
    region: 'Toronto',
    displayOrder: 16,
    avgPriceStudio: 470000,
    avgPrice1br: 630000,
    avgPrice2br: 920000,
    avgPrice3br: 1350000,
    description: `High Park is one of Toronto's most beloved neighbourhoods, defined by its proximity to the 161-hectare High Park, the city's largest public park featuring hiking trails, Grenadier Pond, a free zoo, and the famous cherry blossoms that draw thousands each spring.

The neighbourhood is well-connected by transit, with High Park and Keele stations on Line 2, and the 501 Queen and 504 King streetcars along the southern edges. The Gardiner Expressway is accessible for drivers, and the Martin Goodman Trail connects to the park's trail network.

Pre-construction in the High Park area tends to be concentrated along Bloor Street West and the Junction Triangle to the north. The neighbourhood appeals to families, nature lovers, and anyone who prioritizes green space and outdoor recreation.`,
  },
  {
    name: 'Junction',
    slug: 'junction',
    region: 'Toronto',
    displayOrder: 17,
    avgPriceStudio: 450000,
    avgPrice1br: 590000,
    avgPrice2br: 870000,
    avgPrice3br: 1300000,
    description: `The Junction is a resurgent west-end neighbourhood centred around the intersection of Dundas Street West and Keele Street. Once a dry municipality that prohibited alcohol sales until 1998, The Junction has since blossomed into one of Toronto's most exciting food and drink destinations, with craft breweries and independent restaurants lining Dundas West.

Transit access includes Dundas West station on Line 2 and the UP Express to Pearson Airport. The West Toronto Railpath, a popular linear park built on a former rail corridor, provides cycling connectivity. Bus routes connect to surrounding neighbourhoods.

Pre-construction in The Junction and Junction Triangle has accelerated rapidly, with numerous mid-rise and tall projects. The neighbourhood offers strong value compared to King West and Queen West, while delivering a similarly vibrant street-level experience.`,
  },
  {
    name: 'Roncesvalles',
    slug: 'roncesvalles',
    region: 'Toronto',
    displayOrder: 18,
    avgPriceStudio: 490000,
    avgPrice1br: 650000,
    avgPrice2br: 960000,
    avgPrice3br: 1450000,
    description: `Roncesvalles, known locally as "Roncy," is a charming residential neighbourhood stretching along Roncesvalles Avenue from Queen Street West to Bloor Street. With its Polish bakeries, independent bookshops, cozy cafes, and the revitalized Revue Cinema, Roncesvalles has a distinctly European village atmosphere.

The 504 King streetcar runs the length of Roncesvalles Avenue, connecting residents to King West and the downtown core, while Dundas West station on Line 2 and the UP Express sit at the northern end. High Park is steps away to the west, and the Martin Goodman waterfront trail is accessible to the south.

Pre-construction opportunities in Roncesvalles are rare, as the neighbourhood's low-rise residential character is protected by local planning policies. This scarcity supports strong resale values and makes Roncesvalles one of the most stable residential markets in Toronto.`,
  },
  {
    name: 'Waterfront',
    slug: 'waterfront',
    region: 'Toronto',
    displayOrder: 19,
    avgPriceStudio: 530000,
    avgPrice1br: 700000,
    avgPrice2br: 1050000,
    avgPrice3br: 1650000,
    description: `Toronto's Waterfront stretches along the Lake Ontario shoreline from Humber Bay in the west through the central harbour to the Port Lands in the east. This is one of the largest urban waterfront revitalization projects in the world, guided by Waterfront Toronto. Sugar Beach, HTO Park, and Sherbourne Common have established the area as a major public amenity.

Transit along the waterfront includes the 509 and 510 streetcar routes connecting to Union Station, with the future Waterfront LRT planned to improve east-west connectivity. Union Station provides connections to the TTC subway, GO Transit, and the UP Express.

Pre-construction on the waterfront is booming, with major projects at Quayside, East Bayfront, and Bayside. Buyers are attracted by unobstructed lake views, proximity to the Toronto Islands, and the sense of living in a neighbourhood purpose-built for the 21st century.`,
  },
  {
    name: 'CityPlace',
    slug: 'cityplace',
    region: 'Toronto',
    displayOrder: 20,
    avgPriceStudio: 480000,
    avgPrice1br: 620000,
    avgPrice2br: 900000,
    avgPrice3br: 1350000,
    description: `CityPlace is a master-planned community of residential towers built on former railway lands between Bathurst Street and Strachan Avenue, south of Front Street. Developed primarily by Concord Adex, the community has grown into a dense neighbourhood of over 20 towers housing tens of thousands of residents. Canoe Landing Park provides playgrounds, sports fields, and public art.

Transit access is good, with Bathurst and Spadina streetcars connecting to the subway, and the 509 and 510 Harbourfront streetcars. Union Station is a short streetcar ride east. The Bentway, an innovative public space beneath the Gardiner Expressway, has added a major amenity.

CityPlace has matured significantly, with improved retail, schools, and community facilities. Pre-construction pricing remains competitive relative to the downtown core, making it attractive to young professionals, investors, and newcomers.`,
  },
  {
    name: 'Fort York',
    slug: 'fort-york',
    region: 'Toronto',
    displayOrder: 21,
    avgPriceStudio: 510000,
    avgPrice1br: 670000,
    avgPrice2br: 980000,
    avgPrice3br: 1500000,
    description: `Fort York is a rapidly evolving neighbourhood adjacent to CityPlace, centred around the historic Fort York National Historic Site, one of Toronto's most significant heritage landmarks. The Bentway, a 1.75-kilometre public space beneath the Gardiner Expressway, has added cultural and recreational infrastructure.

Transit options include the Bathurst streetcar, the 509 Harbourfront route, and proximity to both Bathurst station on Line 2 and Union Station via a short streetcar ride. The Exhibition GO station is a short walk west.

Pre-construction in Fort York continues at a brisk pace, with newer buildings featuring improved design standards and larger suite layouts. Buyers are attracted by the central location, historic character, proximity to the waterfront, and improving neighbourhood amenities.`,
  },
  {
    name: 'Canary District',
    slug: 'canary-district',
    region: 'Toronto',
    displayOrder: 22,
    avgPriceStudio: 520000,
    avgPrice1br: 680000,
    avgPrice2br: 1000000,
    avgPrice3br: 1500000,
    description: `The Canary District is a purpose-built neighbourhood in Toronto's West Don Lands, originally constructed as the Athletes' Village for the 2015 Pan American Games. The result is one of Toronto's most thoughtfully designed new communities, with wide sidewalks, generous parks, and a mix of building types.

Transit access is solid and improving. The neighbourhood is within walking distance of the Distillery District and the 504 King streetcar. The future East Harbour transit hub will bring Ontario Line, GO Transit, and SmartTrack service. The Don Valley trail system is immediately accessible.

Buyers appreciate the modern urban planning, sustainability features, proximity to the Distillery District, and the area's strong growth trajectory as East Harbour transforms into a major employment and transit hub. Corktown Common serves as the neighbourhood's green heart.`,
  },
  {
    name: 'Port Lands',
    slug: 'port-lands',
    region: 'Toronto',
    displayOrder: 23,
    avgPriceStudio: 500000,
    avgPrice1br: 660000,
    avgPrice2br: 970000,
    avgPrice3br: 1450000,
    description: `The Port Lands is Toronto's most ambitious urban development frontier, an 800-acre expanse of former industrial waterfront land east of the downtown core. The centrepiece is the Port Lands Flood Protection Project, which is creating a new mouth for the Don River and building Villiers Island, a new neighbourhood surrounded by water.

Future transit plans include extensions of the waterfront streetcar network and potential connections to the Ontario Line and East Harbour transit hub. The East Harbour development immediately to the north will serve as the transit gateway to the Port Lands.

Pre-construction in the Port Lands is in its earliest stages, with Villiers Island expected to deliver its first residential phases in the coming years. This is a long-term investment opportunity for buyers who want to get in on what will be one of North America's most significant waterfront communities.`,
  },
  {
    name: 'Mississauga',
    slug: 'mississauga',
    region: 'GTA',
    displayOrder: 24,
    avgPriceStudio: 400000,
    avgPrice1br: 530000,
    avgPrice2br: 750000,
    avgPrice3br: 1050000,
    description: `Mississauga is the GTA's largest suburb and Canada's sixth-largest city, with a rapidly urbanizing downtown core centred around Square One Shopping Centre, Celebration Square, and the Mississauga Civic Centre. The area around Square One is now home to a growing cluster of residential towers transforming the city's identity.

Transit is improving significantly with the Hurontario LRT (Hazel McCallion Line) connecting Port Credit to Brampton Gateway Terminal. GO Transit's Lakeshore West and Milton lines provide commuter rail service. Highway 403, the QEW, and Highway 401 provide vehicle access, while Pearson Airport sits at the northeastern boundary.

Pre-construction in Mississauga offers substantial value compared to Toronto, with prices typically 30-40% below equivalent downtown Toronto units. The waterfront communities in Port Credit and Lakeview are particularly desirable.`,
  },
  {
    name: 'Vaughan',
    slug: 'vaughan',
    region: 'GTA',
    displayOrder: 25,
    avgPriceStudio: 390000,
    avgPrice1br: 510000,
    avgPrice2br: 720000,
    avgPrice3br: 1000000,
    description: `Vaughan is a rapidly growing city north of Toronto, anchored by the Vaughan Metropolitan Centre (VMC), a new downtown built around the northernmost station on TTC Line 1. The VMC is one of the GTA's most ambitious transit-oriented developments, with residential and commercial towers rising around the subway station.

Transit connectivity is excellent for a suburban location, with the VMC subway station providing direct service to downtown Toronto in approximately 45 minutes. York Region's Viva and YRT bus networks fan out across the wider area. Highway 400 and Highway 7 provide vehicle access.

Pre-construction in Vaughan is concentrated around the VMC, where prices are significantly below downtown while offering genuine subway access. Buyers include families seeking larger suites, commuters who value the subway connection, and investors attracted by long-term growth potential.`,
  },
  {
    name: 'Richmond Hill',
    slug: 'richmond-hill',
    region: 'GTA',
    displayOrder: 26,
    avgPriceStudio: 380000,
    avgPrice1br: 500000,
    avgPrice2br: 710000,
    avgPrice3br: 980000,
    description: `Richmond Hill is an established suburban community in York Region, located along the Yonge Street corridor north of Toronto. The city blends small-town heritage charm with modern development and excellent schools. Richmond Hill's diverse population and family-oriented character make it one of the GTA's most desirable suburban destinations.

Transit includes GO Transit's Richmond Hill line providing commuter rail to Union Station, and York Region Transit's Viva Blue rapid bus along Yonge Street. The planned Yonge North subway extension will bring TTC Line 1 service to Richmond Hill, already driving pre-construction activity near future station locations.

Pre-construction in Richmond Hill is gaining momentum in anticipation of the Yonge North subway extension. The city's green spaces, including Mill Pond Park and Lake Wilcox Park, provide recreational amenities that appeal to families.`,
  },
  {
    name: 'Markham',
    slug: 'markham',
    region: 'GTA',
    displayOrder: 27,
    avgPriceStudio: 380000,
    avgPrice1br: 500000,
    avgPrice2br: 700000,
    avgPrice3br: 980000,
    description: `Markham is one of Canada's most diverse and economically dynamic municipalities, home to a thriving tech sector. The city's downtown, Markham Centre, is being developed as a new urbanist community, while historic Unionville Main Street offers one of the most charming village cores in the GTA.

Transit includes the Stouffville GO line providing commuter rail to Union Station, York Region Transit bus services, and proximity to Highway 404 and Highway 407 for vehicle access. The proposed extension of transit services into Markham Centre will further support urbanization.

Pre-construction in Markham is concentrated around Markham Centre and the Highway 7 corridor, offering suburban pricing with increasingly urban amenities. The city's schools consistently rank among the best in Ontario, and it is popular with families from Chinese, South Asian, and Korean communities.`,
  },
  {
    name: 'Oakville',
    slug: 'oakville',
    region: 'GTA',
    displayOrder: 28,
    avgPriceStudio: 430000,
    avgPrice1br: 570000,
    avgPrice2br: 830000,
    avgPrice3br: 1200000,
    description: `Oakville is one of the GTA's most affluent and established communities, located along the Lake Ontario shoreline between Mississauga and Burlington. Known for its charming downtown on Lakeshore Road, excellent schools, and heritage harbour, Oakville has traditionally been a single-family home market now welcoming condo development.

Transit is anchored by GO Transit's Lakeshore West line, with Oakville, Bronte, and Clarkson stations providing commuter rail to Union Station in approximately 45 minutes. The QEW and Highway 403 provide vehicle access, and the cycling and trail network is extensive.

Pre-construction in Oakville appeals to downsizers from the surrounding luxury home market, commuters seeking a lakeside lifestyle, and families attracted by top-ranked schools. Prices reflect Oakville's premium reputation and limited supply of new development sites.`,
  },
  {
    name: 'Burlington',
    slug: 'burlington',
    region: 'GTA',
    displayOrder: 29,
    avgPriceStudio: 390000,
    avgPrice1br: 510000,
    avgPrice2br: 730000,
    avgPrice3br: 1050000,
    description: `Burlington is a lakeside city at the western edge of the GTA, positioned between Oakville and Hamilton on the shores of Lake Ontario and Burlington Bay. Its revitalized downtown centred on Brant Street has become a vibrant dining and shopping destination with small-city charm. Spencer Smith Park and the waterfront promenade are the city's crown jewels.

GO Transit's Lakeshore West line provides commuter rail from Burlington and Appleby stations to Union Station. The QEW connects to Toronto and Hamilton. The city is well-positioned for access to Hamilton's emerging tech and healthcare economy and McMaster University.

Pre-construction in Burlington is concentrated along the Brant Street corridor and near GO stations, where transit-oriented development policies encourage density. The city offers excellent value within the western GTA corridor.`,
  },
  {
    name: 'Hamilton',
    slug: 'hamilton',
    region: 'GTA',
    displayOrder: 30,
    avgPriceStudio: 320000,
    avgPrice1br: 420000,
    avgPrice2br: 600000,
    avgPrice3br: 850000,
    description: `Hamilton is a former steel city experiencing a remarkable renaissance, driven by its arts community, growing tech sector, McMaster University, and affordable real estate. James Street North has become one of Ontario's most celebrated arts and dining districts, with monthly Art Crawl events. The city's dramatic setting, bisected by the Niagara Escarpment, provides stunning waterfalls.

GO Transit's Lakeshore West line provides commuter rail from Hamilton GO Centre and West Harbour stations to Union Station, with planned all-day two-way service. The QEW and Highway 403 provide vehicle access.

Pre-construction in Hamilton offers the most affordable entry point in the GTHA for new-build condos, with prices typically 40-50% below downtown Toronto. Investors are drawn by strong rental yields driven by McMaster University, Mohawk College, and a growing population of Toronto transplants.`,
  },
  {
    name: 'Brampton',
    slug: 'brampton',
    region: 'GTA',
    displayOrder: 31,
    avgPriceStudio: 360000,
    avgPrice1br: 470000,
    avgPrice2br: 660000,
    avgPrice3br: 920000,
    description: `Brampton is one of Canada's fastest-growing and most diverse cities, located northwest of Toronto in Peel Region. The city's downtown core around Queen Street and Main Street is undergoing revitalization, with the Riverwalk project along Etobicoke Creek creating a new urban gathering space. Brampton is home to Sheridan College's Davis Campus.

Transit is improving with the Hurontario LRT's connection at Gateway Terminal, GO Transit's Kitchener and Barrie lines from Brampton, Mount Pleasant, and Bramalea stations, and Brampton Transit's Zum rapid bus service. Highway 410 and Highway 407 provide vehicle access.

Pre-construction in Brampton offers some of the most affordable pricing in the GTA, making it particularly attractive to first-time buyers and newcomers. The city's young, diverse population drives strong rental demand, and proximity to Pearson Airport and major distribution centres supports employment.`,
  },
];

async function seedNeighborhoods() {
  console.log('\n=== STEP 1: Seeding Neighborhoods ===');

  for (const n of NEIGHBORHOODS) {
    const record = {
      name: n.name,
      slug: n.slug,
      region: n.region,
      displayOrder: n.displayOrder,
      avgPriceStudio: n.avgPriceStudio,
      avgPrice1br: n.avgPrice1br,
      avgPrice2br: n.avgPrice2br,
      avgPrice3br: n.avgPrice3br,
      description: n.description,
      updatedAt: new Date().toISOString(),
    };

    // Check if exists
    const { data: existing } = await supabase
      .from('neighborhoods')
      .select('id')
      .eq('slug', n.slug)
      .single();

    if (existing) {
      await supabase.from('neighborhoods').update(record).eq('slug', n.slug);
    } else {
      await supabase.from('neighborhoods').insert({ id: generateId(), ...record });
    }
    stats.neighborhoods++;
  }

  console.log(`  Done: ${stats.neighborhoods} neighborhoods upserted`);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 2: Seed Developers
// ═════════════════════════════════════════════════════════════════════════════

const DEVELOPER_DESCRIPTIONS = {
  'Menkes': 'Menkes Developments is one of Canada\'s premier, fully integrated real estate companies with over 65 years of experience. The family-run firm is known for award-winning condominiums, commercial properties, and industrial developments across the GTA.',
  'Tridel': 'Tridel is Canada\'s largest condominium developer, with over 85 years of building homes and communities in the Greater Toronto Area. The company has built over 90,000 homes and is recognized for quality construction and environmental sustainability.',
  'Daniels': 'The Daniels Corporation is a Toronto-based builder with over 35 years of experience creating award-winning communities. Known for mixed-use developments that incorporate social purpose, Daniels has been instrumental in revitalizing Toronto\'s waterfront.',
  'Concord Adex': 'Concord Adex is one of Canada\'s largest real estate developers, best known for creating CityPlace, the largest mixed-use community ever built in Canada. The company has developed over 100 million square feet of real estate.',
  'CentreCourt': 'CentreCourt Developments is a Toronto-based developer focused on building transit-oriented condominiums. Known for delivering projects on time and on budget, CentreCourt has rapidly grown into one of the city\'s most active developers.',
  'Plaza': 'Plaza is a leading Canadian condominium developer with a portfolio of award-winning projects across Ontario. The company specializes in innovative, design-forward buildings in Toronto\'s most sought-after neighbourhoods.',
  'Pemberton': 'Pemberton Group is a multi-faceted real estate company with a legacy of creating landmark projects in the GTA. The developer is known for large-scale mixed-use communities and has over four decades of experience.',
  'Lifetime': 'Lifetime Developments is a Toronto-based developer with over 40 years of experience creating high-quality residential communities. The company is known for its attention to design detail and strategic site selection.',
  'Lanterra': 'Lanterra Developments is a leading Toronto condo developer known for creating landmark towers in the downtown core. With projects like Maple Leaf Square and Panda Condos, Lanterra has shaped the city\'s skyline.',
  'Great Gulf': 'Great Gulf is a North American real estate organization with over 45 years of experience. The company develops, builds, owns, and manages commercial, residential, and mixed-use properties across Canada and the United States.',
  'Greenland Group': 'Greenland Group is a Shanghai-based Fortune Global 500 company that has expanded into the Toronto market. The state-owned developer is known for iconic projects worldwide and brings significant resources to the Canadian market.',
  'Pinnacle International': 'Pinnacle International is a Vancouver-based developer that has become one of Toronto\'s most prolific builders. Known for large-scale waterfront projects, Pinnacle has delivered thousands of homes across Canada.',
  'Camrost Felcorp': 'Camrost Felcorp is one of the GTA\'s most established luxury condominium developers. With a portfolio of landmark projects in Yorkville and North York, the company is known for premium finishes and prestigious addresses.',
  'Minto': 'Minto Group is one of Canada\'s most respected real estate companies, with over 65 years of building homes and managing properties. The Ottawa-founded company has expanded significantly into the Toronto market.',
  'Mattamy': 'Mattamy Homes is the largest privately owned homebuilder in North America. Founded in 1978, the company has grown from a small local builder into an industry giant with communities across Canada and the United States.',
  'Canderel': 'Canderel is a leading Canadian real estate company with over 45 years of experience developing, managing, and investing in commercial and residential properties. The company is known for design-forward urban projects.',
  'Dream': 'Dream is a leading Canadian real estate company with approximately $24 billion of assets under management. The company develops, owns, and manages commercial, residential, and mixed-use properties.',
  'Oxford Properties': 'Oxford Properties is a global real estate investor and developer owned by OMERS. With a portfolio valued at over $70 billion, Oxford is behind some of Toronto\'s most significant commercial and mixed-use developments.',
  'Hines': 'Hines is a privately owned global real estate investment firm with a presence in 30 countries. The Houston-based company has developed some of the most iconic buildings in the world and is expanding its Toronto portfolio.',
  'Brookfield': 'Brookfield Asset Management is one of the world\'s largest alternative asset managers. Its real estate arm, Brookfield Properties, owns and operates iconic properties globally, including significant holdings in downtown Toronto.',
  'Marlin Spring': 'Marlin Spring is a Toronto-based real estate development company focused on building attainable, transit-connected communities. The company targets emerging neighbourhoods with strong growth potential.',
  'Graywood': 'Graywood Developments is a Toronto-based developer and investor with a track record of creating exceptional condominium projects. The company is known for boutique, design-driven developments in prime locations.',
  'RioCan': 'RioCan Real Estate Investment Trust is one of Canada\'s largest REITs, with a strategy focused on mixed-use urban development. The company is transforming its retail properties into vibrant residential-commercial communities.',
  'Cityzen': 'Cityzen Development Group is a Toronto developer behind some of the city\'s most notable condominium projects, including the Absolute World towers in Mississauga, designed by MAD Architects.',
  'Tribute Communities': 'Tribute Communities is one of the GTA\'s largest and most experienced homebuilders, with over 40 years of building award-winning communities across the Greater Toronto Area and beyond.',
};

async function seedDevelopers() {
  console.log('\n=== STEP 2: Seeding Developers ===');

  // Load scraped projects if available to extract developer names
  const scrapedPath = path.resolve(__dirname, 'scraped-projects.json');
  let developerNames = new Set(Object.keys(DEVELOPER_DESCRIPTIONS));

  if (fs.existsSync(scrapedPath)) {
    try {
      const projects = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
      for (const p of projects) {
        const devName = p.developer || p.developerName || p.developer_name;
        if (devName && devName.trim()) {
          developerNames.add(devName.trim());
        }
      }
    } catch (e) {
      console.log('  Warning: Could not parse scraped-projects.json for developers');
    }
  }

  const developerMap = {};

  for (const name of developerNames) {
    const slug = slugify(name);
    const description = DEVELOPER_DESCRIPTIONS[name] || null;

    const record = {
      name,
      slug,
      headquarters: 'Toronto, ON',
      description,
      updatedAt: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('developers')
      .select('id')
      .eq('slug', slug)
      .single();

    let id;
    if (existing) {
      await supabase.from('developers').update(record).eq('slug', slug);
      id = existing.id;
    } else {
      id = generateId();
      const { error } = await supabase.from('developers').insert({ id, ...record });
      if (error) {
        console.log(`  Warning: Could not insert developer "${name}": ${error.message}`);
        continue;
      }
    }
    developerMap[name.toLowerCase()] = id;
    developerMap[slug] = id;
    stats.developers++;
  }

  console.log(`  Done: ${stats.developers} developers upserted`);
  return developerMap;
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 3: Seed Projects
// ═════════════════════════════════════════════════════════════════════════════

async function seedProjects(developerMap) {
  console.log('\n=== STEP 3: Seeding Projects ===');

  const scrapedPath = path.resolve(__dirname, 'scraped-projects.json');
  if (!fs.existsSync(scrapedPath)) {
    console.log('  Warning: scraped-projects.json not found, skipping project seeding');
    return;
  }

  let projects;
  try {
    const raw = JSON.parse(fs.readFileSync(scrapedPath, 'utf-8'));
    projects = Array.isArray(raw) ? raw : (raw.projects || []);
  } catch (e) {
    console.log(`  Error: Could not parse scraped-projects.json: ${e.message}`);
    return;
  }

  // Build neighborhood lookup
  const { data: neighborhoods } = await supabase.from('neighborhoods').select('id, name, slug');
  const hoodMap = {};
  for (const n of neighborhoods || []) {
    hoodMap[n.name.toLowerCase()] = n.id;
    hoodMap[n.slug] = n.id;
    // Also add without hyphens
    hoodMap[n.slug.replace(/-/g, '')] = n.id;
    hoodMap[n.slug.replace(/-/g, ' ')] = n.id;
  }

  // Rebuild developer lookup from DB
  const { data: devs } = await supabase.from('developers').select('id, name, slug');
  const devMap = { ...developerMap };
  for (const d of devs || []) {
    devMap[d.name.toLowerCase()] = d.id;
    devMap[d.slug] = d.id;
  }

  let count = 0;
  for (const p of projects) {
    const name = p.name || p.projectName || p.project_name;
    if (!name) continue;

    const slug = slugify(name);

    // Match neighborhood
    let neighborhoodId = null;
    const hoodName = p.neighborhood || p.neighbourhoodName || p.neighbourhood || p.area || '';
    if (hoodName) {
      const hLower = hoodName.toLowerCase();
      neighborhoodId =
        hoodMap[hLower] ||
        hoodMap[slugify(hoodName)] ||
        hoodMap[slugify(hoodName).replace(/-/g, '')] ||
        null;
      // Fuzzy: try partial match (e.g. "North York Centre" → "north york")
      if (!neighborhoodId) {
        for (const [key, id] of Object.entries(hoodMap)) {
          if (hLower.includes(key) || key.includes(hLower) ||
              hLower.replace(/\s*(centre|center|city|downtown|lakeshore|village|metropolitan)\s*/gi, '').trim() === key) {
            neighborhoodId = id;
            break;
          }
        }
      }
    }

    // Match developer
    let developerId = null;
    const devName = p.developer || p.developerName || p.developer_name || '';
    if (devName) {
      developerId =
        devMap[devName.toLowerCase()] ||
        devMap[slugify(devName)] ||
        null;
    }

    const record = {
      name,
      slug,
      address: p.address || null,
      neighborhoodId,
      developerId,
      architect: p.architect || null,
      status: p.status ? parseStatus(p.status) : 'PRE_CONSTRUCTION',
      estCompletion: p.estCompletion || p.est_completion || p.completionDate || null,
      totalUnits: p.totalUnits || p.total_units || p.units || null,
      floors: p.floors || p.storeys || null,
      priceMin: p.priceMin || p.price_min || (p.priceRange ? parsePrice(p.priceRange) : null) || null,
      priceMax: p.priceMax || p.price_max || null,
      pricePerSqft: p.pricePerSqft || p.price_per_sqft || null,
      sizeRangeMin: p.sizeRangeMin || p.size_min || null,
      sizeRangeMax: p.sizeRangeMax || p.size_max || null,
      depositStructure: p.depositStructure || p.deposit_structure || null,
      description: p.description || null,
      amenities: p.amenities || null,
      images: p.images || null,
      mainImageUrl: p.mainImageUrl || p.main_image_url || p.imageUrl || null,
      category: p.category ? parseCategory(p.category) : 'PREMIUM',
      websiteUrl: p.websiteUrl || p.website_url || p.url || null,
      featured: p.featured || false,
      unitTypes: p.unitTypes || p.unit_types || null,
      latitude: p.latitude || p.lat || null,
      longitude: p.longitude || p.lng || null,
      updatedAt: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existing) {
      const { error } = await supabase.from('projects').update(record).eq('slug', slug);
      if (error) console.log(`  Warning: Could not update "${name}": ${error.message}`);
    } else {
      const { error } = await supabase
        .from('projects')
        .insert({ id: generateId(), ...record });
      if (error) {
        // Try with a suffix if slug conflict
        const altSlug = `${slug}-2`;
        record.slug = altSlug;
        const { error: err2 } = await supabase
          .from('projects')
          .insert({ id: generateId(), ...record });
        if (err2) {
          console.log(`  Warning: Could not insert "${name}": ${err2.message}`);
          continue;
        }
      }
    }
    count++;
    if (count % 25 === 0) console.log(`  ... ${count} projects processed`);
  }

  stats.projects = count;
  console.log(`  Done: ${count} projects upserted`);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 4: Geocode All Projects
// ═════════════════════════════════════════════════════════════════════════════

async function geocodeProjects() {
  console.log('\n=== STEP 4: Geocoding Projects ===');

  if (!MAPBOX_TOKEN) {
    console.log('  Warning: No MAPBOX_TOKEN found, skipping geocoding');
    return;
  }

  // Fetch projects missing lat/lng
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, address, floors, latitude, longitude, neighborhoodId')
    .or('latitude.is.null,longitude.is.null');

  if (error) {
    console.log(`  Error fetching projects: ${error.message}`);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('  All projects already geocoded');
    return;
  }

  // Neighborhood name lookup for fallback geocoding
  const { data: neighborhoods } = await supabase.from('neighborhoods').select('id, name');
  const hoodNameMap = {};
  for (const n of neighborhoods || []) {
    hoodNameMap[n.id] = n.name;
  }

  console.log(`  ${projects.length} projects need geocoding`);

  let geocoded = 0;
  let requestCount = 0;

  for (const project of projects) {
    // Rate limit: max 10 requests/second
    if (requestCount > 0 && requestCount % 10 === 0) {
      await sleep(1000);
    }

    let query = project.address;
    if (!query) {
      // Fallback: use project name + neighborhood + Toronto
      const hoodName = project.neighborhoodId
        ? hoodNameMap[project.neighborhoodId] || ''
        : '';
      query = `${project.name} ${hoodName} Toronto Ontario Canada`;
    }

    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&country=ca&limit=1`;
      const res = await fetch(url);
      requestCount++;

      if (!res.ok) {
        console.log(`  Warning: Mapbox returned ${res.status} for "${project.name}"`);
        continue;
      }

      const data = await res.json();
      if (!data.features || data.features.length === 0) {
        // Second attempt with just name + Toronto
        if (project.address) {
          const fallbackUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(project.name + ' Toronto Canada')}.json?access_token=${MAPBOX_TOKEN}&country=ca&limit=1`;
          const fallbackRes = await fetch(fallbackUrl);
          requestCount++;
          const fallbackData = await fallbackRes.json();
          if (!fallbackData.features || fallbackData.features.length === 0) {
            continue;
          }
          data.features = fallbackData.features;
        } else {
          continue;
        }
      }

      const [lng, lat] = data.features[0].center;
      const floors = project.floors || 15;
      const footprint = generateFootprint(lat, lng, floors);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ latitude: lat, longitude: lng, footprint, updatedAt: new Date().toISOString() })
        .eq('id', project.id);

      if (updateError) {
        console.log(`  Warning: Could not update geocode for "${project.name}": ${updateError.message}`);
      } else {
        geocoded++;
      }
    } catch (e) {
      console.log(`  Warning: Geocoding error for "${project.name}": ${e.message}`);
    }

    if (geocoded > 0 && geocoded % 10 === 0) {
      console.log(`  ... ${geocoded} projects geocoded`);
    }
  }

  stats.geocoded = geocoded;
  console.log(`  Done: ${geocoded}/${projects.length} projects geocoded`);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 5: Generate SEO Descriptions
// ═════════════════════════════════════════════════════════════════════════════

async function generateSeoDescriptions() {
  console.log('\n=== STEP 5: Generating SEO Descriptions ===');

  if (!ANTHROPIC_KEY) {
    console.log('  Warning: No ANTHROPIC_API_KEY found, skipping SEO generation');
    return;
  }

  // Fetch projects missing longDescription
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, address, description, floors, totalUnits, status, estCompletion, priceMin, priceMax, category, unitTypes, neighborhoodId, developerId')
    .is('longDescription', null);

  if (error) {
    console.log(`  Error fetching projects: ${error.message}`);
    return;
  }

  if (!projects || projects.length === 0) {
    console.log('  All projects already have SEO descriptions');
    return;
  }

  // Build lookups
  const { data: neighborhoods } = await supabase.from('neighborhoods').select('id, name');
  const hoodNameMap = {};
  for (const n of neighborhoods || []) hoodNameMap[n.id] = n.name;

  const { data: developers } = await supabase.from('developers').select('id, name');
  const devNameMap = {};
  for (const d of developers || []) devNameMap[d.id] = d.name;

  console.log(`  ${projects.length} projects need SEO descriptions`);

  let generated = 0;

  for (const project of projects) {
    // Rate limit: 2 requests/second
    if (generated > 0) {
      await sleep(500);
    }

    const hoodName = project.neighborhoodId ? hoodNameMap[project.neighborhoodId] || 'Toronto' : 'Toronto';
    const devName = project.developerId ? devNameMap[project.developerId] || 'a leading developer' : 'a leading developer';
    const priceStr = project.priceMin
      ? `starting from $${(project.priceMin / 1000).toFixed(0)}K`
      : 'pricing TBD';

    const prompt = `You are a Toronto real estate journalist writing for CondoWizard.ca. Write content for this pre-construction condo project:

Project: ${project.name}
Neighborhood: ${hoodName}
Developer: ${devName}
Status: ${project.status || 'Pre-Construction'}
Floors: ${project.floors || 'TBD'}
Total Units: ${project.totalUnits || 'TBD'}
Est. Completion: ${project.estCompletion || 'TBD'}
Price: ${priceStr}
Category: ${project.category || 'PREMIUM'}
Unit Types: ${project.unitTypes || 'Studios to 3-bedrooms'}

Please provide the following in a single JSON response:
{
  "longDescription": "A unique 400-600 word description in an authoritative Toronto real estate journalist voice. Mention TTC and GO Transit connectivity, nearby local landmarks, and lifestyle amenities. Use specific Toronto references.",
  "faqJson": [
    {"question": "...", "answer": "..."},
    // 3-5 FAQ items about the project, pricing, neighborhood, deposit structure, and completion
  ],
  "metaTitle": "Under 60 characters, SEO-optimized title",
  "metaDescription": "Under 160 characters, compelling meta description with keyword"
}

Return ONLY valid JSON, no markdown.`;

    try {
      const response = await callAnthropic(prompt, 2048);

      // Parse JSON from response (handle possible markdown wrapping)
      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      const { error: updateError } = await supabase
        .from('projects')
        .update({
          longDescription: parsed.longDescription,
          faqJson: parsed.faqJson,
          metaTitle: parsed.metaTitle,
          metaDescription: parsed.metaDescription,
          updatedAt: new Date().toISOString(),
        })
        .eq('id', project.id);

      if (updateError) {
        console.log(`  Warning: Could not update SEO for "${project.name}": ${updateError.message}`);
      } else {
        generated++;
      }
    } catch (e) {
      console.log(`  Warning: SEO generation error for "${project.name}": ${e.message}`);
    }

    if (generated > 0 && generated % 5 === 0) {
      console.log(`  ... ${generated} SEO descriptions generated`);
    }
  }

  stats.seoGenerated = generated;
  console.log(`  Done: ${generated}/${projects.length} SEO descriptions generated`);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 6: Generate Blog Posts
// ═════════════════════════════════════════════════════════════════════════════

const BLOG_TOPICS = [
  { title: 'Best Pre-Construction Condos in Toronto 2026', keyword: 'best pre-construction condos toronto 2026', image: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=1200' },
  { title: 'Toronto Condo Market Forecast 2026-2030', keyword: 'toronto condo market forecast', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
  { title: 'King West vs Liberty Village: Where to Buy', keyword: 'king west vs liberty village condos', image: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200' },
  { title: 'Guide to Buying Pre-Construction in Ontario', keyword: 'buying pre-construction condo ontario guide', image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200' },
  { title: "Toronto's Most Anticipated Condo Launches", keyword: 'most anticipated toronto condo launches', image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200' },
  { title: 'HST Rebate on New Condos Explained', keyword: 'hst rebate new condo ontario', image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1200' },
  { title: 'Assignment Sales in Toronto: Complete Guide', keyword: 'assignment sale toronto condo guide', image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200' },
  { title: 'Best Toronto Neighborhoods for First-Time Buyers', keyword: 'best toronto neighborhoods first time buyers', image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1200' },
  { title: 'Pre-Construction vs Resale: Pros and Cons', keyword: 'pre-construction vs resale condo toronto', image: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200' },
  { title: 'Downtown Toronto Condo Investment Guide', keyword: 'downtown toronto condo investment guide', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200' },
  { title: 'Yorkville Pre-Construction: Luxury Living', keyword: 'yorkville pre-construction luxury condos', image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200' },
  { title: 'North York Condos: Best New Developments', keyword: 'north york new condo developments', image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200' },
  { title: 'Mississauga Pre-Construction Guide', keyword: 'mississauga pre-construction condos guide', image: 'https://images.unsplash.com/photo-1565183997392-2f6f122e5912?w=1200' },
  { title: 'Understanding Occupancy Fees in Ontario', keyword: 'occupancy fees ontario condo explained', image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200' },
  { title: 'Toronto Condo Maintenance Fees Explained', keyword: 'toronto condo maintenance fees guide', image: 'https://images.unsplash.com/photo-1460472178825-e5240623afd5?w=1200' },
  { title: 'Best Transit-Oriented Developments in GTA', keyword: 'transit oriented development gta condos', image: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=1200' },
  { title: 'Investing in Toronto Pre-Construction from Abroad', keyword: 'international investor toronto pre-construction', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109db05?w=1200' },
  { title: 'Top Toronto Condo Developers Ranked', keyword: 'top toronto condo developers ranked', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200' },
  { title: 'Waterfront Toronto: New Developments to Watch', keyword: 'waterfront toronto new condo developments', image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200' },
  { title: 'How to Negotiate Pre-Construction Prices', keyword: 'negotiate pre-construction condo price toronto', image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1200' },
];

async function generateBlogPosts() {
  console.log('\n=== STEP 6: Generating Blog Posts ===');

  if (!ANTHROPIC_KEY) {
    console.log('  Warning: No ANTHROPIC_API_KEY found, skipping blog generation');
    return;
  }

  // Check existing blog posts
  const { data: existingPosts } = await supabase.from('blog_posts').select('slug');
  const existingSlugs = new Set((existingPosts || []).map((p) => p.slug));

  const now = new Date();
  let generated = 0;

  for (let i = 0; i < BLOG_TOPICS.length; i++) {
    const topic = BLOG_TOPICS[i];
    const slug = slugify(topic.title);

    if (existingSlugs.has(slug)) {
      console.log(`  Skipping existing: "${topic.title}"`);
      generated++;
      continue;
    }

    // Rate limit: 2 requests/second
    if (generated > 0) {
      await sleep(500);
    }

    // Stagger publishedAt across last 3 months
    const daysAgo = Math.floor((BLOG_TOPICS.length - i) * (90 / BLOG_TOPICS.length));
    const publishedAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

    const prompt = `You are a Toronto real estate journalist writing for CondoWizard.ca, a pre-construction condo marketplace.

Write an 800-1200 word blog post titled: "${topic.title}"
Target SEO keyword: "${topic.keyword}"

Requirements:
- Authoritative, informative journalist tone
- Reference specific Toronto neighborhoods, TTC subway lines, GO Transit
- Include practical advice for buyers
- Use subheadings (## format)
- Include the target keyword naturally 3-5 times
- Reference specific developers, projects, or intersections where relevant
- Make it uniquely Toronto-focused, not generic real estate advice
- Current as of early 2026

Also provide:
- metaTitle: under 60 characters
- metaDescription: under 160 characters
- excerpt: 2-3 sentence summary

Format your response as JSON:
{
  "content": "The full blog post in markdown...",
  "metaTitle": "...",
  "metaDescription": "...",
  "excerpt": "..."
}

Return ONLY valid JSON, no markdown wrapper.`;

    try {
      const response = await callAnthropic(prompt, 4096);

      let jsonStr = response.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(jsonStr);

      const record = {
        id: generateId(),
        title: topic.title,
        slug,
        content: parsed.content,
        excerpt: parsed.excerpt || parsed.content.substring(0, 300),
        metaTitle: parsed.metaTitle,
        metaDescription: parsed.metaDescription,
        targetKeyword: topic.keyword,
        featuredImage: topic.image,
        publishedAt: publishedAt.toISOString(),
        author: 'CondoWizard.ca',
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase.from('blog_posts').insert(record);
      if (error) {
        console.log(`  Warning: Could not insert blog "${topic.title}": ${error.message}`);
      } else {
        generated++;
        console.log(`  [${generated}/${BLOG_TOPICS.length}] Generated: "${topic.title}"`);
      }
    } catch (e) {
      console.log(`  Warning: Blog generation error for "${topic.title}": ${e.message}`);
    }
  }

  stats.blogPosts = generated;
  console.log(`  Done: ${generated}/${BLOG_TOPICS.length} blog posts generated`);
}

// ═════════════════════════════════════════════════════════════════════════════
// STEP 7: Create Admin User
// ═════════════════════════════════════════════════════════════════════════════

async function createAdminUser() {
  console.log('\n=== STEP 7: Creating Admin User ===');

  const email = 'admin@condowizard.ca';

  // Check if exists
  const { data: existing } = await supabase
    .from('agents')
    .select('id')
    .eq('email', email)
    .single();

  if (existing) {
    console.log('  Admin user already exists, skipping');
    stats.adminUser = true;
    return;
  }

  const passwordHash = await bcrypt.hash('admin123', 12);

  const record = {
    id: generateId(),
    name: 'Admin',
    email,
    passwordHash,
    role: 'admin',
    brokerage: 'Rare Real Estate Inc.',
    isActive: true,
    neighborhoods: [],
    createdAt: new Date().toISOString(),
  };

  const { error } = await supabase.from('agents').insert(record);
  if (error) {
    console.log(`  Error creating admin user: ${error.message}`);
  } else {
    console.log('  Admin user created: admin@condowizard.ca / admin123');
    stats.adminUser = true;
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// MAIN
// ═════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('============================================');
  console.log('  CondoWizard.ca - Full Database Seed');
  console.log('============================================');
  console.log(`  Supabase: ${SUPABASE_URL}`);
  console.log(`  Mapbox: ${MAPBOX_TOKEN ? 'configured' : 'MISSING'}`);
  console.log(`  Anthropic: ${ANTHROPIC_KEY ? 'configured' : 'MISSING'}`);
  console.log('');

  const startTime = Date.now();

  try {
    // Step 1
    await seedNeighborhoods();

    // Step 2
    const developerMap = await seedDevelopers();

    // Step 3
    await seedProjects(developerMap);

    // Step 4
    await geocodeProjects();

    // Step 5
    await generateSeoDescriptions();

    // Step 6
    await generateBlogPosts();

    // Step 7
    await createAdminUser();
  } catch (e) {
    console.error('\nFatal error:', e);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n============================================');
  console.log('  Seed Complete!');
  console.log('============================================');
  console.log(`  Neighborhoods: ${stats.neighborhoods}`);
  console.log(`  Developers:    ${stats.developers}`);
  console.log(`  Projects:      ${stats.projects}`);
  console.log(`  Geocoded:      ${stats.geocoded}`);
  console.log(`  SEO Generated: ${stats.seoGenerated}`);
  console.log(`  Blog Posts:    ${stats.blogPosts}`);
  console.log(`  Admin User:    ${stats.adminUser ? 'yes' : 'no'}`);
  console.log(`  Time elapsed:  ${elapsed}s`);
  console.log('============================================\n');
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
