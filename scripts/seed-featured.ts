import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnyrtptmcazhmoztmuay.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const FEATURED_BUILDINGS = [
  {
    name: 'Waldorf Astoria Residences Miami',
    slug: 'waldorf-astoria-residences-miami',
    address: '300 Biscayne Blvd Way, Miami, FL 33131',
    latitude: 25.7744,
    longitude: -80.1873,
    floors: 100,
    totalUnits: 360,
    priceMin: 1000000,
    priceMax: 50000000,
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY_BRANDED',
    estCompletion: '2028',
    architect: 'Carlos Ott / Sieger Suarez',
    featured: true,
    description: 'Rising 100 stories above Biscayne Bay, the Waldorf Astoria Residences Miami will be the tallest residential tower south of New York City. Developed by Property Markets Group (PMG), Greybrook, S2 Development, and Mohari Hospitality, this landmark tower brings Waldorf Astoria\'s legendary white-glove service to Miami\'s skyline. Residents will enjoy a sky lounge, resort-style pool deck, world-class spa, private dining, and panoramic 360-degree views of Miami, the Atlantic Ocean, and the Everglades.',
    amenities: JSON.stringify([
      'Sky Lounge', 'Resort Pool Deck', 'Full-Service Spa', 'Private Dining',
      'Fitness Center', 'Concierge', 'Valet Parking', 'Wine Vault',
      'Theater Room', 'Children\'s Playroom', 'Business Center', 'Dog Park'
    ]),
  },
  {
    name: 'Mercedes-Benz Places Miami',
    slug: 'mercedes-benz-places-miami',
    address: '1 Southside Park, Miami, FL 33130',
    latitude: 25.7618,
    longitude: -80.1940,
    floors: 67,
    totalUnits: 791,
    priceMin: 600000,
    priceMax: 8000000,
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY_BRANDED',
    estCompletion: '2027',
    architect: 'SHoP Architects',
    featured: true,
    description: 'The first Mercedes-Benz branded residences in the United States, designed by the acclaimed SHoP Architects. Developed by JDS Development Group, this 67-story tower in Brickell reimagines luxury living through the lens of automotive excellence. Featuring cutting-edge smart home technology, a signature Mercedes-Benz design aesthetic throughout, and world-class amenities including a rooftop pool, spa, fitness center, and private dining experiences.',
    amenities: JSON.stringify([
      'Mercedes-Benz Concierge', 'Rooftop Pool', 'Spa & Wellness Center', 'Smart Home Technology',
      'Private Dining', 'Fitness Center', 'Co-Working Spaces', 'EV Charging Stations',
      'Children\'s Area', 'Pet Spa', 'Theater', 'Game Room'
    ]),
  },
  {
    name: '888 Brickell by Dolce & Gabbana',
    slug: '888-brickell-by-dolce-gabbana',
    address: '888 Brickell Ave, Miami, FL 33131',
    latitude: 25.7655,
    longitude: -80.1920,
    floors: 90,
    totalUnits: 259,
    priceMin: 2500000,
    priceMax: 50000000,
    status: 'PRE_CONSTRUCTION',
    category: 'ULTRA_LUXURY',
    estCompletion: '2029',
    architect: 'Studio Sofield',
    featured: true,
    description: 'The first-ever branded residences by Dolce & Gabbana, this 90-story supertall tower redefines luxury living in Brickell. Developed by JDS Development Group, 888 Brickell features interiors curated entirely by the iconic Italian fashion house through Studio Sofield. Every detail reflects D&G\'s legendary aesthetic — from custom furnishings to bespoke finishes. Amenities include a world-class spa, rooftop pool, private dining by Dolce & Gabbana, and unparalleled views of Biscayne Bay.',
    amenities: JSON.stringify([
      'D&G Curated Interiors', 'Private D&G Dining', 'Rooftop Infinity Pool', 'Full-Service Spa',
      'Wine Cellar & Cigar Lounge', 'Private Cinema', 'Fitness Center', 'Concierge',
      'Children\'s Playroom', 'Pet Grooming', 'Valet Parking', 'Marina Access'
    ]),
  },
  {
    name: 'Baccarat Residences Miami',
    slug: 'baccarat-residences-miami',
    address: '99 SE 5th St, Miami, FL 33131',
    latitude: 25.7730,
    longitude: -80.1910,
    floors: 77,
    totalUnits: 360,
    priceMin: 1700000,
    priceMax: 40000000,
    status: 'UNDER_CONSTRUCTION',
    category: 'LUXURY_BRANDED',
    estCompletion: '2028',
    architect: 'Arquitectonica',
    featured: true,
    description: 'A 77-story crystal-inspired tower by Related Group featuring Baccarat Hotel & Residences\' legendary French hospitality. Designed by Arquitectonica with interiors that incorporate Baccarat\'s iconic crystal elements throughout. Residents enjoy the Baccarat Spa, infinity pool overlooking Biscayne Bay, private dining experiences, and the meticulous service that defines the Baccarat brand. Every residence features custom Baccarat crystal fixtures and finishes.',
    amenities: JSON.stringify([
      'Baccarat Spa', 'Infinity Pool', 'Baccarat Crystal Fixtures', 'Private Dining',
      'Wine Vault', 'Fitness Center', 'Concierge', 'Theater',
      'Children\'s Area', 'Business Center', 'Valet Parking', 'Pet Amenities'
    ]),
  },
  {
    name: 'ORA by Casa Tua',
    slug: 'ora-by-casa-tua',
    address: '1210 Brickell Ave, Miami, FL 33131',
    latitude: 25.7610,
    longitude: -80.1950,
    floors: 76,
    totalUnits: 540,
    priceMin: 850000,
    priceMax: 15000000,
    status: 'PRE_CONSTRUCTION',
    category: 'LUXURY_BRANDED',
    estCompletion: '2029',
    architect: 'Arquitectonica',
    featured: true,
    description: 'ORA by Casa Tua brings the legendary hospitality of Miami Beach\'s most exclusive members-only Italian restaurant to a 76-story residential tower in Brickell. Developed by Major Food Group and JDS Development Group, ORA offers residents private Casa Tua dining, a rooftop pool and lounge, full-service spa, and the intimate, sophisticated atmosphere that has made Casa Tua an icon of Miami\'s dining scene for over two decades.',
    amenities: JSON.stringify([
      'Private Casa Tua Dining', 'Rooftop Pool & Lounge', 'Full-Service Spa', 'Fitness Center',
      'Wine Bar', 'Private Event Space', 'Concierge', 'Co-Working Lounge',
      'Children\'s Playroom', 'Pet Spa', 'Valet Parking', 'Bicycle Storage'
    ]),
  },
];

async function seed() {
  console.log('Seeding 5 featured buildings...\n');

  // Get or create the Brickell and Downtown neighborhoods
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, name, slug');

  const findNeighborhood = (address: string) => {
    if (address.includes('Brickell')) return neighborhoods?.find(n => n.slug === 'brickell');
    if (address.includes('Downtown') || address.includes('Biscayne')) return neighborhoods?.find(n => n.slug === 'downtown-miami');
    return null;
  };

  // Get or create developers
  const developerNames = ['Property Markets Group (PMG)', 'JDS Development Group', 'Related Group', 'Major Food Group'];
  for (const name of developerNames) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const { error } = await supabase.from('developers').upsert({ name, slug }, { onConflict: 'slug' });
    if (error && !error.message.includes('duplicate')) console.log(`Dev ${name}:`, error.message);
  }

  const { data: developers } = await supabase.from('developers').select('id, name, slug');

  for (const building of FEATURED_BUILDINGS) {
    const hood = findNeighborhood(building.address);
    let devId = null;

    if (building.name.includes('Waldorf')) {
      devId = developers?.find(d => d.name.includes('PMG'))?.id;
    } else if (building.name.includes('Mercedes') || building.name.includes('888')) {
      devId = developers?.find(d => d.name.includes('JDS'))?.id;
    } else if (building.name.includes('Baccarat')) {
      devId = developers?.find(d => d.name.includes('Related'))?.id;
    } else if (building.name.includes('ORA')) {
      devId = developers?.find(d => d.name.includes('Major Food'))?.id;
    }

    const row = {
      ...building,
      neighborhoodId: hood?.id || null,
      developerId: devId || null,
    };

    // Try to find existing by slug
    const { data: existing } = await supabase
      .from('projects')
      .select('id')
      .eq('slug', building.slug)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('projects')
        .update(row)
        .eq('id', existing.id);
      console.log(`Updated: ${building.name}${error ? ' (error: ' + error.message + ')' : ''}`);
    } else {
      // Also check by name (fuzzy match)
      const { data: byName } = await supabase
        .from('projects')
        .select('id, slug')
        .ilike('name', `%${building.name.split(' ').slice(0, 2).join('%')}%`)
        .limit(1)
        .single();

      if (byName) {
        const { error } = await supabase
          .from('projects')
          .update(row)
          .eq('id', byName.id);
        console.log(`Updated (matched by name): ${building.name}${error ? ' (error: ' + error.message + ')' : ''}`);
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(row);
        console.log(`Inserted: ${building.name}${error ? ' (error: ' + error.message + ')' : ''}`);
      }
    }
  }

  // Verify
  const { data: featured, count } = await supabase
    .from('projects')
    .select('name, slug, latitude, longitude, floors, featured', { count: 'exact' })
    .eq('featured', true);

  console.log(`\nTotal featured projects: ${count}`);
  featured?.forEach(p => console.log(`  - ${p.name} (${p.floors}F, lat:${p.latitude}, lng:${p.longitude})`));
}

seed().catch(console.error);
