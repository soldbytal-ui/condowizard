/**
 * Upsert new pre-construction projects to Supabase
 * Sources: miamicondoinvestments.com, condoblackbook.com, manhattanmiami.com, web search
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function geocode(address) {
  try {
    const encoded = encodeURIComponent(address);
    const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&limit=1`);
    const data = await res.json();
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (e) { console.error('Geocode fail:', e.message); }
  return null;
}

function generateFootprint(lat, lng, floors) {
  const size = Math.min(0.0003, 0.0001 + floors * 0.000003);
  const hw = size / 2, hh = size / 2.5;
  return {
    type: 'Polygon',
    coordinates: [[[lng-hw,lat-hh],[lng+hw,lat-hh],[lng+hw,lat+hh],[lng-hw,lat+hh],[lng-hw,lat-hh]]]
  };
}

const HOOD_MAP = {
  'brickell':'brickell','downtown miami':'downtown-miami','edgewater':'edgewater',
  'miami beach':'miami-beach','south beach':'south-beach','coconut grove':'coconut-grove',
  'coral gables':'coral-gables','sunny isles beach':'sunny-isles-beach','surfside':'surfside',
  'bal harbour':'bal-harbour','bay harbor islands':'bay-harbor-islands',
  'key biscayne':'key-biscayne','wynwood':'midtown-wynwood','midtown':'midtown-wynwood',
  'design district':'design-district','aventura':'aventura','north bay village':'north-bay-village',
  'north miami beach':'north-miami-beach','fort lauderdale':'fort-lauderdale',
  'hollywood':'hollywood','hallandale beach':'hallandale-beach','pompano beach':'pompano-beach',
  'palm beach':'palm-beach','west palm beach':'west-palm-beach','boca raton':'boca-raton',
};

const PROJECTS = [
  { name:'501 First Residences', address:'501 NE 1st Ave, Miami, FL 33132', neighborhood:'downtown miami', developer:'Aria Development Group', architect:'Arquitectonica', floors:40, totalUnits:448, priceMin:400000, priceMax:1200000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'501 First Residences is a 40-story luxury condominium tower rising in the heart of Downtown Miami. Developed by Aria Development Group with architecture by Arquitectonica, this project brings 448 residences to one of Miami\'s most dynamic neighborhoods.', amenities:['Resort-style pool deck','Fitness center','Co-working spaces','Yoga studio','BBQ area','Children\'s play area','Pet spa','24-hour concierge','Valet parking'], unitTypes:'Studios, 1-3 Bedrooms' },
  { name:'The Crosby Miami Worldcenter', address:'640 N Miami Ave, Miami, FL 33136', neighborhood:'downtown miami', developer:'Related Group, Merrimac Ventures', architect:'Arquitectonica', floors:31, totalUnits:450, priceMin:450000, priceMax:1500000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'The Crosby at Miami Worldcenter is a 31-story residential tower offering 450 luxury residences in Downtown Miami\'s transformative Miami Worldcenter district.', amenities:['Rooftop pool and lounge','Fitness center','Co-working lounge','Theater room','Social club','Dog park','Smart home technology'], unitTypes:'Studios, 1-3 Bedrooms' },
  { name:'Una Residences', address:'175 SE 25th Rd, Miami, FL 33129', neighborhood:'brickell', developer:'OKO Group, Cain International', architect:'Adrian Smith + Gordon Gill', floors:47, totalUnits:135, priceMin:2900000, priceMax:21000000, estCompletion:'2026', status:'NEAR_COMPLETION', category:'ULTRA_LUXURY', description:'Una Residences is a 47-story waterfront tower on the shores of Biscayne Bay in Brickell. Designed by Adrian Smith + Gordon Gill Architecture, this ultra-luxury development offers 135 expansive residences with floor-to-ceiling windows and private elevator access.', amenities:['Bayfront infinity pool','Private marina','Spa and wellness center','Fitness center','Wine cellar','Children\'s playroom','Theater','Business center','Sunset lounge'], unitTypes:'2-5 Bedrooms, Penthouses' },
  { name:'Visions at Brickell Station', address:'1136 SW 3rd Ave, Miami, FL 33130', neighborhood:'brickell', developer:'Newgard Development Group', floors:8, totalUnits:111, priceMin:350000, priceMax:750000, estCompletion:'2027', status:'PRE_CONSTRUCTION', category:'AFFORDABLE_LUXURY', description:'Visions at Brickell Station offers an accessible entry point into the coveted Brickell neighborhood with 111 thoughtfully designed residences steps from Brickell City Centre Metromover.', amenities:['Rooftop pool','Fitness center','Co-working space','Package room','Bicycle storage','Pet-friendly amenities'], unitTypes:'Studios, 1-2 Bedrooms' },
  { name:'Onda Residences', address:'1135 103rd Street, Bay Harbor Islands, FL 33154', neighborhood:'bay harbor islands', developer:'Verzasca Group', architect:'Kobi Karp', floors:8, totalUnits:41, priceMin:1400000, priceMax:4500000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Onda Residences is a boutique waterfront condominium in Bay Harbor Islands offering 41 luxury residences with wave-inspired architecture and direct Intracoastal Waterway views.', amenities:['Waterfront pool','Private boat slips','Fitness center','Rooftop terrace','Summer kitchen','Concierge'], unitTypes:'2-4 Bedrooms' },
  { name:'Alana Bay Harbor Islands', address:'1030 93rd St, Bay Harbor Islands, FL 33154', neighborhood:'bay harbor islands', developer:'Two Roads Development', floors:8, totalUnits:32, priceMin:1350000, priceMax:3500000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Alana Bay Harbor Islands is an intimate waterfront condominium offering 32 luxury residences in the tranquil island enclave of Bay Harbor Islands.', amenities:['Bayfront pool','Wellness center','Yoga deck','Private boat dock','Rooftop lounge','EV charging'], unitTypes:'2-3 Bedrooms' },
  { name:'Villa17', address:'1709 Jefferson Ave, Miami Beach, FL 33139', neighborhood:'south beach', developer:'Vertical Developments', floors:5, totalUnits:10, priceMin:1800000, priceMax:3200000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Villa17 is an ultra-exclusive boutique condominium in the heart of South Beach with only 10 residences offering a private, villa-like living experience.', amenities:['Rooftop pool','Private terraces','Concierge','Secure parking','Smart home technology'], unitTypes:'2-3 Bedrooms' },
  { name:'Sage Intracoastal Residences', address:'2893 E Sunrise Blvd, Fort Lauderdale, FL 33304', neighborhood:'fort lauderdale', developer:'Property Markets Group (PMG)', floors:28, totalUnits:44, priceMin:2000000, priceMax:3500000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Sage Intracoastal Residences is a 28-story boutique tower by PMG on the Intracoastal Waterway in Fort Lauderdale with just 44 exclusive residences.', amenities:['Infinity pool','Private marina','Spa','Fitness center','Social lounge','Wine storage','Concierge','Valet'], unitTypes:'2-4 Bedrooms' },
  { name:'Andare Residences by Pininfarina', address:'551 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304', neighborhood:'fort lauderdale', developer:'Kolter Urban', architect:'Pininfarina', floors:45, totalUnits:163, priceMin:2150000, priceMax:8000000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'LUXURY', description:'Andare Residences by Pininfarina is a striking 45-story oceanfront tower designed by the legendary Italian design house Pininfarina on Fort Lauderdale Beach.', amenities:['Oceanfront pool deck','Spa by Pininfarina','Fitness center','Social club','Private dining','Wine vault','Pet spa','EV charging','Beach services'], unitTypes:'2-4 Bedrooms, Penthouses' },
  { name:'Ombelle Residences', address:'525 N Fort Lauderdale Beach Blvd, Fort Lauderdale, FL 33304', neighborhood:'fort lauderdale', developer:'Dependable Equities', floors:44, totalUnits:775, priceMin:400000, priceMax:2500000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'Ombelle is Fort Lauderdale\'s largest new oceanfront condominium with 775 residences across 44 stories offering accessible beachfront living.', amenities:['Oceanfront pool','Spa','Fitness studios','Co-working spaces','Theater','Children\'s playroom','Dog park','Tennis courts','Beach club'], unitTypes:'Studios, 1-4 Bedrooms' },
  { name:'Sereno Fort Lauderdale', address:'2900 Riomar St, Fort Lauderdale, FL 33304', neighborhood:'fort lauderdale', developer:'Kolter Urban', floors:14, totalUnits:76, priceMin:1800000, priceMax:5000000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'LUXURY', description:'Sereno is a 14-story boutique waterfront condominium offering 76 residences along the Intracoastal Waterway in Fort Lauderdale.', amenities:['Waterfront pool','Fitness center','Yoga studio','Kayak launch','Social lounge','EV charging'], unitTypes:'2-3 Bedrooms, Penthouses' },
  { name:'Viceroy Residences Fort Lauderdale', address:'3101 Bayshore Dr, Fort Lauderdale, FL 33304', neighborhood:'fort lauderdale', developer:'Related Group, BH Group', floors:45, totalUnits:370, priceMin:600000, priceMax:3000000, estCompletion:'2029', status:'PRE_CONSTRUCTION', category:'LUXURY', description:'Viceroy Residences Fort Lauderdale is a 45-story waterfront tower bringing the Viceroy hospitality brand to Fort Lauderdale with 370 residences.', amenities:['Waterfront pool','Viceroy spa','Fitness center','Marina','Restaurant','Rooftop bar','Business center','Concierge','Kids club'], unitTypes:'Studios, 1-4 Bedrooms' },
  { name:'South Flagler House', address:'1160 S Flagler Dr, West Palm Beach, FL 33401', neighborhood:'west palm beach', developer:'Related Companies', architect:'Robert A.M. Stern Architects', floors:28, totalUnits:105, priceMin:6000000, priceMax:35000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'ULTRA_LUXURY', description:'South Flagler House is an ultra-luxury waterfront development by Related Companies, designed by Robert A.M. Stern Architects, offering 105 residences in West Palm Beach.', amenities:['Waterfront infinity pool','Full-service spa','Private dining by Jean-Georges','Fitness by Anatomy','Marina','Wine vault','Private gardens','Concierge','Valet'], unitTypes:'2-5 Bedrooms, Penthouses' },
  { name:'The Berkeley West Palm Beach', address:'300 Banyan Blvd, West Palm Beach, FL 33401', neighborhood:'west palm beach', developer:'Savanna', floors:28, totalUnits:193, priceMin:1200000, priceMax:6000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'The Berkeley is a 28-story luxury condominium in downtown West Palm Beach offering 193 residences with sweeping Intracoastal views.', amenities:['Pool deck with cabanas','Fitness center','Social lounge','Co-working space','Dog spa','Wine room','Private dining','EV charging','Concierge'], unitTypes:'1-4 Bedrooms' },
  { name:'Shorecrest West Palm Beach', address:'1000 S Flagler Dr, West Palm Beach, FL 33401', neighborhood:'west palm beach', developer:'Rabina Properties', architect:'OMA', floors:27, totalUnits:100, priceMin:3500000, priceMax:20000000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'ULTRA_LUXURY', description:'Shorecrest is a landmark 27-story residential tower designed by OMA (Rem Koolhaas) with a distinctive curvilinear facade, offering 100 ultra-luxury residences.', amenities:['Infinity pool','Spa and wellness center','Beach club','Marina access','Fine dining restaurant','Library lounge','Fitness center','24-hour concierge'], unitTypes:'2-5 Bedrooms, Penthouses' },
  { name:'Icon Beach Residences', address:'1301 S Ocean Dr, Hollywood, FL 33019', neighborhood:'hollywood', developer:'Related Group, BH Group', floors:37, totalUnits:350, priceMin:825000, priceMax:2600000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'Icon Beach Residences is a 37-story oceanfront condominium on Hollywood Beach with 350 residences and direct access to the iconic Broadwalk.', amenities:['Oceanfront pool deck','Spa','Fitness center','Beach club','Social lounge','Children\'s room','Business center','Concierge','Valet'], unitTypes:'1-3 Bedrooms' },
  { name:'Glass House Boca Raton', address:'298 SE Mizner Blvd, Boca Raton, FL 33432', neighborhood:'boca raton', developer:'Elad National Properties', architect:'Garcia Stromberg', floors:10, totalUnits:28, priceMin:3000000, priceMax:8000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Glass House is the first modern glass condominium in downtown Boca Raton with only 28 luxury residences overlooking Lake Boca Raton.', amenities:['Rooftop pool and sky lounge','Fitness center','Wine room','Private storage','EV charging','Concierge'], unitTypes:'2-4 Bedrooms' },
  { name:'Boca Beach House', address:'2150 N Ocean Blvd, Boca Raton, FL 33431', neighborhood:'boca raton', developer:'Penn-Florida Companies', floors:5, totalUnits:32, priceMin:2500000, priceMax:7000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Boca Beach House features 32 flow-through residences on 3.2 acres overlooking Lake Boca Raton with private beach access.', amenities:['Oceanfront pool','Private beach access','Fitness center','Social room','Landscaped gardens','Secure parking'], unitTypes:'2-3 Bedrooms' },
  { name:'Onix Delray Beach', address:'105 SE 1st Ave, Delray Beach, FL 33444', neighborhood:'boca raton', developer:'Savanna Fund', floors:4, totalUnits:26, priceMin:1569000, priceMax:3200000, estCompletion:'2028', status:'PRE_CONSTRUCTION', category:'LUXURY', description:'Onix is a boutique 4-story condominium offering 26 luxury residences in downtown Delray Beach with walkable access to Atlantic Avenue.', amenities:['Rooftop pool','Fitness center','Social lounge','Private storage','Secure parking'], unitTypes:'2-3 Bedrooms' },
  { name:'Alchemy Wynwood Residences', address:'18 NW 23rd St, Miami, FL 33127', neighborhood:'wynwood', developer:'Alchemy-ABR Investment Partners', architect:'Arquitectonica', floors:12, totalUnits:186, priceMin:500000, priceMax:1500000, estCompletion:'2029', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'Alchemy Wynwood brings 186 luxury residences to the heart of the Wynwood Arts District, designed by Arquitectonica with ground-floor retail.', amenities:['Rooftop pool','Fitness center','Coworking spaces','Art gallery','Retail promenade','Dog park','Bicycle storage'], unitTypes:'Studios, 1-3 Bedrooms' },
  { name:'Edgewater 36', address:'2600 NE 2nd Ave, Miami, FL 33137', neighborhood:'edgewater', developer:'Black Salmon, TSG', architect:'Arquitectonica', floors:36, totalUnits:229, priceMin:700000, priceMax:2500000, estCompletion:'2029', status:'PRE_CONSTRUCTION', category:'PREMIUM', description:'Edgewater 36 is a striking 36-story tower featuring a unique diagrid structural design by Arquitectonica with panoramic Biscayne Bay views.', amenities:['Pool deck with bay views','Fitness center','Spa','Social lounge','Co-working space','Dog park','EV charging'], unitTypes:'1-3 Bedrooms' },
  { name:'Riva Residenze', address:'1110 SE 3rd Ave, Fort Lauderdale, FL 33316', neighborhood:'fort lauderdale', developer:'Riva Development', floors:7, totalUnits:36, priceMin:3000000, priceMax:9000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Riva Residenze is a yacht-inspired luxury development offering 36 single-family home-sized residences on the New River in Fort Lauderdale.', amenities:['Waterfront pool','Private boat slips','Fitness center','Social club','Private storage','Concierge'], unitTypes:'3-4 Bedrooms' },
  { name:'Bungalow East Residences', address:'2500 E Las Olas Blvd, Fort Lauderdale, FL 33301', neighborhood:'fort lauderdale', developer:'Stiles Corporation', floors:5, totalUnits:24, priceMin:2000000, priceMax:5000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'Bungalow East is a boutique 5-story condominium on East Las Olas Boulevard offering 24 luxury residences with walkable access to Fort Lauderdale\'s premier corridor.', amenities:['Rooftop pool','Fitness center','Social room','Secure parking','Bicycle storage'], unitTypes:'2-3 Bedrooms' },
  { name:'La Baia North', address:'9201 E Bay Harbor Dr, Bay Harbor Islands, FL 33154', neighborhood:'bay harbor islands', developer:'Château Group', floors:8, totalUnits:57, priceMin:1500000, priceMax:5000000, estCompletion:'2027', status:'UNDER_CONSTRUCTION', category:'LUXURY', description:'La Baia North is the newest phase of the La Baia waterfront community in Bay Harbor Islands featuring 57 ultra-luxury residences with direct waterfront access.', amenities:['Waterfront pool','Private marina','Spa','Fitness center','Club room','Children\'s area','Concierge'], unitTypes:'2-4 Bedrooms' },
];

async function main() {
  console.log('Fetching existing data...');
  const { data: existing } = await supabase.from('projects').select('name, slug');
  const slugSet = new Set((existing||[]).map(p => p.slug));
  const nameSet = new Set((existing||[]).map(p => p.name.toLowerCase()));

  const { data: hoods } = await supabase.from('neighborhoods').select('id, slug');
  const hoodMap = Object.fromEntries((hoods||[]).map(h => [h.slug, h.id]));

  const { data: devs } = await supabase.from('developers').select('id, name, slug');
  const devSlugMap = Object.fromEntries((devs||[]).map(d => [d.slug, d.id]));

  let added = 0, skipped = 0;

  for (const p of PROJECTS) {
    const slug = slugify(p.name);
    if (slugSet.has(slug) || nameSet.has(p.name.toLowerCase())) {
      console.log('Skip:', p.name);
      skipped++;
      continue;
    }

    const hoodSlug = HOOD_MAP[p.neighborhood.toLowerCase()];
    const neighborhoodId = hoodSlug ? hoodMap[hoodSlug] || null : null;

    // Developer
    const devSlug = slugify(p.developer);
    let developerId = devSlugMap[devSlug] || null;
    if (!developerId) {
      const { data: nd } = await supabase.from('developers').upsert({ name: p.developer, slug: devSlug }, { onConflict: 'slug' }).select('id').single();
      if (nd) { developerId = nd.id; devSlugMap[devSlug] = nd.id; }
    }

    // Geocode
    console.log('Geocoding:', p.name);
    const coords = await geocode(p.address);
    if (!coords) { console.log('  SKIP - no geocode'); continue; }

    const footprint = generateFootprint(coords.lat, coords.lng, p.floors);

    const { error } = await supabase.from('projects').upsert({
      name: p.name, slug, address: p.address, neighborhoodId, developerId,
      architect: p.architect || null, status: p.status, estCompletion: p.estCompletion,
      totalUnits: p.totalUnits, floors: p.floors, priceMin: p.priceMin || null,
      priceMax: p.priceMax || null, description: p.description, amenities: p.amenities,
      category: p.category, unitTypes: p.unitTypes || null,
      latitude: coords.lat, longitude: coords.lng, footprint, featured: false,
    }, { onConflict: 'slug' });

    if (error) console.error('  ERR:', p.name, error.message);
    else { console.log('  Added:', p.name); added++; slugSet.add(slug); }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\nDone:', added, 'added,', skipped, 'skipped');
  console.log('Total projects now:', (existing?.length||0) + added);
}

main().catch(console.error);
