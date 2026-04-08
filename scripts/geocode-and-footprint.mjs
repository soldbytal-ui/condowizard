/**
 * Geocode all projects and generate footprints.
 * 1. For projects without lat/lng, assign coordinates based on neighborhood center + random offset
 * 2. For projects without footprints, generate rectangular footprints based on floor count
 *
 * Usage: node scripts/geocode-and-footprint.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^=\s#]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Neighborhood center coordinates
const NEIGHBORHOOD_CENTERS = {
  'cmnbuec4p00003f5ov49exx07': { name: 'Brickell', lat: 25.7635, lng: -80.1940 },
  'cmnbuecao00013f5o1w2z0gb0': { name: 'Miami Beach', lat: 25.7907, lng: -80.1300 },
  'cmnbueccl00023f5orpfahehm': { name: 'Downtown Miami', lat: 25.7750, lng: -80.1900 },
  'cmnbueceg00033f5os23v77go': { name: 'Edgewater', lat: 25.7950, lng: -80.1870 },
  'cmnbuecgc00043f5oig7vrn2r': { name: 'Sunny Isles Beach', lat: 25.9430, lng: -80.1240 },
  'cmnbuecia00053f5oa74nrxuz': { name: 'Coconut Grove', lat: 25.7280, lng: -80.2410 },
  'cmnbueck800063f5omf7znhww': { name: 'Surfside', lat: 25.8785, lng: -80.1258 },
  'cmnbuecm400073f5o0w35cqiu': { name: 'Hollywood', lat: 25.9870, lng: -80.1490 },
  'cmnbuecr200083f5oecod3jkv': { name: 'Aventura', lat: 25.9565, lng: -80.1392 },
  'cmnbuecsz00093f5o08k0qznv': { name: 'Midtown/Wynwood', lat: 25.8050, lng: -80.1990 },
  'cmnbuecuw000a3f5oktp4hy9c': { name: 'Coral Gables', lat: 25.7210, lng: -80.2680 },
  'cmnbuecwv000b3f5o354eq5h9': { name: 'Fort Lauderdale', lat: 26.1224, lng: -80.1373 },
  'cmnbuecyu000c3f5orc5bwv62': { name: 'Bal Harbour', lat: 25.8920, lng: -80.1270 },
  'cmnbued0r000d3f5ohacftlk2': { name: 'Key Biscayne', lat: 25.6935, lng: -80.1627 },
  'cmnbued3s000e3f5oucqk46cg': { name: 'Bay Harbor Islands', lat: 25.8870, lng: -80.1320 },
  'cmnbued5p000f3f5osx1f23ju': { name: 'Palm Beach', lat: 26.7056, lng: -80.0364 },
};

// Default center for projects without a neighborhood
const DEFAULT_CENTER = { lat: 25.7750, lng: -80.1900 };

const M_PER_DEG_LAT = 111320;
const mPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

function rectFootprint(lat, lng, w, h, rotDeg) {
  const hw = w / 2, hh = h / 2;
  const rad = (rotDeg * Math.PI) / 180;
  const c = Math.cos(rad), s = Math.sin(rad);
  const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => {
    const rdx = dx * c - dy * s, rdy = dx * s + dy * c;
    return [lng + rdx / mPerDegLng(lat), lat + rdy / M_PER_DEG_LAT];
  });
  pts.push(pts[0]);
  return { type: 'Polygon', coordinates: [pts] };
}

function footprintForFloors(lat, lng, floors) {
  let w, h;
  if (floors >= 60) { w = 50; h = 30; }
  else if (floors >= 40) { w = 40; h = 25; }
  else if (floors >= 20) { w = 30; h = 20; }
  else { w = 20; h = 15; }
  // Random rotation aligned roughly to Miami street grid (-15 to -25 deg)
  const rot = -15 - Math.random() * 10;
  return rectFootprint(lat, lng, w, h, rot);
}

// Seeded random for consistent but spread-out placement
let seed = 42;
function seededRandom() {
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

async function main() {
  console.log('Fetching all projects...');
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, latitude, longitude, floors, neighborhoodId, footprint')
    .order('name');

  if (error) { console.error(error); process.exit(1); }
  console.log(`Total projects: ${projects.length}`);

  let geocoded = 0, footprinted = 0, skipped = 0;

  for (const p of projects) {
    const updates = {};

    // Step 1: Assign coordinates if missing
    if (!p.latitude || !p.longitude) {
      const center = NEIGHBORHOOD_CENTERS[p.neighborhoodId] || DEFAULT_CENTER;
      // Spread within ~500m radius of neighborhood center
      const offsetLat = (seededRandom() - 0.5) * 0.008; // ~450m
      const offsetLng = (seededRandom() - 0.5) * 0.008;
      updates.latitude = center.lat + offsetLat;
      updates.longitude = center.lng + offsetLng;
      geocoded++;
    }

    const lat = updates.latitude || p.latitude;
    const lng = updates.longitude || p.longitude;

    // Step 2: Generate footprint if missing
    if (!p.footprint && lat && lng) {
      const floors = p.floors || 15;
      updates.footprint = footprintForFloors(lat, lng, floors);
      footprinted++;
    }

    // Save
    if (Object.keys(updates).length > 0) {
      const { error: upErr } = await supabase.from('projects').update(updates).eq('id', p.id);
      if (upErr) {
        console.log(`  ERROR ${p.name}: ${upErr.message}`);
      }
    } else {
      skipped++;
    }
  }

  console.log(`\nDone!`);
  console.log(`  Geocoded: ${geocoded}`);
  console.log(`  Footprinted: ${footprinted}`);
  console.log(`  Already complete: ${skipped}`);
  console.log(`  Total: ${projects.length}`);

  // Verify
  const { data: check } = await supabase
    .from('projects')
    .select('id')
    .not('footprint', 'is', null);
  console.log(`\nProjects with footprints in DB: ${check?.length || 0}`);
}

main().catch(console.error);
