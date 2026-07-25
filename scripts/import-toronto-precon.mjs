/**
 * Import Toronto pre-construction projects from CSV into Supabase.
 *
 * Usage:
 *   node scripts/import-toronto-precon.mjs                → import all
 *   node scripts/import-toronto-precon.mjs --limit=10     → first N
 *   node scripts/import-toronto-precon.mjs --start=11 --limit=10
 *
 * Reads:  ~/Desktop/toronto_precon_100_v2 - Toronto Precon 100.csv
 * Writes: projects, developers, neighborhoods tables in Supabase.
 * Geocodes via Mapbox using NEXT_PUBLIC_MAPBOX_TOKEN from .env.local.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { findBestImage } from './scrape-precon-images-lib.mjs';
import {
  buildStructuredContent,
  buildPlainDescription,
  buildMetaTitle,
  buildMetaDescription,
  buildFaqs,
  buildAmenities,
  lintContent,
} from './precon-content/generate.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const text = fs.readFileSync(envPath, 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}
loadEnv();

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const prisma = new PrismaClient();

// ─── Args ─────────────────────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  })
);
const LIMIT = args.limit ? parseInt(args.limit, 10) : 999;
const START = args.start ? parseInt(args.start, 10) : 1;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[éèê]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ûü]/g, 'u')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cuid() {
  return 'c' + createHash('sha256').update(Math.random() + '-' + Date.now()).digest('base64url').slice(0, 24).toLowerCase();
}

function parsePrice(text) {
  if (!text) return null;
  const clean = String(text).replace(/[$,\s]/g, '').toLowerCase();
  const m = clean.match(/(\d+(?:\.\d+)?)(k|m)?/);
  if (!m) return null;
  let n = parseFloat(m[1]);
  if (m[2] === 'k') n *= 1000;
  if (m[2] === 'm') n *= 1000000;
  // Handle "600000s" or "500000s"
  if (n < 1000) n *= 1000;
  return Math.round(n);
}

function inferCategory(priceMin, name, notable) {
  const text = `${name} ${notable || ''}`.toLowerCase();
  if (text.includes('ultra-luxury') || text.includes('ultra luxury')) return 'ULTRA_LUXURY';
  if (text.includes('luxury') && (text.includes('branded') || text.includes('hotel') || text.includes('residences'))) return 'LUXURY_BRANDED';
  if (priceMin && priceMin >= 3000000) return 'ULTRA_LUXURY';
  if (priceMin && priceMin >= 1500000) return 'LUXURY';
  if (priceMin && priceMin >= 800000) return 'PREMIUM';
  if (priceMin && priceMin < 600000) return 'AFFORDABLE_LUXURY';
  if (text.includes('boutique') && text.includes('luxury')) return 'LUXURY';
  return 'PREMIUM';
}

function inferStatus(csvStatus, stage) {
  const s = (stage || '').toLowerCase();
  const status = (csvStatus || '').toLowerCase();
  if (status.includes('coming soon') || s.includes('registration')) return 'PRE_LAUNCH';
  if (s.includes('under construction') || s.includes('structure rising') || s.includes('structure at') || s.includes('early structure')) return 'UNDER_CONSTRUCTION';
  if (s.includes('near complet') || s.includes('finishing')) return 'NEAR_COMPLETION';
  if (s.includes('sold out') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

// Map CSV neighborhood + area → site slug (matches TRANSIT_BY_SLUG where possible)
function mapNeighborhood(csvNeighborhood, csvArea) {
  const n = (csvNeighborhood || '').toLowerCase();
  const a = (csvArea || '').toLowerCase();

  // Downtown & Waterfront
  if (n.includes('harbourfront') || n.includes('east bayfront') || n.includes('quayside')) return { slug: 'waterfront', name: 'Toronto Waterfront', region: 'Downtown & Waterfront' };
  if (n.includes('entertainment district') || n.includes('king west') || n.includes('west queen west')) return { slug: 'king-west', name: 'King West', region: 'Downtown & Waterfront' };
  if (n.includes('queen west') || n.includes('fashion district')) return { slug: 'queen-west', name: 'Queen West', region: 'Downtown & Waterfront' };
  if (n.includes('st. lawrence') || n.includes('st lawrence') || n.includes('old town') || n.includes('king east')) return { slug: 'st-lawrence', name: 'St. Lawrence & Old Town', region: 'Downtown & Waterfront' };
  if (n.includes('regent park')) return { slug: 'regent-park', name: 'Regent Park', region: 'Downtown & Waterfront' };
  if (n.includes('church-wellesley') || n.includes('church wellesley') || n.includes('village')) return { slug: 'church-wellesley', name: 'Church-Wellesley Village', region: 'Downtown & Waterfront' };
  if (n.includes('church-yonge') || n.includes('downtown yonge') || n.includes('moss park') || n.includes('garden district') || n.includes('bay street') || n.includes('discovery district') || n.includes('financial district') || n.includes('downtown core')) return { slug: 'downtown-core', name: 'Downtown Core', region: 'Downtown & Waterfront' };

  // Midtown & Central
  if (n.includes('yorkville') || n.includes('bloor-yonge') || n.includes('bloor yorkville')) return { slug: 'yorkville', name: 'Yorkville', region: 'Midtown & Central' };
  if (n.includes('annex') || n.includes('museum district')) return { slug: 'the-annex', name: 'The Annex', region: 'Midtown & Central' };
  if (n.includes('summerhill') || n.includes('rosedale')) return { slug: 'summerhill-rosedale', name: 'Summerhill & Rosedale', region: 'Midtown & Central' };
  if (n.includes('yonge & st. clair') || n.includes('yonge & st clair') || n.includes('yonge and st. clair') || n.includes('deer park') || n.includes('avenue & st. clair')) return { slug: 'yonge-st-clair', name: 'Yonge & St. Clair', region: 'Midtown & Central' };
  if (n.includes('forest hill')) return { slug: 'forest-hill', name: 'Forest Hill', region: 'Midtown & Central' };
  if (n.includes('casa loma')) return { slug: 'casa-loma', name: 'Casa Loma', region: 'Midtown & Central' };
  if (n.includes('yonge & eglinton') || n.includes('yonge and eglinton') || n.includes('lytton park') || n.includes('davisville')) return { slug: 'yonge-eglinton', name: 'Yonge & Eglinton', region: 'Midtown & Central' };
  if (n.includes('humewood') || n.includes('st. clair west') || n.includes('st clair west')) return { slug: 'st-clair-west', name: 'St. Clair West', region: 'Midtown & Central' };
  if (n.includes('keelesdale') || n.includes('eglinton west')) return { slug: 'eglinton-west', name: 'Eglinton West', region: 'Midtown & Central' };
  if (n.includes('designers walk')) return { slug: 'the-annex', name: 'The Annex', region: 'Midtown & Central' };

  // North York — subhoods collapse to north-york except Don Mills
  if (n.includes('don mills') && n.includes('sheppard')) return { slug: 'don-mills', name: 'Don Mills', region: 'North York' };
  if (n.includes('don mills') || n.includes('lansing') || n.includes('don valley village') || n.includes('fairview')) return { slug: 'don-mills', name: 'Don Mills', region: 'North York' };
  if (n.includes('newtonbrook') || n.includes('yonge-finch') || n.includes('yonge finch')
      || n.includes('yonge-sheppard') || n.includes('yonge sheppard')
      || n.includes('north york centre') || n.includes('bayview & finch') || n.includes('bayview and finch')
      || n.includes('bayview village') || n.includes('concord park')
      || n.includes('yonge & steeles') || n.includes('yonge and steeles')
      || n.includes('henry farm') || n.includes('sheppard & victoria park') || n.includes('sheppard and victoria park')
      || n.includes('downsview') || n.includes('yzd')
      || n.includes('yonge & york mills') || n.includes('york mills')
      || n.includes('bridle path')
      || n.includes('glencairn') || n.includes('lawrence heights') || n.includes('glen park') || n.includes('lawrence allen')
      || n.includes('north york')) return { slug: 'north-york', name: 'North York Centre', region: 'North York' };

  // Etobicoke — everything west of Humber collapses to etobicoke
  if (n.includes('etobicoke') || n.includes('islington') || n.includes('kipling')
      || n.includes('the queensway') || n.includes('queensway')
      || n.includes('mimico') || n.includes('humber bay') || n.includes('long branch')
      || n.includes('new toronto') || n.includes('kingsway')) return { slug: 'etobicoke', name: 'Etobicoke', region: 'Etobicoke' };

  // Scarborough — everything east of Victoria Park collapses to scarborough
  if (n.includes('scarborough') || n.includes('cliffside') || n.includes('birch cliff')
      || n.includes('dorset park') || n.includes('tam o\'shanter') || n.includes('sullivan')
      || n.includes('woburn') || n.includes('cedarbrae') || n.includes('clairlea') || n.includes('birchmount')
      || n.includes('agincourt') || n.includes('kennedy & 401') || n.includes('kennedy and 401')
      || n.includes('west hill') || n.includes('golden mile') || n.includes('eglinton east')) return { slug: 'scarborough', name: 'Scarborough', region: 'Scarborough' };

  // East end
  if (n.includes('leaside')) return { slug: 'leaside', name: 'Leaside', region: 'East End' };
  if (n.includes('leslieville')) return { slug: 'leslieville', name: 'Leslieville', region: 'East End' };
  if (n.includes('riverside') || n.includes('east harbour')) return { slug: 'riverside', name: 'Riverside', region: 'East End' };
  if (n.includes('danforth') || n.includes('east york')) return { slug: 'danforth', name: 'The Danforth', region: 'East End' };

  // West end
  if (n.includes('high park') || n.includes('swansea') || n.includes('sunnyside')) return { slug: 'high-park', name: 'High Park', region: 'West End' };
  if (n.includes('junction') || n.includes('stockyards') || n.includes('wallace emerson')) return { slug: 'junction', name: 'The Junction', region: 'West End' };
  if (n.includes('roncesvalles') || n.includes('parkdale')) return { slug: 'roncesvalles', name: 'Roncesvalles / Parkdale', region: 'West End' };
  if (n.includes('mount dennis')) return { slug: 'mount-dennis', name: 'Mount Dennis', region: 'West End' };
  if (n.includes('trinity bellwoods') && n.includes('king')) return { slug: 'king-west', name: 'King West', region: 'Downtown & Waterfront' };

  // GTA
  if (n.includes('markham')) return { slug: 'markham', name: 'Markham', region: 'GTA' };
  if (n.includes('vaughan')) return { slug: 'vaughan', name: 'Vaughan', region: 'GTA' };
  if (n.includes('mississauga')) return { slug: 'mississauga', name: 'Mississauga', region: 'GTA' };
  if (n.includes('richmond hill')) return { slug: 'richmond-hill', name: 'Richmond Hill', region: 'GTA' };
  if (n.includes('oakville')) return { slug: 'oakville', name: 'Oakville', region: 'GTA' };
  if (n.includes('brampton')) return { slug: 'brampton', name: 'Brampton', region: 'GTA' };

  // Area-level fallback
  if (a.includes('downtown')) return { slug: 'downtown-core', name: 'Downtown Core', region: 'Downtown & Waterfront' };
  if (a.includes('midtown')) return { slug: 'midtown', name: 'Midtown Toronto', region: 'Midtown & Central' };
  if (a.includes('north york')) return { slug: 'north-york', name: 'North York', region: 'North York' };

  return { slug: 'toronto', name: 'Toronto', region: 'Greater Toronto Area' };
}

async function geocode(address) {
  if (!MAPBOX_TOKEN || !address) return { lat: null, lng: null };
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=CA&limit=1&proximity=-79.3832,43.6532`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.[0]) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch (e) {
    console.error('Geocode fail:', address, e.message);
  }
  return { lat: null, lng: null };
}

// Content generation is delegated to ./precon-content/generate.mjs
// Anything below this line is CSV → project-shape mapping only.

// ─── CSV parser ───────────────────────────────────────────────────────────────
function parseCsv(text) {
  const rows = [];
  let i = 0, field = '', row = [], inQuotes = false;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i += 2; continue; }
      if (c === '"') { inQuotes = false; i++; continue; }
      field += c; i++;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ',') { row.push(field); field = ''; i++; continue; }
      if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue; }
      if (c === '\r') { i++; continue; }
      field += c; i++;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const header = rows.shift().map((h) => h.trim());
  return rows.filter(r => r.some(v => v && v.trim())).map((r) => Object.fromEntries(header.map((h, idx) => [h, (r[idx] || '').trim()])));
}

// ─── Upsert helpers ───────────────────────────────────────────────────────────
async function upsertNeighborhood(hood) {
  const existing = await prisma.neighborhood.findUnique({ where: { slug: hood.slug } });
  if (existing) return existing;
  return prisma.neighborhood.create({
    data: {
      id: cuid(),
      name: hood.name,
      slug: hood.slug,
      region: hood.region,
      description: `${hood.name} is one of ${hood.region.includes('GTA') || hood.region === 'GTA' ? 'the Greater Toronto Area' : "Toronto"}'s established residential communities, offering a mix of new pre-construction condos, transit access, and neighbourhood amenities.`,
      metaTitle: `${hood.name} Pre-Construction Condos | New Developments`,
      metaDescription: `Browse new pre-construction condo developments in ${hood.name}. Register for VIP pricing, floor plans, and priority access on new launches in ${hood.name}, Toronto.`,
    },
  });
}

async function upsertDeveloper(devName) {
  // Multi-developer partnerships: use first name as primary; strip parentheticals
  const primary = devName.split(',')[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const slug = slugify(primary);
  const existing = await prisma.developer.findUnique({ where: { slug } });
  if (existing) return existing;
  return prisma.developer.create({
    data: {
      id: cuid(),
      name: primary,
      slug,
      description: `${primary} is an active developer in the Greater Toronto Area pre-construction market, delivering residential communities across the city.`,
    },
  });
}

async function upsertProject(row, idx) {
  const csvName = row['Project Name'];
  const csvAddress = row['Address'];
  const csvDev = row['Developer'] || 'TBD';
  const csvNeigh = row['Neighborhood'];
  const csvArea = row['Area'];
  const csvStatus = row['Status'];
  const csvOccupancy = row['Est. Occupancy'];
  const csvStage = row['Stage (July 2026)'];
  const csvStoreys = row['Storeys'];
  const csvUnits = row['Units'];
  const csvPrice = row['Price From'];
  const csvWebsite = row['Website'];
  const csvSource = row['Source'];
  const csvNotable = row['Why Notable'];

  const hood = mapNeighborhood(csvNeigh, csvArea);
  const neighborhood = await upsertNeighborhood(hood);
  const developer = await upsertDeveloper(csvDev);

  const priceMin = parsePrice(csvPrice);
  const floors = csvStoreys ? parseInt(String(csvStoreys).replace(/[^\d]/g, ''), 10) || null : null;
  const totalUnits = csvUnits ? parseInt(String(csvUnits).replace(/[^\d]/g, ''), 10) || null : null;
  const status = inferStatus(csvStatus, csvStage);
  const category = inferCategory(priceMin, csvName, csvNotable);

  // Slug from name (strip parentheticals; avoid double "condos")
  const cleanName = csvName.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const baseSlug = slugify(cleanName);
  const slug = /-condos?$/.test(baseSlug) ? `${baseSlug}-toronto` : `${baseSlug}-condos-toronto`;

  const sanitize = (s) => (s || '').replace(/[–—]/g, ',').replace(/\s*,\s*,/g, ',');
  const projectShape = {
    name: cleanName,
    address: csvAddress,
    developerName: developer.name,
    developerSlug: developer.slug,
    floors,
    totalUnits,
    estCompletion: csvOccupancy && csvOccupancy !== 'TBD' ? csvOccupancy : null,
    csvStatus,
    stage: sanitize(csvStage),
    notable: sanitize(csvNotable),
    neighbourhoodName: hood.name,
    neighbourhoodSlug: hood.slug,
    priceMin,
  };

  const structured = buildStructuredContent(projectShape);
  const plainDesc = buildPlainDescription(projectShape);
  const metaTitle = buildMetaTitle(projectShape);
  const metaDescription = buildMetaDescription(projectShape);
  const faqs = buildFaqs(projectShape);
  const amenities = buildAmenities(projectShape);

  // Lint pass for banned phrases / em dashes
  const allText = [plainDesc, ...Object.values(structured).filter(v => typeof v === 'string'), metaTitle, metaDescription, ...faqs.flatMap(f => [f.question, f.answer]), ...amenities].join('\n');
  const lintIssues = lintContent(allText);
  if (lintIssues.length) console.warn(`  ! [lint ${cleanName}] ${lintIssues.join('; ')}`);

  console.log(`[${idx}] Geocoding + scraping images for ${cleanName}...`);
  const [geo, img] = await Promise.all([
    geocode(csvAddress || cleanName + ', Toronto, ON'),
    findBestImage(cleanName, csvSource, csvWebsite),
  ]);
  const { lat, lng } = geo;

  const existing = await prisma.project.findUnique({ where: { slug } });
  const data = {
    name: cleanName,
    slug,
    address: csvAddress || null,
    neighborhoodId: neighborhood.id,
    developerId: developer.id,
    status,
    category,
    estCompletion: csvOccupancy && csvOccupancy !== 'TBD' ? csvOccupancy : null,
    totalUnits,
    floors,
    priceMin,
    description: plainDesc,
    longDescription: JSON.stringify(structured),
    amenities,
    metaTitle,
    metaDescription,
    faqJson: faqs,
    websiteUrl: csvWebsite || csvSource || null,
    latitude: lat,
    longitude: lng,
    mainImageUrl: img?.mainImageUrl || null,
    images: img ? { gallery: img.gallery } : null,
  };

  if (existing) {
    return prisma.project.update({ where: { slug }, data });
  }
  return prisma.project.create({ data: { id: cuid(), ...data } });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = path.join(process.env.HOME, 'Desktop/toronto_precon_100_v2 - Toronto Precon 100.csv');
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvText);
  console.log(`Loaded ${rows.length} projects from CSV`);
  console.log(`Processing rows ${START}–${Math.min(START + LIMIT - 1, rows.length)}`);

  const slice = rows.slice(START - 1, START - 1 + LIMIT);
  const successes = [];
  const failures = [];

  for (let i = 0; i < slice.length; i++) {
    const row = slice[i];
    const idx = START + i;
    try {
      const project = await upsertProject(row, idx);
      successes.push({ idx, name: project.name, slug: project.slug });
      console.log(`  ✓ [${idx}] ${project.name} → /pre-construction/${project.slug}`);
    } catch (e) {
      failures.push({ idx, name: row['Project Name'], error: e.message });
      console.error(`  ✗ [${idx}] ${row['Project Name']}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 150)); // gentle geocode throttle
  }

  console.log(`\n── Summary ──────────────────────────────`);
  console.log(`Success: ${successes.length}`);
  console.log(`Failed:  ${failures.length}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(f => console.log(`  ${f.idx}. ${f.name}: ${f.error}`));
  }

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
