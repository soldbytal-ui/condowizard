/**
 * Import GTA (non-Toronto) pre-construction projects from CSV.
 * CSV columns: #, Project Name, Address, City, Region, Developer, Status, Est. Occupancy, Why Notable
 * (No storeys/units/prices/website/source in this CSV.)
 *
 * Usage:
 *   node scripts/import-gta-precon.mjs             → all
 *   node scripts/import-gta-precon.mjs --limit=10 --start=1
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

(function loadEnv() {
  const text = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
})();

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const prisma = new PrismaClient();
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const LIMIT = args.limit ? parseInt(args.limit, 10) : 9999;
const START = args.start ? parseInt(args.start, 10) : 1;

function slugify(s) {
  return s.toLowerCase()
    .replace(/[àáâä]/g, 'a').replace(/[éèê]/g, 'e').replace(/[îï]/g, 'i').replace(/[ôö]/g, 'o').replace(/[ûü]/g, 'u')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cuid() {
  return 'c' + createHash('sha256').update(Math.random() + '-' + Date.now()).digest('base64url').slice(0, 24).toLowerCase();
}

function inferStatus(csvStatus) {
  const s = (csvStatus || '').toLowerCase();
  if (s.includes('coming soon') || s.includes('registration')) return 'PRE_LAUNCH';
  if (s.includes('under construction')) return 'UNDER_CONSTRUCTION';
  if (s.includes('near complet')) return 'NEAR_COMPLETION';
  if (s.includes('sold out') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

function mapCityToNeighbourhood(city) {
  // Normalise and match on exact word to avoid "hamilton" matching "milton"
  const c = (city || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
  // Longest / most specific first
  if (c === 'richmond hill' || c.startsWith('richmond hill')) return { slug: 'richmond-hill', name: 'Richmond Hill', region: 'York Region' };
  if (c === 'mississauga') return { slug: 'mississauga', name: 'Mississauga', region: 'Peel Region' };
  if (c === 'brampton') return { slug: 'brampton', name: 'Brampton', region: 'Peel Region' };
  if (c === 'vaughan') return { slug: 'vaughan', name: 'Vaughan', region: 'York Region' };
  if (c === 'markham') return { slug: 'markham', name: 'Markham', region: 'York Region' };
  if (c === 'oakville') return { slug: 'oakville', name: 'Oakville', region: 'Halton Region' };
  if (c === 'burlington') return { slug: 'burlington', name: 'Burlington', region: 'Halton Region' };
  if (c === 'hamilton') return { slug: 'hamilton', name: 'Hamilton', region: 'Hamilton' };
  if (c === 'milton') return { slug: 'milton', name: 'Milton', region: 'Halton Region' };
  if (c === 'pickering') return { slug: 'pickering', name: 'Pickering', region: 'Durham Region' };
  if (c === 'ajax') return { slug: 'ajax', name: 'Ajax', region: 'Durham Region' };
  if (c === 'whitby') return { slug: 'whitby', name: 'Whitby', region: 'Durham Region' };
  if (c === 'oshawa') return { slug: 'oshawa', name: 'Oshawa', region: 'Durham Region' };
  return { slug: slugify(city), name: city, region: 'Greater Toronto Area' };
}

async function geocode(address, city) {
  if (!MAPBOX_TOKEN || !address) return { lat: null, lng: null };
  try {
    const q = address.match(/toronto|mississauga|vaughan|markham|oakville|burlington|hamilton|pickering|brampton|whitby/i) ? address : `${address}, ${city}, ON`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=CA&limit=1&proximity=-79.3832,43.6532`;
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

async function upsertNeighbourhood(hood) {
  return prisma.neighborhood.upsert({
    where: { slug: hood.slug },
    update: {}, // don't overwrite existing description/meta
    create: {
      id: cuid(),
      name: hood.name,
      slug: hood.slug,
      region: hood.region,
      description: `${hood.name} is a Greater Toronto Area municipality with a growing pre-construction condominium market.`,
      metaTitle: `${hood.name} Pre-Construction Condos | New Developments`,
      metaDescription: `Browse new pre-construction condo developments in ${hood.name}. Register for VIP pricing, floor plans, and priority access on new launches.`,
    },
  });
}

async function upsertDeveloper(devName) {
  const primary = devName.split(/[,&]/)[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const slug = slugify(primary);
  return prisma.developer.upsert({
    where: { slug },
    update: {},
    create: {
      id: cuid(),
      name: primary,
      slug,
      description: `${primary} is an active developer in the Greater Toronto Area pre-construction market.`,
    },
  });
}

async function upsertProject(row, idx) {
  const csvName = row['Project Name'];
  const csvAddress = row['Address'];
  const csvCity = row['City'] || '';
  const csvDev = row['Developer'] || 'TBD';
  const csvStatus = row['Status'];
  const csvOccupancy = row['Est. Occupancy'];
  const csvNotable = row['Why Notable'];

  const hood = mapCityToNeighbourhood(csvCity);
  const neighborhood = await upsertNeighbourhood(hood);
  const developer = await upsertDeveloper(csvDev);

  const status = inferStatus(csvStatus);
  const category = 'PREMIUM';

  const cleanName = csvName.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const baseSlug = slugify(cleanName);
  const slug = /-condos?$/.test(baseSlug) ? `${baseSlug}-${hood.slug}` : `${baseSlug}-condos-${hood.slug}`;

  const sanitize = (s) => (s || '').replace(/[–—]/g, ',').replace(/\s*,\s*,/g, ',');

  const projectShape = {
    name: cleanName,
    address: csvAddress,
    developerName: developer.name,
    developerSlug: developer.slug,
    floors: null,
    totalUnits: null,
    estCompletion: csvOccupancy && csvOccupancy !== 'TBD' ? csvOccupancy : null,
    csvStatus,
    stage: null,
    notable: sanitize(csvNotable),
    neighbourhoodName: hood.name,
    neighbourhoodSlug: hood.slug,
    priceMin: null,
  };

  const structured = buildStructuredContent(projectShape);
  const plainDesc = buildPlainDescription(projectShape);
  const metaTitle = buildMetaTitle(projectShape);
  const metaDescription = buildMetaDescription(projectShape);
  const faqs = buildFaqs(projectShape);
  const amenities = buildAmenities(projectShape);

  const allText = [plainDesc, ...Object.values(structured).filter(v => typeof v === 'string'), metaTitle, metaDescription, ...faqs.flatMap(f => [f.question, f.answer]), ...amenities].join('\n');
  const lintIssues = lintContent(allText);
  if (lintIssues.length) console.warn(`  ! [lint ${cleanName}] ${lintIssues.join('; ')}`);

  console.log(`[${idx}] Geocoding + scraping images for ${cleanName}...`);
  const [geo, img] = await Promise.all([
    geocode(csvAddress, csvCity),
    findBestImage(cleanName, null, null),
  ]);
  const { lat, lng } = geo;

  const existing = await prisma.project.findUnique({ where: { slug } });
  const data = {
    name: cleanName,
    slug,
    address: csvAddress ? `${csvAddress}, ${csvCity}` : null,
    neighborhoodId: neighborhood.id,
    developerId: developer.id,
    status,
    category,
    estCompletion: csvOccupancy && csvOccupancy !== 'TBD' ? csvOccupancy : null,
    totalUnits: null,
    floors: null,
    priceMin: null,
    description: plainDesc,
    longDescription: JSON.stringify(structured),
    amenities,
    metaTitle,
    metaDescription,
    faqJson: faqs,
    latitude: lat,
    longitude: lng,
    mainImageUrl: img?.mainImageUrl || null,
    images: img ? { gallery: img.gallery } : null,
  };

  if (existing) return prisma.project.update({ where: { slug }, data });
  return prisma.project.create({ data: { id: cuid(), ...data } });
}

async function main() {
  const csvPath = path.join(process.env.HOME, 'Desktop/gta_precon_100 - GTA Precon 100.csv');
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  console.log(`Loaded ${rows.length} projects from GTA CSV`);
  console.log(`Processing rows ${START} to ${Math.min(START + LIMIT - 1, rows.length)}`);

  const slice = rows.slice(START - 1, START - 1 + LIMIT);
  const successes = [], failures = [];
  const CONCURRENCY = 5;

  // Process in batches of CONCURRENCY
  for (let batchStart = 0; batchStart < slice.length; batchStart += CONCURRENCY) {
    const batch = slice.slice(batchStart, batchStart + CONCURRENCY);
    const results = await Promise.all(batch.map(async (row, offset) => {
      const idx = START + batchStart + offset;
      try {
        const project = await upsertProject(row, idx);
        return { ok: true, idx, name: project.name, slug: project.slug };
      } catch (e) {
        return { ok: false, idx, name: row['Project Name'], error: e.message };
      }
    }));
    for (const r of results) {
      if (r.ok) {
        successes.push(r);
        console.log(`  ✓ [${r.idx}] ${r.name} → /pre-construction/${r.slug}`);
      } else {
        failures.push(r);
        console.error(`  ✗ [${r.idx}] ${r.name}: ${r.error}`);
      }
    }
  }

  console.log(`\nSuccess: ${successes.length} | Failed: ${failures.length}`);
  if (failures.length) failures.forEach(f => console.log(`  ${f.idx}. ${f.name}: ${f.error}`));

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
