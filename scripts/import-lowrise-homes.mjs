/**
 * Import GTA low-rise freehold communities (towns, semis, detached) from CSV.
 * CSV columns: #, Community, City, Region, Builder, Home Types, Status, Notes
 * No explicit occupancy column. All rows assumed 2027+.
 * Any project whose Notes mention 2026 is skipped per user requirement.
 *
 * All imported rows are stored with buildingType='HOME' so /new-homes and
 * /new-condos can filter separately.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { findBestImage } from './scrape-precon-images-lib.mjs';
import {
  buildLowriseStructuredContent,
  buildLowriseSummary,
  buildLowriseMetaTitle,
  buildLowriseMetaDescription,
  buildLowriseFaqs,
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
  if (s.includes('coming soon') || s.includes('register')) return 'PRE_LAUNCH';
  if (s.includes('sold out') || s.includes('complete')) return 'COMPLETED';
  return 'PRE_CONSTRUCTION';
}

// Strip parenthetical qualifiers like "Bolton (Caledon)" -> use "Bolton"
function cityToSlug(city) {
  const c = (city || '').toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
  if (!c) return null;
  const map = {
    'brampton': { slug: 'brampton', name: 'Brampton', region: 'Peel Region' },
    'caledon': { slug: 'caledon', name: 'Caledon', region: 'Peel Region' },
    'bolton': { slug: 'bolton', name: 'Bolton', region: 'Peel Region' },
    'mississauga': { slug: 'mississauga', name: 'Mississauga', region: 'Peel Region' },
    'vaughan': { slug: 'vaughan', name: 'Vaughan', region: 'York Region' },
    'markham': { slug: 'markham', name: 'Markham', region: 'York Region' },
    'richmond hill': { slug: 'richmond-hill', name: 'Richmond Hill', region: 'York Region' },
    'aurora': { slug: 'aurora', name: 'Aurora', region: 'York Region' },
    'kleinburg': { slug: 'kleinburg', name: 'Kleinburg', region: 'York Region' },
    'whitchurch-stouffville': { slug: 'whitchurch-stouffville', name: 'Whitchurch-Stouffville', region: 'York Region' },
    'stouffville': { slug: 'whitchurch-stouffville', name: 'Whitchurch-Stouffville', region: 'York Region' },
    'king city': { slug: 'king-city', name: 'King City', region: 'York Region' },
    'east gwillimbury': { slug: 'east-gwillimbury', name: 'East Gwillimbury', region: 'York Region' },
    'holland landing': { slug: 'east-gwillimbury', name: 'East Gwillimbury', region: 'York Region' },
    'nobleton': { slug: 'nobleton', name: 'Nobleton', region: 'York Region' },
    'georgina': { slug: 'georgina', name: 'Georgina', region: 'York Region' },
    'keswick': { slug: 'keswick', name: 'Keswick', region: 'York Region' },
    'oakville': { slug: 'oakville', name: 'Oakville', region: 'Halton Region' },
    'burlington': { slug: 'burlington', name: 'Burlington', region: 'Halton Region' },
    'milton': { slug: 'milton', name: 'Milton', region: 'Halton Region' },
    'georgetown': { slug: 'georgetown', name: 'Georgetown', region: 'Halton Region' },
    'pickering': { slug: 'pickering', name: 'Pickering', region: 'Durham Region' },
    'ajax': { slug: 'ajax', name: 'Ajax', region: 'Durham Region' },
    'whitby': { slug: 'whitby', name: 'Whitby', region: 'Durham Region' },
    'oshawa': { slug: 'oshawa', name: 'Oshawa', region: 'Durham Region' },
    'bowmanville': { slug: 'bowmanville', name: 'Bowmanville', region: 'Durham Region' },
    'newcastle': { slug: 'newcastle', name: 'Newcastle', region: 'Durham Region' },
    'uxbridge': { slug: 'uxbridge', name: 'Uxbridge', region: 'Durham Region' },
    'hamilton': { slug: 'hamilton', name: 'Hamilton', region: 'Hamilton area' },
    'ancaster': { slug: 'ancaster', name: 'Ancaster', region: 'Hamilton area' },
    'stoney creek': { slug: 'stoney-creek', name: 'Stoney Creek', region: 'Hamilton area' },
    'binbrook': { slug: 'binbrook', name: 'Binbrook', region: 'Hamilton area' },
    'caledonia': { slug: 'caledonia', name: 'Caledonia', region: 'Hamilton area' },
    'mount hope': { slug: 'mount-hope', name: 'Mount Hope', region: 'Hamilton area' },
    'bradford': { slug: 'bradford', name: 'Bradford', region: 'Outer GTA' },
    'shelburne': { slug: 'shelburne', name: 'Shelburne', region: 'Outer GTA' },
    'innisfil': { slug: 'innisfil', name: 'Innisfil', region: 'Outer GTA' },
    'wasaga beach': { slug: 'wasaga-beach', name: 'Wasaga Beach', region: 'Outer GTA' },
    'blue mountains': { slug: 'blue-mountains', name: 'The Blue Mountains', region: 'Outer GTA' },
    'welland': { slug: 'welland', name: 'Welland', region: 'Outer GTA' },
    'brantford': { slug: 'brantford', name: 'Brantford', region: 'Outer GTA' },
    'kitchener': { slug: 'kitchener', name: 'Kitchener', region: 'Outer GTA' },
    'niagara': { slug: 'niagara', name: 'Niagara Region', region: 'Outer GTA' },
    'toronto': { slug: 'north-york', name: 'North York Centre', region: 'North York' },
  };
  return map[c] || { slug: slugify(c), name: city.replace(/\s*\(.*?\)\s*/g, '').trim(), region: 'Greater Toronto Area' };
}

async function geocode(address, city) {
  if (!MAPBOX_TOKEN) return { lat: null, lng: null };
  try {
    const q = address ? `${address}, ${city}, ON` : `${city}, ON`;
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${MAPBOX_TOKEN}&country=CA&limit=1&proximity=-79.3832,43.6532`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.features?.[0]) {
      const [lng, lat] = data.features[0].center;
      return { lat, lng };
    }
  } catch { /* ignore */ }
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
    update: {},
    create: {
      id: cuid(),
      name: hood.name,
      slug: hood.slug,
      region: hood.region,
      description: `${hood.name} is a Greater Toronto Area community with active pre-construction low-rise development.`,
      metaTitle: `${hood.name} Pre-Construction Homes and Condos`,
      metaDescription: `Browse new pre-construction homes and condos in ${hood.name}. Register for floor plans, pricing and priority access.`,
    },
  });
}

async function upsertDeveloper(devName) {
  const primary = devName.split(/[\/&,]/)[0].replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const slug = slugify(primary);
  return prisma.developer.upsert({
    where: { slug },
    update: {},
    create: {
      id: cuid(),
      name: primary,
      slug,
      description: `${primary} is an active builder in the Greater Toronto Area pre-construction market.`,
    },
  });
}

async function upsertProject(row, idx) {
  const csvName = row['Community'];
  const csvCity = row['City'] || '';
  const csvBuilder = row['Builder'] || 'TBD';
  const csvTypes = row['Home Types'] || '';
  const csvStatus = row['Status'];
  const csvNotes = row['Notes'] || '';

  // Skip 2026 mentions
  if (/\b2026\b/.test(csvNotes)) {
    throw new Error('SKIP: contains 2026 reference');
  }

  const hood = cityToSlug(csvCity);
  if (!hood) throw new Error('No city mapping');

  const neighborhood = await upsertNeighbourhood(hood);
  const developer = await upsertDeveloper(csvBuilder);

  const status = inferStatus(csvStatus);
  const cleanName = csvName.replace(/\s*\(.*?\)\s*/g, ' ').trim();
  const baseSlug = slugify(cleanName);
  const slug = `${baseSlug}-homes-${hood.slug}`;

  const sanitize = (s) => (s || '').replace(/[–—]/g, ',').replace(/\s*,\s*,/g, ',');

  const projectShape = {
    name: cleanName,
    address: null,
    developerName: developer.name,
    developerSlug: developer.slug,
    homeTypes: csvTypes,
    csvStatus,
    notable: sanitize(csvNotes),
    neighbourhoodName: hood.name,
    neighbourhoodSlug: hood.slug,
    estCompletion: '2027',
  };

  const structured = buildLowriseStructuredContent(projectShape);
  const plainDesc = buildLowriseSummary(projectShape);
  const metaTitle = buildLowriseMetaTitle(projectShape);
  const metaDescription = buildLowriseMetaDescription(projectShape);
  const faqs = buildLowriseFaqs(projectShape);

  const allText = [plainDesc, ...Object.values(structured).filter(v => typeof v === 'string'), metaTitle, metaDescription, ...faqs.flatMap(f => [f.question, f.answer])].join('\n');
  const lintIssues = lintContent(allText);
  if (lintIssues.length) console.warn(`  ! [lint ${cleanName}] ${lintIssues.join('; ')}`);

  // Skip image scrape for low-rise — Toronto-focused listing sites do not cover
  // exurb builders. Photos can be added per-project later from builder sites.
  const [geo, img] = await Promise.all([
    geocode(null, csvCity),
    Promise.resolve(null),
  ]);

  const existing = await prisma.project.findUnique({ where: { slug } });
  const data = {
    name: cleanName,
    slug,
    address: csvCity ? `${csvCity}, ON` : null,
    neighborhoodId: neighborhood.id,
    developerId: developer.id,
    status,
    category: 'PREMIUM',
    estCompletion: '2027',
    description: plainDesc,
    longDescription: JSON.stringify(structured),
    amenities: [],
    metaTitle,
    metaDescription,
    faqJson: faqs,
    latitude: geo.lat,
    longitude: geo.lng,
    mainImageUrl: img?.mainImageUrl || null,
    images: img ? { gallery: img.gallery } : null,
    buildingType: 'HOME',
  };

  if (existing) {
    return prisma.project.update({ where: { slug }, data });
  }
  return prisma.project.create({ data: { id: cuid(), ...data } });
}

async function main() {
  const csvPath = path.join(process.env.HOME, 'Desktop/gta_lowrise_communities - gta_lowrise_communities.csv.csv');
  const rows = parseCsv(fs.readFileSync(csvPath, 'utf8'));
  console.log(`Loaded ${rows.length} low-rise communities from CSV`);

  const slice = rows.slice(START - 1, START - 1 + LIMIT);
  const successes = [], failures = [], skipped = [];
  const CONCURRENCY = 5;

  for (let batchStart = 0; batchStart < slice.length; batchStart += CONCURRENCY) {
    const batch = slice.slice(batchStart, batchStart + CONCURRENCY);
    const results = await Promise.all(batch.map(async (row, offset) => {
      const idx = START + batchStart + offset;
      try {
        const project = await upsertProject(row, idx);
        return { ok: true, idx, name: project.name, slug: project.slug };
      } catch (e) {
        if (e.message?.startsWith('SKIP')) return { skip: true, idx, name: row['Community'], reason: e.message };
        return { ok: false, idx, name: row['Community'], error: e.message };
      }
    }));
    for (const r of results) {
      if (r.ok) {
        successes.push(r);
        console.log(`  ✓ [${r.idx}] ${r.name} → /new-homes/${r.slug}`);
      } else if (r.skip) {
        skipped.push(r);
        console.log(`  ⊘ [${r.idx}] ${r.name} (${r.reason})`);
      } else {
        failures.push(r);
        console.error(`  ✗ [${r.idx}] ${r.name}: ${r.error}`);
      }
    }
  }

  console.log(`\nSuccess: ${successes.length} | Skipped: ${skipped.length} | Failed: ${failures.length}`);
  if (failures.length) failures.forEach(f => console.log(`  ${f.idx}. ${f.name}: ${f.error}`));

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
