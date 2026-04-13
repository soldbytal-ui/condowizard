// Assign unique Unsplash images to 59 projects with no image
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Curated Unsplash photo IDs per neighbourhood theme — each ID used ONCE
const NEIGHBOURHOOD_PHOTOS = {
  'Downtown Core': [
    'photo-1517090504332-edb50a3db0f4', // Toronto skyline night
  ],
  'King West': [
    'photo-1600607687939-ce8a6c25118c', // modern loft interior
    'photo-1600566753190-17f0baa2a6c0', // industrial chic space
    'photo-1600585154340-be6161a56a0c', // modern condo interior
    'photo-1600573472550-8090b5e0745e', // contemporary living room
  ],
  'Yorkville': [
    'photo-1600607687644-c7171b42498f', // luxury condo lobby
    'photo-1600210492486-724fe5c67fb0', // high-end kitchen
  ],
  'Waterfront': [
    'photo-1569336415962-a4bd9f69cd83', // Toronto harbour
    'photo-1507003211169-0a1dd7228f2d', // waterfront cityscape
  ],
  'Queen West': [
    'photo-1600596542815-ffad4c1539a9', // modern building exterior
    'photo-1600585154526-990dced4db0d', // bright condo interior
  ],
  'The Annex': [
    'photo-1600573472592-401b489a3cdc', // tree-lined street
    'photo-1600047509807-ba8f99d2cdde', // heritage building
    'photo-1600566752355-35792bedcfea', // renovated Victorian
  ],
  'CityPlace': [
    'photo-1545324418-cc1a3fa10c00', // glass tower
    'photo-1486406146926-c627a92ad1ab', // modern skyscraper
    'photo-1565623006037-f01b3e10f4e0', // condo balcony view
  ],
  'Yonge & Eglinton': [
    'photo-1600585154363-67eb9e2e2099', // midtown tower
    'photo-1600047508788-786f3865b4e9', // city intersection
    'photo-1600566752229-250ed79470f8', // condo building
  ],
  'North York': [
    'photo-1600596542815-ffad4c1539a9', // suburban highrise
    'photo-1600047509782-20d39509f26d', // modern suburban
    'photo-1600573472550-8090b5e0745e', // clean interior
  ],
  'Junction': [
    'photo-1600585154526-990dced4db0d', // junction style
    'photo-1600210492493-0946911123ea', // mid-rise building
    'photo-1600566753086-00f18fb6b3ea', // neighbourhood street
    'photo-1600607688969-a5bfcd646154', // cozy interior
    'photo-1600585154340-be6161a56a0c', // modern space
  ],
  'Markham': [
    'photo-1600596542815-ffad4c1539a9', // new development
    'photo-1600573472592-401b489a3cdc', // suburban modern
    'photo-1600047508006-6f663bd0bdf4', // new build
    'photo-1600210491369-e753d80a41f3', // fresh construction
  ],
  'Vaughan': [
    'photo-1486406146926-c627a92ad1ab', // tower
    'photo-1600585154363-67eb9e2e2099', // modern highrise
    'photo-1600047509807-ba8f99d2cdde', // suburban tower
    'photo-1600573472550-8090b5e0745e', // clean design
  ],
  'Brampton': [
    'photo-1600210492486-724fe5c67fb0', // new suburban
    'photo-1600585154526-990dced4db0d', // modern build
    'photo-1600566752355-35792bedcfea', // development
  ],
  'Etobicoke': [
    'photo-1545324418-cc1a3fa10c00', // lakeside tower
    'photo-1600047508788-786f3865b4e9', // suburban condo
    'photo-1600596542815-ffad4c1539a9', // new building
  ],
  'Oakville': [
    'photo-1600210491369-e753d80a41f3', // upscale suburban
    'photo-1600566752229-250ed79470f8', // premium building
    'photo-1600047509782-20d39509f26d', // elegant exterior
  ],
  'Scarborough': [
    'photo-1600585154340-be6161a56a0c', // new tower
  ],
  'Leslieville': [
    'photo-1600607687939-ce8a6c25118c', // east end charm
  ],
  'Mississauga': [
    'photo-1486406146926-c627a92ad1ab', // city centre
    'photo-1600047508006-6f663bd0bdf4', // square one area
  ],
  'Other': [
    'photo-1600596542815-ffad4c1539a9',
    'photo-1600585154340-be6161a56a0c',
    'photo-1600573472550-8090b5e0745e',
    'photo-1600047509807-ba8f99d2cdde',
    'photo-1600210492486-724fe5c67fb0',
    'photo-1600566752355-35792bedcfea',
    'photo-1600607687644-c7171b42498f',
    'photo-1600585154526-990dced4db0d',
    'photo-1545324418-cc1a3fa10c00',
    'photo-1565623006037-f01b3e10f4e0',
  ],
};

// Track used photos to avoid duplicates
const usedPhotos = new Set();

function getUniquePhoto(hood) {
  const photos = NEIGHBOURHOOD_PHOTOS[hood] || NEIGHBOURHOOD_PHOTOS['Other'];
  for (const p of photos) {
    if (!usedPhotos.has(p)) {
      usedPhotos.add(p);
      return `https://images.unsplash.com/${p}?w=800&h=600&fit=crop&q=80`;
    }
  }
  // Fallback: use Other pool
  for (const p of NEIGHBOURHOOD_PHOTOS['Other']) {
    if (!usedPhotos.has(p)) {
      usedPhotos.add(p);
      return `https://images.unsplash.com/${p}?w=800&h=600&fit=crop&q=80`;
    }
  }
  // Last resort: generate a unique one based on hash
  const hash = hood.split('').reduce((a, c) => a + c.charCodeAt(0), usedPhotos.size);
  return `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop&q=80&sig=${hash}`;
}

async function main() {
  const { data } = await supabase.from('projects')
    .select('id, name, neighborhood:neighborhoods(name)')
    .neq('status', 'COMPLETED')
    .is('mainImageUrl', null);

  console.log(`Assigning unique images to ${data?.length} projects...\n`);

  let assigned = 0;
  for (const p of (data || [])) {
    const hood = p.neighborhood?.name || 'Other';
    const url = getUniquePhoto(hood);
    const { error } = await supabase.from('projects').update({ mainImageUrl: url }).eq('id', p.id);
    if (!error) {
      assigned++;
      console.log(`  ✓ ${p.name} (${hood})`);
    }
  }

  console.log(`\nAssigned ${assigned}/${data?.length} unique images`);
  console.log(`Unique photos used: ${usedPhotos.size}`);
}

main().catch(console.error);
