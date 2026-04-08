/**
 * Scrape pre-construction projects from public real estate sites.
 * Uses fetch + cheerio (no Firecrawl needed).
 *
 * Usage: node scripts/scrape-preconstruction.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
  const m = line.match(/^([^=\s#]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';

async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
    if (!res.ok) { console.log(`  HTTP ${res.status} for ${url}`); return null; }
    return await res.text();
  } catch (e) { console.log(`  Fetch error: ${e.message}`); return null; }
}

// Get existing project names for dedup
async function getExistingNames() {
  const { data } = await supabase.from('projects').select('name, slug');
  const names = new Set();
  for (const p of data || []) {
    names.add(p.name.toLowerCase().trim());
    names.add(p.slug);
  }
  return names;
}

// Get neighborhood lookup
async function getNeighborhoods() {
  const { data } = await supabase.from('neighborhoods').select('id, name, slug');
  const lookup = {};
  for (const n of data || []) {
    lookup[n.name.toLowerCase()] = n.id;
    lookup[n.slug] = n.id;
  }
  return lookup;
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Geocode address with Mapbox
async function geocode(address) {
  if (!MAPBOX_TOKEN || !address) return null;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&limit=1&types=address,poi`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch {}
  return null;
}

// Generate footprint polygon
function rectFootprint(lat, lng, floors) {
  let w, h;
  if (floors >= 60) { w = 50; h = 30; }
  else if (floors >= 40) { w = 40; h = 25; }
  else if (floors >= 20) { w = 30; h = 20; }
  else { w = 20; h = 15; }
  const mLat = 111320, mLng = 111320 * Math.cos(lat * Math.PI / 180);
  const hw = w / 2 / mLng, hh = h / 2 / mLat;
  const rot = (-15 - Math.random() * 10) * Math.PI / 180;
  const c = Math.cos(rot), s = Math.sin(rot);
  const pts = [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([dx, dy]) => [
    lng + dx * c - dy * s, lat + dx * s + dy * c
  ]);
  pts.push(pts[0]);
  return { type: 'Polygon', coordinates: [pts] };
}

// ============================================================
// Scrapers
// ============================================================

async function scrapeMiamiResidential() {
  console.log('\n--- Scraping miamiresidential.com ---');
  const html = await fetchPage('https://miamiresidential.com/new-developments/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const projects = [];

  $('a[href*="/new-developments/"]').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (name && name.length > 3 && name.length < 100 && !name.includes('New Developments') && !name.includes('Menu')) {
      projects.push({ name, sourceUrl: href.startsWith('http') ? href : `https://miamiresidential.com${href}` });
    }
  });

  console.log(`  Found ${projects.length} project links`);
  return projects;
}

async function scrapeCondoBlackBook() {
  console.log('\n--- Scraping condoblackbook.com ---');
  const html = await fetchPage('https://www.condoblackbook.com/pre-construction/miami-fl/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const projects = [];

  $('a[href*="/pre-construction/"]').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (name && name.length > 3 && name.length < 100 && !name.includes('Pre-Construction') && !href.includes('miami-fl')) {
      projects.push({ name, sourceUrl: href.startsWith('http') ? href : `https://www.condoblackbook.com${href}` });
    }
  });

  console.log(`  Found ${projects.length} project links`);
  return projects;
}

async function scrapeMiamiResidence() {
  console.log('\n--- Scraping miamiresidence.com ---');
  const html = await fetchPage('https://www.miamiresidence.com/preconstruction.htm');
  if (!html) return [];
  const $ = cheerio.load(html);
  const projects = [];

  $('a').each((_, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (href.includes('preconstruction/') && name && name.length > 3 && name.length < 100) {
      projects.push({ name, sourceUrl: href.startsWith('http') ? href : `https://www.miamiresidence.com/${href}` });
    }
  });

  console.log(`  Found ${projects.length} project links`);
  return projects;
}

async function scrapeMiamiCondoInvestments() {
  console.log('\n--- Scraping miamicondoinvestments.com ---');
  const html = await fetchPage('https://www.miamicondoinvestments.com/preconstruction-condos');
  if (!html) return [];
  const $ = cheerio.load(html);
  const projects = [];

  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    // Look for project links (they typically have descriptive names)
    if (text && text.length > 5 && text.length < 80 && href.includes('miamicondoinvestments.com/') && !href.includes('/category/') && !href.includes('/preconstruction-condos') && !href.includes('/page/')) {
      projects.push({ name: text, sourceUrl: href });
    }
  });

  console.log(`  Found ${projects.length} project links`);
  return projects;
}

async function scrapeMiamiLuxuryHomes() {
  console.log('\n--- Scraping miamiluxuryhomes.com ---');
  const html = await fetchPage('https://www.miamiluxuryhomes.com/miami-new-construction-condos/');
  if (!html) return [];
  const $ = cheerio.load(html);
  const projects = [];

  $('a').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    if (text && text.length > 5 && text.length < 80 && href.includes('miamiluxuryhomes.com/') && (href.includes('residences') || href.includes('condos') || href.includes('tower'))) {
      projects.push({ name: text, sourceUrl: href });
    }
  });

  console.log(`  Found ${projects.length} project links`);
  return projects;
}

// ============================================================
// Main pipeline
// ============================================================

async function main() {
  console.log('Starting scrape of South Florida pre-construction projects...\n');

  const existingNames = await getExistingNames();
  const neighborhoods = await getNeighborhoods();
  console.log(`Existing projects: ${existingNames.size / 2} (name+slug pairs)`);

  // Scrape all sources
  const allScraped = [];
  const sources = [
    scrapeMiamiResidential,
    scrapeCondoBlackBook,
    scrapeMiamiResidence,
    scrapeMiamiCondoInvestments,
    scrapeMiamiLuxuryHomes,
  ];

  for (const scraper of sources) {
    try {
      const results = await scraper();
      allScraped.push(...results);
      await sleep(2000); // Be polite between sites
    } catch (e) {
      console.log(`  Scraper error: ${e.message}`);
    }
  }

  console.log(`\nTotal scraped: ${allScraped.length}`);

  // Deduplicate by name similarity
  const seen = new Set();
  const unique = [];
  for (const p of allScraped) {
    const normalized = p.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const slug = slugify(p.name);
    if (seen.has(normalized) || existingNames.has(p.name.toLowerCase().trim()) || existingNames.has(slug)) continue;
    seen.add(normalized);
    unique.push(p);
  }

  console.log(`After dedup: ${unique.length} new projects\n`);

  // Insert new projects
  let inserted = 0, failed = 0;

  for (const p of unique) {
    const slug = slugify(p.name);

    // Try to geocode
    let lat = null, lng = null;
    const geoResult = await geocode(`${p.name}, Miami, FL`);
    if (geoResult) { lat = geoResult.lat; lng = geoResult.lng; }

    // Generate footprint if we have coords
    let footprint = null;
    if (lat && lng) { footprint = rectFootprint(lat, lng, 30); }

    const record = {
      name: p.name,
      slug,
      status: 'PRE_CONSTRUCTION',
      category: 'PREMIUM',
      websiteUrl: p.sourceUrl || null,
      latitude: lat,
      longitude: lng,
      footprint,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('projects').insert(record);
    if (error) {
      if (error.code === '23505') { /* duplicate slug, skip */ }
      else { console.log(`  Insert error for ${p.name}: ${error.message}`); failed++; }
    } else {
      console.log(`  + ${p.name}${lat ? ` (${lat.toFixed(4)}, ${lng.toFixed(4)})` : ''}`);
      inserted++;
    }

    await sleep(500); // Rate limit geocoding
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Done! Inserted: ${inserted}, Failed: ${failed}, Skipped: ${unique.length - inserted - failed}`);

  // Final count
  const { data: final } = await supabase.from('projects').select('id');
  console.log(`Total projects in DB: ${final?.length || 0}`);
}

main().catch(console.error);
