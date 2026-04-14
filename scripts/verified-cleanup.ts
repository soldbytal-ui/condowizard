/**
 * verified-cleanup.ts
 *
 * Step 1: Scrape all pre-construction projects from squareyards.ca sitemap
 * Step 2: Cross-reference with our Supabase DB
 * Step 3: Keep verified matches, soft-delete the rest, add new ones
 *
 * Usage:
 *   npx tsx scripts/verified-cleanup.ts --scrape        # Step 1: scrape sources
 *   npx tsx scripts/verified-cleanup.ts --dry-run       # Step 2-3: preview changes
 *   npx tsx scripts/verified-cleanup.ts --apply         # Step 2-3: apply changes
 */

import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejevwlpwbkomuwkihsnw.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZXZ3bHB3YmtvbXV3a2loc253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzczMDEsImV4cCI6MjA5MTAxMzMwMX0.tN7NJnGaEhKHEsrTOPK8Y9ziMK3ne7dBTc4akWBFgTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml',
};

const OUTPUT_FILE = path.join(__dirname, 'verified-sources.json');

// GTA cities/areas we care about
const GTA_CITIES = [
  'toronto', 'north york', 'scarborough', 'etobicoke',
  'mississauga', 'brampton', 'vaughan', 'richmond hill',
  'markham', 'oakville', 'burlington', 'hamilton',
  'pickering', 'ajax', 'whitby', 'oshawa',
  'milton', 'aurora', 'newmarket', 'king city',
  'stouffville', 'caledon', 'georgetown', 'innisfil',
];

interface VerifiedProject {
  name: string;
  address: string;
  city: string;
  sourceUrl: string;
  sourceId: string;
  ogImage?: string;
}

// ─── Step 1: Scrape Square Yards ─────────────────────────────────────────────

async function safeFetch(url: string, timeout = 15000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { headers: HEADERS, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchSitemapUrls(): Promise<string[]> {
  console.log('Fetching sitemap...');
  const xml = await safeFetch('https://www.squareyards.ca/new_homes_detail.xml');
  if (!xml) throw new Error('Failed to fetch sitemap');
  const urls = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, ''));
  console.log(`Found ${urls.length} project URLs in sitemap`);
  return urls;
}

async function scrapeProjectPage(url: string): Promise<VerifiedProject | null> {
  const html = await safeFetch(url);
  if (!html) return null;

  const $ = cheerio.load(html);
  const h1 = $('h1').first().text().trim();
  if (!h1) return null;

  // h1 format: "Project Name Address, City, Province, Postal"
  // Example: "Sugar Wharf Condos (Phase 2) 55 Lake Shore Boulevard East, Toronto, Ontario, M5E 1A4"
  const parts = h1.split(',').map(s => s.trim());
  const city = parts[1] || '';

  // Split first part into name + address
  // Address typically starts with a number
  const firstPart = parts[0];
  const addrMatch = firstPart.match(/^(.+?)\s+(\d+\s+.+)$/);

  let name: string, address: string;
  if (addrMatch) {
    name = addrMatch[1].trim();
    address = addrMatch[2].trim() + (city ? ', ' + city : '');
  } else {
    name = firstPart;
    address = parts.slice(0).join(', ');
  }

  // Extract ID from URL
  const idMatch = url.match(/-(\d+)-nhd$/);
  const sourceId = idMatch ? idMatch[1] : '';

  // og:image
  const ogImage = $('meta[property="og:image"]').attr('content');
  const img = ogImage && !ogImage.includes('sy-logo') ? ogImage : undefined;

  return { name, address, city, sourceUrl: url, sourceId, ogImage: img };
}

async function scrapeSquareYards(): Promise<VerifiedProject[]> {
  const urls = await fetchSitemapUrls();
  const projects: VerifiedProject[] = [];
  const CONCURRENCY = 15;

  console.log(`Scraping ${urls.length} project pages (${CONCURRENCY} concurrent)...`);

  for (let i = 0; i < urls.length; i += CONCURRENCY) {
    const batch = urls.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(url => scrapeProjectPage(url)));

    for (const r of results) {
      if (r) projects.push(r);
    }

    const done = Math.min(i + CONCURRENCY, urls.length);
    if (done % 100 === 0 || done === urls.length) {
      process.stdout.write(`\r  ${done}/${urls.length} scraped, ${projects.length} parsed`);
    }

    // Brief pause every batch
    await new Promise(r => setTimeout(r, 200));
  }
  console.log('');

  // Filter to GTA
  const gtaProjects = projects.filter(p => {
    const cityLower = p.city.toLowerCase();
    return GTA_CITIES.some(c => cityLower.includes(c));
  });
  console.log(`GTA projects: ${gtaProjects.length} (of ${projects.length} total Ontario)`);

  return gtaProjects;
}

// ─── Step 1b: Parse Livabl sitemaps (no page scraping needed — URLs blocked) ─

const LIVABL_GTA_CITIES = [
  'toronto-on', 'mississauga-on', 'brampton-on', 'vaughan-on',
  'richmond-hill-on', 'markham-on', 'oakville-on', 'burlington-on',
  'hamilton-on', 'pickering-on', 'ajax-on', 'whitby-on', 'oshawa-on',
  'milton-on', 'aurora-on', 'newmarket-on', 'caledon-on', 'innisfil-on',
  'king-on', 'stouffville-on', 'georgetown-on',
];

function parseLivablUrl(url: string): VerifiedProject | null {
  // Pattern: https://www.livabl.com/{city}-on/{slug}
  const match = url.match(/livabl\.com\/([a-z-]+-on)\/(.+)$/);
  if (!match) return null;
  const citySlug = match[1];
  const slug = match[2];

  // Convert slug to name: "sugar-wharf-condos-phase-2" → "Sugar Wharf Condos Phase 2"
  const name = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    .replace(/(\d+)/g, ' $1').replace(/\s+/g, ' ').trim();

  const city = citySlug.replace(/-on$/, '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return {
    name,
    address: '', // Can't get address from URL
    city,
    sourceUrl: url,
    sourceId: 'livabl:' + slug,
  };
}

async function scrapeLivablSitemap(): Promise<VerifiedProject[]> {
  console.log('\nFetching Livabl sitemaps...');
  const allUrls: string[] = [];

  for (const i of [1, 2]) {
    const url = `https://www.livabl.com/sitemaps/sitemap-developments-${i}.xml`;
    const xml = await safeFetch(url);
    if (!xml) continue;
    const locs = (xml.match(/<loc>[^<]+<\/loc>/g) || []).map(l => l.replace(/<\/?loc>/g, ''));
    allUrls.push(...locs);
    console.log(`  sitemap-developments-${i}.xml: ${locs.length} URLs`);
  }

  // Filter to GTA cities
  const gtaUrls = allUrls.filter(u => LIVABL_GTA_CITIES.some(c => u.includes(`/${c}/`)));
  console.log(`  GTA development URLs: ${gtaUrls.length}`);

  const projects = gtaUrls.map(parseLivablUrl).filter((p): p is VerifiedProject => p !== null);
  console.log(`  Parsed: ${projects.length} Livabl GTA projects`);
  return projects;
}

// ─── Step 2-3: Cross-reference and cleanup ───────────────────────────────────

function normalizeForMatch(s: string): string {
  return s.toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(condos?|towns?|tower[s]?|residences?|lofts?|suites?|collection|living|place|square|park)\b/g, '')
    .replace(/\bphase\s*\d+/g, '')
    .replace(/\b(the|at|on|and|in|of)\b/g, '')
    .replace(/\b(avenue|ave|street|st|road|rd|drive|dr|boulevard|blvd|east|west|north|south|way|crescent|court|lane|highway|hwy)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function extractStreetNumber(addr: string): string | null {
  const m = addr.match(/^(\d+)/);
  return m ? m[1] : null;
}

function extractStreetName(addr: string): string {
  return addr.replace(/^\d+\s*/, '').split(',')[0]
    .toLowerCase()
    .replace(/\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|way|crescent|cres|court|ct|lane|ln|place|pl|circle|cir|terrace|ter|trail|trl|highway|hwy|parkway|pkwy)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function projectsMatch(dbProject: any, verified: VerifiedProject): boolean {
  // Method 1: Name match (normalized)
  const dbName = normalizeForMatch(dbProject.name);
  const vName = normalizeForMatch(verified.name);
  // Skip matches where the normalized name is just a city/neighbourhood name
  const GEO_NAMES = /^(downtown|midtown|yorkville|vaughan|markham|scarborough|etobicoke|hamilton|oakville|burlington|brampton|mississauga|pickering|ajax|whitby|oshawa|aurora|leaside|junction|leslieville|riverdale|danforth|roncesvalles|annex|liberty|waterfront|harbourwalk|harbour|summit|grand|alto|brio|crest|sola|cloud|vantage|apex|zen|novo|aura|skyline|rise|north|upper|west|sky|one|park|regent|king)$/;
  if (dbName && vName && dbName.length > 3 && vName.length > 3) {
    // Exact match
    if (dbName === vName && !GEO_NAMES.test(dbName)) return true;
    // Prefix match — one name starts with the other, but only for distinctive names (>= 8 chars)
    const minLen = Math.min(dbName.length, vName.length);
    if ((vName.startsWith(dbName) || dbName.startsWith(vName)) && minLen >= 8 && !GEO_NAMES.test(dbName) && !GEO_NAMES.test(vName)) return true;
    // Inclusion match — but only if the shorter name is at least 75% of the longer
    const shorter = dbName.length < vName.length ? dbName : vName;
    const longer = dbName.length < vName.length ? vName : dbName;
    if (longer.includes(shorter) && shorter.length >= longer.length * 0.75 && shorter.length >= 8 && !GEO_NAMES.test(shorter)) return true;
  }

  // Method 2: Address match (street number + partial street name)
  if (dbProject.address && verified.address) {
    const dbNum = extractStreetNumber(dbProject.address);
    const vNum = extractStreetNumber(verified.address);
    if (dbNum && vNum && dbNum === vNum) {
      const dbStreet = extractStreetName(dbProject.address);
      const vStreet = extractStreetName(verified.address);
      if (dbStreet && vStreet && (dbStreet.includes(vStreet) || vStreet.includes(dbStreet))) {
        return true;
      }
    }
  }

  // Method 3: Fuzzy name overlap (for cases like "36 Birch" vs "36 Birch Avenue Condos")
  const STOP_WORDS = /^(the|and|at|on|in|of|new|condos?|towns?|tower[s]?|residences?|place|square|lofts?|living|collection|suites?|park|avenue|ave|street|st|road|rd|drive|dr|boulevard|blvd|east|west|north|south|way|crescent|court|lane|highway|hwy|phase|block|unit|level|lake|shore|queen|king|bay|yonge|bloor|dundas|front|main|church|college|richmond|adelaide|wellington|lawrence|eglinton|sheppard|finch|steeles|kennedy|village|city|centre|centre|garden|view|heights|glen|dale|hill|ridge|creek|valley|grove|wood|manor|point|harbour|port|upper|lower)$/;
  const dbWords = dbProject.name.toLowerCase().split(/[\s\-&]+/).filter((w: string) => w.length > 2 && !STOP_WORDS.test(w));
  const vWords = verified.name.toLowerCase().split(/[\s\-&]+/).filter((w: string) => w.length > 2 && !STOP_WORDS.test(w));
  if (dbWords.length >= 2 && vWords.length >= 2) {
    const overlap = dbWords.filter((w: string) => vWords.includes(w)).length;
    if (overlap >= 2) return true;
  }

  return false;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function crossReferenceAndCleanup(dryRun: boolean) {
  // Load verified sources
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.error('Run --scrape first to generate verified-sources.json');
    process.exit(1);
  }
  const verified: VerifiedProject[] = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));
  console.log(`Loaded ${verified.length} verified projects from sources`);

  // Fetch all DB projects
  const allProjects: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('id, name, slug, address, status, mainImageUrl, description, floors, totalUnits, priceMin, neighborhoodId')
      .range(from, from + 999);
    if (error) { console.error('DB error:', error); process.exit(1); }
    if (!data || data.length === 0) break;
    allProjects.push(...data);
    from += data.length;
    if (data.length < 1000) break;
  }
  console.log(`Loaded ${allProjects.length} projects from database`);

  // Cross-reference
  const kept: { db: any; source: VerifiedProject }[] = [];
  const toDelete: any[] = [];
  const matchedSourceIds = new Set<string>();

  for (const dbProject of allProjects) {
    let bestMatch: VerifiedProject | null = null;
    for (const v of verified) {
      if (projectsMatch(dbProject, v)) {
        bestMatch = v;
        break;
      }
    }

    if (bestMatch) {
      kept.push({ db: dbProject, source: bestMatch });
      matchedSourceIds.add(bestMatch.sourceId);
    } else {
      toDelete.push(dbProject);
    }
  }

  // Find new projects to add (in verified but not in our DB)
  const toAdd = verified.filter(v => !matchedSourceIds.has(v.sourceId));

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`VERIFIED MATCH (keep):    ${kept.length}`);
  console.log(`NO MATCH (soft-delete):   ${toDelete.length}`);
  console.log(`NEW (to add):             ${toAdd.length}`);
  console.log(`Final total:              ${kept.length + toAdd.length}`);
  console.log(`${'─'.repeat(60)}`);

  // Print 10 random samples from each category
  console.log('\n── KEPT (10 samples) ──');
  const keptSample = kept.sort(() => Math.random() - 0.5).slice(0, 10);
  for (const k of keptSample) {
    console.log(`  ✓ "${k.db.name}" ↔ "${k.source.name}" (${k.source.city})`);
  }

  console.log('\n── DELETED (10 samples) ──');
  const delSample = toDelete.sort(() => Math.random() - 0.5).slice(0, 10);
  for (const d of delSample) {
    console.log(`  ✗ "${d.name}" (${d.address || 'no address'})`);
  }

  console.log('\n── NEW (10 samples) ──');
  const addSample = toAdd.sort(() => Math.random() - 0.5).slice(0, 10);
  for (const a of addSample) {
    console.log(`  + "${a.name}" @ ${a.address} (${a.city})`);
  }

  if (dryRun) {
    console.log('\n[DRY RUN — no changes applied]');
    return;
  }

  // Apply changes
  console.log('\nApplying changes...');

  // 1. Update matched projects with source data
  let updateCount = 0;
  for (const { db, source } of kept) {
    const updates: any = { updatedAt: new Date().toISOString() };
    // Update mainImageUrl if we don't have one and source has og:image
    if (!db.mainImageUrl && source.ogImage) updates.mainImageUrl = source.ogImage;
    // Update address if missing
    if (!db.address && source.address) updates.address = source.address;

    if (Object.keys(updates).length > 1) { // more than just updatedAt
      const { error } = await supabase.from('projects').update(updates).eq('id', db.id);
      if (!error) updateCount++;
    }
  }
  console.log(`  Updated ${updateCount} kept projects with source data`);

  // 2. Soft-delete unverified projects (set status to ARCHIVED)
  let deleteCount = 0;
  const deleteBatchSize = 50;
  for (let i = 0; i < toDelete.length; i += deleteBatchSize) {
    const batch = toDelete.slice(i, i + deleteBatchSize);
    const ids = batch.map(p => p.id);
    const { error } = await supabase
      .from('projects')
      .update({ status: 'ARCHIVED', updatedAt: new Date().toISOString() })
      .in('id', ids);
    if (!error) deleteCount += batch.length;
    else console.error('  Delete batch error:', error.message);
  }
  console.log(`  Archived ${deleteCount} unverified projects`);

  // 3. Add new projects
  let addCount = 0;
  for (const v of toAdd) {
    const slug = slugify(v.name);
    // Check for slug collision
    const { data: existing } = await supabase.from('projects').select('id').eq('slug', slug).single();
    if (existing) continue; // skip if slug already exists

    const { error } = await supabase.from('projects').insert({
      name: v.name,
      slug,
      address: v.address,
      status: 'PRE_LAUNCH',
      mainImageUrl: v.ogImage || null,
      category: 'CONDO',
      featured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    if (!error) addCount++;
    else if (!error.message?.includes('duplicate')) console.error('  Insert error:', v.name, error.message);
  }
  console.log(`  Added ${addCount} new projects`);

  console.log(`\n✓ Done. Final active count: ${kept.length + addCount}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const mode = process.argv[2];

  if (mode === '--scrape') {
    console.log('Step 1: Scraping verified sources...\n');
    const syProjects = await scrapeSquareYards();
    const livProjects = await scrapeLivablSitemap();

    // Deduplicate: prefer Square Yards (has address) over Livabl (URL-only)
    const combined = [...syProjects];
    const syNames = new Set(syProjects.map(p => normalizeForMatch(p.name)));
    for (const lp of livProjects) {
      if (!syNames.has(normalizeForMatch(lp.name))) {
        combined.push(lp);
      }
    }

    console.log(`\nCombined: ${combined.length} unique GTA projects (${syProjects.length} SY + ${livProjects.length} Livabl - dupes)`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(combined, null, 2));
    console.log(`Saved to ${OUTPUT_FILE}`);
  } else if (mode === '--dry-run' || mode === '--apply') {
    const dryRun = mode === '--dry-run';
    console.log(`Step 2-3: Cross-reference and cleanup${dryRun ? ' [DRY RUN]' : ''}...\n`);
    await crossReferenceAndCleanup(dryRun);
  } else {
    console.log('Usage:');
    console.log('  npx tsx scripts/verified-cleanup.ts --scrape    # Scrape sources');
    console.log('  npx tsx scripts/verified-cleanup.ts --dry-run   # Preview changes');
    console.log('  npx tsx scripts/verified-cleanup.ts --apply     # Apply changes');
  }
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
