/**
 * Fetch building footprints from OSM Overpass API for ALL projects.
 * For pre-construction buildings without OSM data, generate realistic shaped polygons.
 *
 * Usage: node scripts/fetch-footprints.mjs
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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

// ============================================================
// Geometry helpers
// ============================================================

const M_PER_DEG_LAT = 111320;
const mPerDegLng = (lat) => 111320 * Math.cos((lat * Math.PI) / 180);

/** Convert meter offsets to lng/lat offsets */
function mToCoord(lat, lng, dxM, dyM) {
  return [lng + dxM / mPerDegLng(lat), lat + dyM / M_PER_DEG_LAT];
}

/** Rotate a point [dx,dy] around origin by angle (radians) */
function rotate(dx, dy, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  return [dx * c - dy * s, dx * s + dy * c];
}

/** Generate a polygon from meter-space points, centered on lat/lng with rotation */
function polyFromPoints(lat, lng, points, rotRad) {
  const coords = points.map(([dx, dy]) => {
    const [rdx, rdy] = rotate(dx, dy, rotRad);
    return mToCoord(lat, lng, rdx, rdy);
  });
  coords.push(coords[0]); // close
  return { type: 'Polygon', coordinates: [coords] };
}

/** Simple rectangle */
function rectFootprint(lat, lng, w, h, rotDeg) {
  const hw = w / 2, hh = h / 2;
  return polyFromPoints(lat, lng, [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]], (rotDeg * Math.PI) / 180);
}

/** Octagon (8 sides) — for Waldorf's twisting design */
function octagonFootprint(lat, lng, radius, rotDeg) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i * 45 + 22.5) * Math.PI) / 180;
    pts.push([radius * Math.cos(a), radius * Math.sin(a)]);
  }
  return polyFromPoints(lat, lng, pts, (rotDeg * Math.PI) / 180);
}

/** L-shape — two overlapping rectangles */
function lShapeFootprint(lat, lng, w1, h1, w2, h2, rotDeg) {
  // Main rect on left, wing extending right from bottom
  const pts = [
    [-w1 / 2, -h1 / 2],
    [w1 / 2, -h1 / 2],
    [w1 / 2, -h1 / 2 + h2],
    [w1 / 2 + w2, -h1 / 2 + h2],
    [w1 / 2 + w2, h1 / 2],
    [-w1 / 2, h1 / 2],
  ];
  return polyFromPoints(lat, lng, pts, (rotDeg * Math.PI) / 180);
}

/** Rectangle with chamfered corners */
function chamferedRectFootprint(lat, lng, w, h, chamfer, rotDeg) {
  const hw = w / 2, hh = h / 2, c = chamfer;
  const pts = [
    [-hw + c, -hh], [hw - c, -hh],
    [hw, -hh + c], [hw, hh - c],
    [hw - c, hh], [-hw + c, hh],
    [-hw, hh - c], [-hw, -hh + c],
  ];
  return polyFromPoints(lat, lng, pts, (rotDeg * Math.PI) / 180);
}

/** Trapezoid — wider base, narrower top */
function trapezoidFootprint(lat, lng, baseW, topW, h, rotDeg) {
  const hh = h / 2;
  const pts = [
    [-baseW / 2, -hh], [baseW / 2, -hh],
    [topW / 2, hh], [-topW / 2, hh],
  ];
  return polyFromPoints(lat, lng, pts, (rotDeg * Math.PI) / 180);
}

/** Curved polygon — arc on one side */
function curvedFootprint(lat, lng, w, h, curveDepth, segments, rotDeg) {
  const hw = w / 2, hh = h / 2;
  const pts = [];
  // Bottom (straight)
  pts.push([-hw, -hh], [hw, -hh]);
  // Right side (straight)
  pts.push([hw, hh]);
  // Top (curved — arc from right to left)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = hw - t * w;
    const y = hh + curveDepth * Math.sin(t * Math.PI);
    pts.push([x, y]);
  }
  // Left side closes automatically
  return polyFromPoints(lat, lng, pts, (rotDeg * Math.PI) / 180);
}

// ============================================================
// Custom shapes for the 5 featured pre-construction buildings
// ============================================================

const CUSTOM_FOOTPRINTS = {
  'waldorf-astoria-residences-miami': (lat, lng) => octagonFootprint(lat, lng, 25, -20),
  'waldorf-astoria-pompano-beach': (lat, lng) => octagonFootprint(lat, lng, 25, -20),
  'mercedes-benz-places-miami': (lat, lng) => lShapeFootprint(lat, lng, 30, 40, 20, 25, -25),
  '888-brickell-by-dolce-and-gabbana': (lat, lng) => chamferedRectFootprint(lat, lng, 20, 45, 5, -20),
  'baccarat-residences-miami': (lat, lng) => trapezoidFootprint(lat, lng, 30, 22, 35, -15),
  'ora-by-casa-tua': (lat, lng) => curvedFootprint(lat, lng, 28, 35, 8, 12, -20),
};

// Default for pre-construction buildings without OSM data
const DEFAULT_ROT = -20; // Brickell grid angle

// ============================================================
// OSM Overpass API
// ============================================================

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchOSMFootprint(lat, lng) {
  const query = `[out:json][timeout:10];way["building"](around:50,${lat},${lng});out body;>;out skel qt;`;
  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return null;
    const data = await res.json();

    const nodes = {};
    for (const el of data.elements) {
      if (el.type === 'node') nodes[el.id] = [el.lon, el.lat];
    }

    // Find the best way (largest by node count)
    let bestWay = null, bestCount = 0;
    for (const el of data.elements) {
      if (el.type === 'way' && el.nodes && el.nodes.length > bestCount) {
        const allFound = el.nodes.every(id => nodes[id]);
        if (allFound) { bestWay = el; bestCount = el.nodes.length; }
      }
    }

    if (bestWay && bestCount >= 4) {
      const coords = bestWay.nodes.map(id => nodes[id]);
      if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
        coords.push(coords[0]);
      }
      return { type: 'Polygon', coordinates: [coords] };
    }
    return null;
  } catch { return null; }
}

// ============================================================
// Main
// ============================================================

async function main() {
  console.log('Fetching ALL projects from Supabase...');
  const { data: projects, error } = await supabase
    .from('projects')
    .select('id, name, slug, latitude, longitude, floors, status')
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) { console.error(error); process.exit(1); }
  console.log(`Found ${projects.length} projects with coordinates\n`);

  let osmHits = 0, customHits = 0, defaultHits = 0, errors = 0;

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    console.log(`[${i+1}/${projects.length}] ${p.name}`);

    let footprint;

    // 1. Check for custom shape
    if (CUSTOM_FOOTPRINTS[p.slug]) {
      footprint = CUSTOM_FOOTPRINTS[p.slug](p.latitude, p.longitude);
      console.log('  -> Custom shape');
      customHits++;
    } else {
      // 2. Try OSM Overpass
      console.log('  -> Querying OSM...');
      footprint = await fetchOSMFootprint(p.latitude, p.longitude);
      if (footprint) {
        console.log(`  -> OSM footprint (${footprint.coordinates[0].length} pts)`);
        osmHits++;
      } else {
        // 3. Fallback to default rectangle
        footprint = rectFootprint(p.latitude, p.longitude, 30, 20, DEFAULT_ROT);
        console.log('  -> Default rectangle');
        defaultHits++;
      }
      // Rate limit for Overpass
      await sleep(1100);
    }

    // Save to Supabase
    const { error: upErr } = await supabase
      .from('projects')
      .update({ footprint })
      .eq('id', p.id);

    if (upErr) {
      console.log(`  -> DB ERROR: ${upErr.message}`);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`Done!`);
  console.log(`  OSM footprints: ${osmHits}`);
  console.log(`  Custom shapes:  ${customHits}`);
  console.log(`  Default rects:  ${defaultHits}`);
  console.log(`  DB errors:      ${errors}`);
  console.log(`  Total:          ${projects.length}`);
}

main().catch(console.error);
