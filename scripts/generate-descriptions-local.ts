/**
 * Generate unique SEO-optimized descriptions for all projects
 * Uses project-specific data to create genuinely unique content
 * No external API required — pure data-driven generation
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

// Neighborhood lifestyle context for rich descriptions
const NH_CONTEXT: Record<string, { vibe: string; landmarks: string; lifestyle: string }> = {
  'brickell': { vibe: 'Miami\'s financial powerhouse', landmarks: 'Brickell City Centre, Mary Brickell Village, and the Metromover', lifestyle: 'The walk-to-everything energy of Brickell Avenue — rooftop bars, waterfront dining, and a quick Uber Boat to Miami Beach' },
  'downtown-miami': { vibe: 'the urban core of a global city', landmarks: 'Miami Worldcenter, Kaseya Center, Brightline station, and Bayside Marketplace', lifestyle: 'A transit-connected lifestyle with the Pérez Art Museum, Adrienne Arsht Center, and bayfront parks minutes away' },
  'edgewater': { vibe: 'a bayfront enclave between Midtown and Downtown', landmarks: 'Margaret Pace Park, the Adrienne Arsht Center, and the Design District', lifestyle: 'Unobstructed Biscayne Bay views, morning jogs along the waterfront, and easy access to Wynwood and Midtown dining' },
  'miami-beach': { vibe: 'the barrier island synonymous with Miami glamour', landmarks: 'Lincoln Road, Collins Avenue, the Bass Museum, and pristine Atlantic beaches', lifestyle: 'Ocean breezes, Art Deco architecture, and a global dining scene that ranges from Joe\'s Stone Crab to Michelin-starred newcomers' },
  'south-beach': { vibe: 'the legendary southern tip of Miami Beach', landmarks: 'Ocean Drive, the Art Deco Historic District, South Pointe Park, and Lummus Park', lifestyle: 'A front-row seat to Miami\'s most iconic stretch — sunset cocktails, beachfront dining, and the pulse of Ocean Drive' },
  'coconut-grove': { vibe: 'Miami\'s oldest and most charming neighborhood', landmarks: 'CocoWalk, Vizcaya Museum, Kennedy Park, and the Coconut Grove Sailing Club', lifestyle: 'Tree-canopied streets, waterfront cafes, weekend sailing, and a village atmosphere that feels worlds apart from the high-rise corridors' },
  'coral-gables': { vibe: 'the "City Beautiful" with Mediterranean grandeur', landmarks: 'Miracle Mile, the Biltmore Hotel, Venetian Pool, and the University of Miami', lifestyle: 'European-style plazas, oak-lined boulevards, and some of the most prestigious addresses in South Florida' },
  'sunny-isles-beach': { vibe: 'an oceanfront corridor between Bal Harbour and Aventura', landmarks: 'miles of beachfront, Aventura Mall nearby, and the Intracoastal Waterway', lifestyle: 'International flair, pristine sand, and a skyline dominated by some of Miami\'s most iconic condo towers' },
  'surfside': { vibe: 'a quiet beach town with a boutique character', landmarks: 'Bal Harbour Shops (walking distance), Harding Avenue, and Surfside Beach', lifestyle: 'Small-town charm paired with proximity to Bal Harbour luxury — morning beach walks and evening dinners along Collins' },
  'bal-harbour': { vibe: 'one of Florida\'s most exclusive enclaves', landmarks: 'Bal Harbour Shops, pristine beachfront, and manicured residential streets', lifestyle: 'Ultra-private beachfront living steps from America\'s premier luxury shopping destination' },
  'midtown-wynwood': { vibe: 'Miami\'s creative epicenter', landmarks: 'Wynwood Walls, Shops at Midtown Miami, galleries, and craft breweries', lifestyle: 'Street art tours, gallery openings, farm-to-table restaurants, and a walkable urban village that hosts Art Basel\'s most electric events' },
  'design-district': { vibe: 'an upscale arts and luxury shopping district', landmarks: 'Louis Vuitton, Dior, the ICA Miami, and design showrooms', lifestyle: 'Flagship boutiques, world-class galleries, and Michelin-starred restaurants within a few curated blocks' },
  'aventura': { vibe: 'a suburban-luxury enclave centered on Aventura Mall', landmarks: 'Aventura Mall (one of the largest in the U.S.), country clubs, and the Intracoastal', lifestyle: 'Excellent schools, waterfront parks, and the convenience of one of America\'s premier shopping destinations' },
  'key-biscayne': { vibe: 'an island retreat accessible via the Rickenbacker Causeway', landmarks: 'Crandon Park, Bill Baggs State Park, and the Ritz-Carlton Key Biscayne', lifestyle: 'Ultra-private, family-oriented island living with bay and ocean views, nature preserves, and world-class beach access' },
  'hollywood': { vibe: 'a Broward beach city with a 2.5-mile oceanfront Broadwalk', landmarks: 'Hollywood Beach Broadwalk, ArtsPark, and Downtown Hollywood', lifestyle: 'More affordable beachfront than Miami Beach, with excellent beach access and easy proximity to Fort Lauderdale' },
  'hallandale-beach': { vibe: 'a Broward beachfront city at the Miami-Dade border', landmarks: 'Gulfstream Park, The Village at Gulfstream Park, and Aventura Mall nearby', lifestyle: 'Oceanfront living at prices below Miami, with Gulfstream Park entertainment and quick access to both counties' },
  'fort-lauderdale': { vibe: 'the "Venice of America" with 165 miles of waterways', landmarks: 'Las Olas Boulevard, Fort Lauderdale Beach, the Riverwalk, and NSU Art Museum', lifestyle: 'Yacht culture, waterfront dining along Las Olas, and a growing tech and finance scene attracting young professionals' },
  'pompano-beach': { vibe: 'a rapidly redeveloping Broward beach city', landmarks: 'the revitalized Fisher Family Pier, Pompano Beach Aquatics Center, and Atlantic Boulevard', lifestyle: 'More affordable beachfront with a major redevelopment wave — early buyers stand to benefit from rising property values' },
  'north-bay-village': { vibe: 'a small island community on Biscayne Bay', landmarks: 'bay views, proximity to both South Beach and the mainland', lifestyle: 'Quieter residential island living with bay views and quick access to Miami Beach and the mainland via the 79th Street Causeway' },
  'north-miami-beach': { vibe: 'a diverse community with natural attractions', landmarks: 'Oleta River State Park (largest urban park in Florida) and Biscayne Boulevard shopping', lifestyle: 'A more affordable entry into the Miami market with park access, diverse dining, and improving infrastructure' },
  'palm-beach': { vibe: 'America\'s most exclusive island enclave', landmarks: 'Worth Avenue, The Breakers resort, and meticulously maintained estates', lifestyle: 'Old-money elegance, world-class shopping on Worth Avenue, and the most prestigious addresses on Florida\'s Atlantic coast' },
  'boca-raton': { vibe: 'an affluent Palm Beach County city', landmarks: 'Mizner Park, the Boca Raton Resort & Club, and Town Center at Boca Raton', lifestyle: 'Suburban luxury with excellent schools, beach access, and a thriving dining and arts scene' },
  'west-palm-beach': { vibe: 'the urban center of Palm Beach County', landmarks: 'Clematis Street, Rosemary Square, and the Intracoastal Waterway', lifestyle: 'A renaissance city with a growing dining and arts scene, waterfront parks, and proximity to Palm Beach Island' },
  'bay-harbor-islands': { vibe: 'a quiet residential enclave near Bal Harbour', landmarks: 'Bal Harbour Shops (walking distance), tree-lined streets, and local cafes', lifestyle: 'Small-island charm with walkable access to luxury shopping and beachfront dining' },
};

function formatPrice(n: number | null): string {
  if (!n) return '';
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  return `$${(n / 1000).toFixed(0)}K`;
}

// Opening hooks — varied by building characteristics
function getOpening(p: any, nh: string): string {
  const floors = p.floors;
  const units = p.totalUnits;
  const arch = p.architect;
  const dev = p.developer?.name;
  const price = p.priceMin;
  const cat = (p.category || '').replace(/_/g, ' ').toLowerCase();
  const completion = p.estCompletion;

  // Pick opening based on most distinctive feature
  if (arch && floors && floors >= 40) {
    return `Designed by ${arch} and rising ${floors} stories above ${nh}, ${p.name} is among the tallest new residential towers in the neighborhood.`;
  }
  if (cat.includes('ultra') && price && price >= 5000000) {
    return `With entry prices starting at ${formatPrice(price)}, ${p.name} targets the upper echelon of Miami\'s ${cat} market — a tier where branded residences compete for a limited pool of ultra-high-net-worth buyers.`;
  }
  if (cat.includes('branded') && dev) {
    return `${p.name} brings a globally recognized hospitality brand to ${nh}, developed by ${dev} with the kind of white-glove service and design standards that only branded residences deliver.`;
  }
  if (units && units <= 30) {
    return `With just ${units} residences, ${p.name} offers the kind of exclusivity that larger towers simply cannot match — a boutique development where privacy is the primary amenity.`;
  }
  if (arch) {
    return `Architect ${arch} brings a distinctive design vision to ${nh} with ${p.name}, a ${floors ? floors + '-story' : 'new'} tower that stands apart from the neighborhood\'s existing skyline.`;
  }
  if (dev && floors && floors >= 30) {
    return `${dev} is adding ${floors} stories to the ${nh} skyline with ${p.name}, a ${cat} development that reflects the developer\'s track record across South Florida.`;
  }
  if (completion && completion.includes('2025')) {
    return `Nearing completion in ${nh}, ${p.name} represents one of the last opportunities to secure pre-construction pricing before units transition to the resale market.`;
  }
  if (completion && (completion.includes('2027') || completion.includes('2028'))) {
    return `Scheduled for delivery in ${completion}, ${p.name} gives buyers a multi-year runway to build equity through ${nh}\'s continued price appreciation before taking occupancy.`;
  }
  if (price && price < 500000) {
    return `Starting from ${formatPrice(price)}, ${p.name} is one of the more accessible entry points into ${nh}\'s pre-construction market — a price tier that attracts both first-time buyers and investors.`;
  }
  return `${p.name} is a ${cat} ${(p.status || '').replace(/_/g, ' ').toLowerCase()} development that adds ${units ? units + ' new residences' : 'a new residential option'} to ${nh}\'s evolving skyline.`;
}

function generateDescription(p: any): string {
  const nh = p.neighborhood?.name || 'Miami';
  const nhSlug = p.neighborhood?.slug || '';
  const ctx = NH_CONTEXT[nhSlug];
  const amenities = Array.isArray(p.amenities) ? p.amenities : [];
  const dev = p.developer?.name;
  const cat = (p.category || '').replace(/_/g, ' ').toLowerCase();
  const status = (p.status || '').replace(/_/g, ' ').toLowerCase();
  const year = new Date().getFullYear();

  const sections: string[] = [];

  // === OPENING ===
  sections.push(getOpening(p, nh));

  // === BUILDING SPECS ===
  const specs: string[] = [];
  if (p.floors) specs.push(`${p.floors} stories`);
  if (p.totalUnits) specs.push(`${p.totalUnits} residences`);
  if (p.unitTypes) specs.push(`unit configurations spanning ${p.unitTypes}`);
  if (p.sizeRangeMin && p.sizeRangeMax) specs.push(`floor plans from ${p.sizeRangeMin.toLocaleString()} to ${p.sizeRangeMax.toLocaleString()} square feet`);

  if (specs.length > 0) {
    sections.push(`\n\n## Building Overview\n\nThe development comprises ${specs.join(', ')}. ${p.priceMin && p.priceMax ? `Pricing ranges from ${formatPrice(p.priceMin)} to ${formatPrice(p.priceMax)}${p.pricePerSqft ? `, with an average of approximately $${p.pricePerSqft} per square foot` : ''}.` : p.priceMin ? `Pricing starts from ${formatPrice(p.priceMin)}.` : ''} ${p.depositStructure ? `The deposit structure follows a ${p.depositStructure} schedule, spreading the buyer\'s initial investment across the construction timeline.` : ''}`);
  }

  // === AMENITIES ===
  if (amenities.length > 0) {
    const topAmenities = amenities.slice(0, 8);
    const remaining = amenities.length - topAmenities.length;
    const amenityIntro = amenities.length > 10
      ? `${p.name} delivers an extensive amenity program with ${amenities.length} distinct offerings.`
      : `The amenity program includes`;

    sections.push(`\n\n## Amenities & Design\n\n${amenityIntro} ${amenities.length > 10 ? 'Highlights include' : ''} ${topAmenities.join(', ')}${remaining > 0 ? `, and ${remaining} additional features` : ''}. ${p.architect ? `The architectural vision comes from ${p.architect}, whose design approach shapes both the tower\'s exterior presence and the flow of interior living spaces.` : 'The design prioritizes seamless indoor-outdoor living, a hallmark of contemporary Miami residential architecture.'}`);
  }

  // === NEIGHBORHOOD ===
  if (ctx) {
    sections.push(`\n\n## Location in ${nh}\n\n${nh} is ${ctx.vibe}, and ${p.name} puts residents within reach of ${ctx.landmarks}. ${ctx.lifestyle}. ${p.address ? `The property is situated at ${p.address}, positioning residents at the center of this dynamic neighborhood.` : `For ${p.name} pre-construction buyers, the ${nh} location means strong rental demand and historically consistent appreciation.`}`);
  } else {
    sections.push(`\n\n## Location\n\n${p.name} is located in ${nh}, one of South Florida\'s most dynamic markets for new construction ${year}. ${p.address ? `The property address is ${p.address}.` : ''} The neighborhood continues to attract significant development investment, driven by population growth, favorable tax policy, and sustained demand from both domestic and international buyers.`);
  }

  // === DEVELOPER ===
  if (dev) {
    sections.push(`\n\n## Developer\n\n${dev} brings this project to the ${nh} market. ${p.name} reflects the developer\'s commitment to delivering quality residential product in South Florida\'s most competitive submarkets.`);
  }

  // === INVESTMENT / CLOSING ===
  const completionNote = p.estCompletion
    ? `With an estimated completion of ${p.estCompletion}, buyers`
    : 'Pre-construction buyers';

  sections.push(`\n\n## Investment Outlook\n\n${completionNote} at ${p.name} have the opportunity to lock in today\'s pricing in a ${nh} market that has seen consistent year-over-year appreciation. Miami new construction ${year} continues to attract capital from Latin America, Europe, and the Northeast U.S., and ${nh} condos remain among the most sought-after addresses in the region. ${p.totalUnits && p.totalUnits <= 50 ? `With only ${p.totalUnits} residences available, scarcity is a factor — limited inventory in boutique buildings tends to hold value well through market cycles.` : `As ${nh} continues to mature as a residential destination, early-phase buyers at ${p.name} stand to benefit from the neighborhood\'s upward trajectory.`}`);

  return sections.join('');
}

async function main() {
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*, neighborhood:neighborhoods(name, slug), developer:developers(name, slug)')
    .order('name');

  if (error || !projects) {
    console.error('Failed to fetch projects:', error);
    return;
  }

  console.log(`Generating descriptions for ${projects.length} projects...\n`);

  let completed = 0;
  let errors = 0;

  for (const project of projects) {
    try {
      const description = generateDescription(project);

      const { error: updateErr } = await supabase
        .from('projects')
        .update({ description })
        .eq('id', project.id);

      if (updateErr) {
        console.error(`  ERROR ${project.slug}: ${updateErr.message}`);
        errors++;
      } else {
        completed++;
        console.log(`  [${completed}/${projects.length}] ${project.slug} (${description.length} chars)`);
      }
    } catch (err: any) {
      console.error(`  ERROR ${project.slug}: ${err.message}`);
      errors++;
    }
  }

  console.log(`\n=== DONE: ${completed} descriptions updated, ${errors} errors ===`);
}

main().catch(console.error);
