/**
 * enrich-projects.ts
 *
 * Enriches pending/thin project records by scraping:
 *   1. UrbanToronto  — description, architect, storeys, units, renders
 *   2. GTA-Homes     — description, floor plans, images
 *   3. Livabl        — price range, sq ft, completion date, images
 *   4. Square Yards  — additional images, pricing
 *
 * All scrapers use fetch + cheerio (no Firecrawl).
 * Each source is tried in order; failures are silently skipped.
 *
 * Run: npm run enrich
 *      or: npx tsx scripts/enrich-projects.ts
 *      or: npx tsx scripts/enrich-projects.ts --dry-run
 *      or: npx tsx scripts/enrich-projects.ts --limit 50
 */

import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ejevwlpwbkomuwkihsnw.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVqZXZ3bHB3YmtvbXV3a2loc253Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MzczMDEsImV4cCI6MjA5MTAxMzMwMX0.tN7NJnGaEhKHEsrTOPK8Y9ziMK3ne7dBTc4akWBFgTk';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(a => a.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-CA,en;q=0.9',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScrapedData {
  description?: string;
  architect?: string;
  floors?: number;
  totalUnits?: number;
  priceMin?: number;
  priceMax?: number;
  sizeRangeMin?: number;
  sizeRangeMax?: number;
  estCompletion?: string;
  websiteUrl?: string;
  images?: string[];
  source?: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  description: string | null;
  mainImageUrl: string | null;
  images: string[] | null;
  architect: string | null;
  floors: number | null;
  totalUnits: number | null;
  priceMin: number | null;
  priceMax: number | null;
  sizeRangeMin: number | null;
  sizeRangeMax: number | null;
  estCompletion: string | null;
  neighborhoodId: string | null;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

async function safeFetch(url: string, timeout = 10000): Promise<string | null> {
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

function parsePrice(text: string): number | null {
  // Matches patterns like "$1.2M", "$450,000", "$1,200,000"
  const m = text.match(/\$\s*([\d,]+(?:\.\d+)?)\s*([MmKk]?)/);
  if (!m) return null;
  let val = parseFloat(m[1].replace(/,/g, ''));
  const suffix = m[2].toLowerCase();
  if (suffix === 'm') val *= 1_000_000;
  if (suffix === 'k') val *= 1_000;
  return Math.round(val);
}

function parseNumber(text: string): number | null {
  const m = text.match(/[\d,]+/);
  if (!m) return null;
  return parseInt(m[0].replace(/,/g, ''));
}

function cleanText(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

function isGarbageText(t: string): boolean {
  return /promote|let us know|not right|sign up|subscribe|contact us|login|register|cookie|privacy/i.test(t);
}

function isValidImageUrl(url: string): boolean {
  if (!url || url.length < 10) return false;
  if (!url.startsWith('http')) return false;
  // Skip tiny icons, logos, social icons, tracking pixels
  if (/icon|logo|favicon|pixel|spacer|placeholder|blank|avatar|thumb|sprite|arrow|check|star|badge/i.test(url)) return false;
  if (/\.(svg|gif|ico)(\?|$)/.test(url)) return false;
  // Must be a real image extension
  if (!/\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)) return false;
  // Skip known navigation/site-chrome images
  if (/mega-menu|banner\.png|platinum-access|leasing-services|our-team|client-stories|seminar|calculator|dominican|guide-to|benefits-of|choosing-the|determine-the|why-sell/i.test(url)) return false;
  // Skip UrbanToronto site-wide assets
  if (/cdn\.skyrisecities\.com\/release/i.test(url)) return false;
  return true;
}

function dedupeImages(imgs: string[]): string[] {
  return [...new Set(imgs.filter(isValidImageUrl))].slice(0, 20);
}

// ─── Slug helpers ─────────────────────────────────────────────────────────────

function slugVariants(slug: string): string[] {
  const variants = [slug];
  // Add -condos suffix
  if (!slug.endsWith('-condos')) variants.push(`${slug}-condos`);
  // Add -condo suffix
  if (!slug.endsWith('-condo')) variants.push(`${slug}-condo`);
  // Drop numeric suffix (e.g., "85-mcmahon-drive" → "85-mcmahon")
  const noNumber = slug.replace(/-\d+$/, '');
  if (noNumber !== slug) variants.push(noNumber, `${noNumber}-condos`);
  return [...new Set(variants)];
}

// Map our neighborhood slugs to GTA-Homes area path prefixes
const NEIGHBORHOOD_TO_GTAHOMES: Record<string, string> = {
  'downtown-core': 'toronto-condos',
  'king-west': 'toronto-condos',
  'queen-west': 'toronto-condos',
  'liberty-village': 'toronto-condos',
  'yorkville': 'toronto-condos',
  'the-annex': 'toronto-condos',
  'midtown': 'toronto-condos',
  'yonge-eglinton': 'toronto-condos',
  'leslieville': 'toronto-condos',
  'riverside': 'toronto-condos',
  'danforth': 'toronto-condos',
  'high-park': 'toronto-condos',
  'junction': 'toronto-condos',
  'roncesvalles': 'toronto-condos',
  'waterfront': 'toronto-condos',
  'cityplace': 'toronto-condos',
  'fort-york': 'toronto-condos',
  'canary-district': 'toronto-condos',
  'port-lands': 'toronto-condos',
  'leaside': 'toronto-condos',
  'north-york': 'north-york-condos',
  'scarborough': 'scarborough-condos',
  'etobicoke': 'etobicoke-condos',
  'mississauga': 'mississauga-condos',
  'vaughan': 'vaughan-condos',
  'richmond-hill': 'richmond-hill-condos',
  'markham': 'markham-condos',
  'oakville': 'oakville-condos',
  'burlington': 'burlington-condos',
  'hamilton': 'new-condos-hamilton',
  'brampton': 'brampton-condos',
};

// ─── Scraper 1: UrbanToronto ──────────────────────────────────────────────────

async function scrapeUrbanToronto(project: Project): Promise<ScrapedData> {
  const results: ScrapedData = { images: [] };

  for (const variant of slugVariants(project.slug)) {
    const url = `https://urbantoronto.ca/database/projects/${variant}`;
    const html = await safeFetch(url);
    if (!html) continue;

    const $ = cheerio.load(html);

    // Skip if noindex (404/error page)
    if ($('meta[name="robots"]').attr('content')?.includes('noindex')) continue;

    // Description — try multiple selectors
    const descSelectors = [
      '.project-description',
      '.field-name-field-project-description',
      '.view-mode-full .field-type-text-with-summary',
      '#content .field-item',
      '.project-info p',
      'article p',
    ];
    for (const sel of descSelectors) {
      const text = cleanText($(sel).first().text());
      if (text.length > 100) {
        results.description = text;
        break;
      }
    }

    // Architect — only from structured data (dt/dd, label/value), not arbitrary text

    // Storeys
    $('*').filter((_, el) => /storey|floor/i.test($(el).text())).each((_, el) => {
      const t = $(el).next().text().trim();
      const n = parseNumber(t);
      if (n && n > 0 && n < 200 && !results.floors) results.floors = n;
    });

    // Units
    $('*').filter((_, el) => /\bunits?\b/i.test($(el).text())).each((_, el) => {
      const t = $(el).next().text().trim();
      const n = parseNumber(t);
      if (n && n > 0 && n < 10000 && !results.totalUnits) results.totalUnits = n;
    });

    // Look for spec table rows (dl/dt/dd pattern)
    $('dt, .label, .field-label').each((_, el) => {
      const label = $(el).text().toLowerCase().trim();
      const value = $(el).next('dd, .field-item').text().trim();
      if (!value) return;
      if (/architect/.test(label) && !results.architect && !isGarbageText(value)) results.architect = value;
      if (/storey|floor/.test(label) && !results.floors) results.floors = parseNumber(value) ?? undefined;
      if (/unit/.test(label) && !results.totalUnits) results.totalUnits = parseNumber(value) ?? undefined;
      if (/complet/.test(label) && !results.estCompletion) results.estCompletion = value;
    });

    // Images — UrbanToronto renders galleries via JS, only og:image is in static HTML
    const utOgImg = $('meta[property="og:image"]').attr('content');
    if (utOgImg && isValidImageUrl(utOgImg)) results.images!.push(utOgImg);

    // If we found useful data, stop trying variants
    if (results.description || (results.images && results.images.length > 0)) {
      results.source = `urbantoronto:${variant}`;
      break;
    }
  }

  results.images = dedupeImages(results.images || []);
  return results;
}

// ─── Scraper 2: GTA-Homes ────────────────────────────────────────────────────

async function scrapeGtaHomes(project: Project, neighborhoodSlug: string | null): Promise<ScrapedData> {
  const results: ScrapedData = { images: [] };
  const area = NEIGHBORHOOD_TO_GTAHOMES[neighborhoodSlug || ''] || 'toronto-condos';

  // Build URL candidates
  const urlCandidates: string[] = [];
  for (const variant of slugVariants(project.slug)) {
    urlCandidates.push(`https://www.gta-homes.com/${area}/${variant}/`);
    if (area !== 'toronto-condos') {
      urlCandidates.push(`https://www.gta-homes.com/toronto-condos/${variant}/`);
    }
  }

  // Also try their search — but validate the result matches our project name
  const searchUrl = `https://www.gta-homes.com/?s=${encodeURIComponent(project.name)}`;
  const searchHtml = await safeFetch(searchUrl);
  if (searchHtml) {
    const $s = cheerio.load(searchHtml);
    // Check all search results, not just the first one
    $s('article a, .entry-title a').each((_, el) => {
      const href = $s(el).attr('href');
      const linkText = $s(el).text().toLowerCase();
      if (href && href.includes('gta-homes.com') && !urlCandidates.includes(href)) {
        // Only use if the link text or URL slug reasonably matches our project name
        const nameWords = project.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        const matchCount = nameWords.filter(w => linkText.includes(w) || href.toLowerCase().includes(w)).length;
        if (matchCount >= Math.min(2, nameWords.length)) {
          urlCandidates.push(href);
        }
      }
    });
  }

  for (const url of urlCandidates) {
    const html = await safeFetch(url);
    if (!html) continue;

    const $ = cheerio.load(html);
    const title = $('title').text().toLowerCase();
    if (/not found|404|page not found/i.test(title)) continue;

    // Validate that the page is about the right project
    // Only accept condo/pre-construction pages, not resale or rental listings
    if (/rental|rent-|real-estate\//i.test(url)) continue;

    // Extract address number from our project name (e.g., "88" from "88 Spadina")
    const addrNum = project.name.match(/^(\d+)\s/)?.[1];

    // Check if this is a direct slug match
    const isDirectSlug = slugVariants(project.slug).some(v => url.includes(`/${v}/`));

    if (!isDirectSlug) {
      // For non-direct matches (from search), validate more strictly
      const nameWords = project.name.toLowerCase().split(/\s+/).filter(w => w.length > 2);
      const titleMatchCount = nameWords.filter(w => title.includes(w)).length;
      if (titleMatchCount < Math.min(2, nameWords.length)) continue;

      // If project starts with a number, the URL must contain that exact number
      if (addrNum) {
        const urlSlug = url.split('/').filter(Boolean).pop() || '';
        const numRegex = new RegExp(`(?:^|-)${addrNum}(?:-|$)`);
        if (!numRegex.test(urlSlug)) continue;
      }
    }

    // Description — WordPress uses .entry-content
    const descSelectors = ['.entry-content', '.project-description', '.project-overview', 'article .content', '.post-content'];
    for (const sel of descSelectors) {
      const paras = $(sel).find('p').map((_, el) => cleanText($(el).text())).get()
        .filter(t => t.length > 60);
      if (paras.length > 0) {
        results.description = paras.slice(0, 3).join('\n\n');
        break;
      }
    }

    // Price — look for $ patterns
    const bodyText = $('body').text();
    const priceMatches = bodyText.match(/starting\s+(?:from\s+)?\$[\d,.]+[MmKk]?/gi) ||
      bodyText.match(/from\s+\$[\d,.]+[MmKk]?/gi) || [];
    for (const pm of priceMatches) {
      const p = parsePrice(pm);
      if (p && p > 100000 && !results.priceMin) results.priceMin = p;
    }

    // Floors / units from spec tables
    $('table tr, .spec-row, .project-details li').each((_, el) => {
      const text = $(el).text();
      if (/storey|floor/i.test(text) && !results.floors) {
        results.floors = parseNumber(text) ?? undefined;
      }
      if (/\bunits?\b/i.test(text) && !results.totalUnits) {
        results.totalUnits = parseNumber(text) ?? undefined;
      }
      if (/architect/i.test(text) && !results.architect) {
        const val = cleanText(text.replace(/architect[:\s]*/i, ''));
        if (val.length < 100 && !isGarbageText(val)) results.architect = val;
      }
    });

    // Images — GTA-Homes renders galleries via JS, only og:image is in static HTML
    const gtaOgImg = $('meta[property="og:image"]').attr('content');
    if (gtaOgImg && isValidImageUrl(gtaOgImg)) results.images!.push(gtaOgImg);

    if (results.description || (results.images && results.images.length > 0)) {
      results.source = (results.source ? results.source + ',' : '') + `gtahomes:${url}`;
      break;
    }
    await sleep(300);
  }

  results.images = dedupeImages(results.images || []);
  return results;
}

// ─── Scraper 3: Livabl ───────────────────────────────────────────────────────

async function scrapeLibabl(project: Project): Promise<ScrapedData> {
  const results: ScrapedData = { images: [] };

  // Livabl uses PerimeterX bot protection — attempts are low-value but we try
  const url = `https://www.livabl.com/toronto-on/${project.slug}`;
  const html = await safeFetch(url);
  if (!html) return results;

  if (/px-captcha|access.*denied|perimeter/i.test(html)) return results;

  const $ = cheerio.load(html);

  // og:description
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (ogDesc && ogDesc.length > 60) results.description = cleanText(ogDesc);

  // Prices
  $('[class*="price"], [class*="Price"]').each((_, el) => {
    const text = $(el).text();
    if (!results.priceMin) results.priceMin = parsePrice(text) ?? undefined;
  });

  // Sq ft
  $('[class*="size"], [class*="sqft"], [class*="area"]').each((_, el) => {
    const text = $(el).text();
    const n = parseNumber(text);
    if (n && n > 200 && n < 10000 && !results.sizeRangeMin) results.sizeRangeMin = n;
  });

  // Completion
  const bodyText = $('body').text();
  const compMatch = bodyText.match(/(?:estimated completion|occupancy)[^\d]*(\d{4})/i);
  if (compMatch) results.estCompletion = compMatch[1];

  // og:image
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && isValidImageUrl(ogImg)) results.images!.push(ogImg);

  // Gallery images
  $('img[src*="livabl"], img[data-src*="livabl"]').each((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || '';
    if (isValidImageUrl(src)) results.images!.push(src);
  });

  results.images = dedupeImages(results.images || []);
  if (results.description || (results.images && results.images.length > 0)) {
    results.source = (results.source ? results.source + ',' : '') + 'livabl';
  }
  return results;
}

// ─── Scraper 4: Square Yards ─────────────────────────────────────────────────

async function scrapeSquareYards(project: Project): Promise<ScrapedData> {
  const results: ScrapedData = { images: [] };

  // Square Yards is partially JS-rendered; what we CAN get from static HTML:
  //   - LD+JSON SiteNavigationElement to find project-specific URL
  //   - og:image from the matched page
  const searchUrl = `https://www.squareyards.ca/toronto/pre-construction-condos/${project.slug}`;
  const html = await safeFetch(searchUrl);
  if (!html) return results;

  const $ = cheerio.load(html);

  // og:image
  const ogImg = $('meta[property="og:image"]').attr('content');
  if (ogImg && isValidImageUrl(ogImg) && !ogImg.includes('sy-logo')) results.images!.push(ogImg);

  // Parse any embedded JSON data (next.js __NEXT_DATA__ or similar)
  const scripts = $('script').map((_, el) => $(el).html() || '').get();
  for (const script of scripts) {
    if (script.includes('priceMin') || script.includes('price_min')) {
      const priceMatch = script.match(/"priceMin"\s*:\s*(\d+)/);
      if (priceMatch) results.priceMin = parseInt(priceMatch[1]);
      const floorMatch = script.match(/"floors"\s*:\s*(\d+)/);
      if (floorMatch) results.floors = parseInt(floorMatch[1]);
    }
    // image arrays in JSON
    const imgMatches = script.match(/https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)/g) || [];
    for (const img of imgMatches) {
      if (isValidImageUrl(img) && !/sy-logo|logo\//.test(img)) results.images!.push(img);
    }
  }

  results.images = dedupeImages(results.images || []);
  if (results.priceMin || (results.images && results.images.length > 0)) {
    results.source = (results.source ? results.source + ',' : '') + 'squareyards';
  }
  return results;
}

// ─── Merge results ────────────────────────────────────────────────────────────

function mergeResults(existing: Project, scraped: ScrapedData[]): Partial<Project> & { longDescription?: string } {
  const merged: Partial<Project> & { longDescription?: string } = {};

  // Pick best description (longest wins, min 80 chars)
  const descriptions = scraped
    .map(s => s.description)
    .filter((d): d is string => !!d && d.length >= 80)
    .sort((a, b) => b.length - a.length);

  if (descriptions.length > 0 && !existing.description) {
    merged.description = descriptions[0].slice(0, 800);
    if (descriptions[0].length > 800) {
      merged.longDescription = descriptions[0];
    }
  }

  // Numeric fields — take first non-null
  if (!existing.architect) {
    const arch = scraped.find(s => s.architect)?.architect;
    if (arch) merged.architect = arch;
  }
  if (!existing.floors) {
    const f = scraped.find(s => s.floors)?.floors;
    if (f) merged.floors = f;
  }
  if (!existing.totalUnits) {
    const u = scraped.find(s => s.totalUnits)?.totalUnits;
    if (u) merged.totalUnits = u;
  }
  if (!existing.priceMin) {
    const p = scraped.find(s => s.priceMin)?.priceMin;
    if (p) merged.priceMin = p;
  }
  if (!existing.priceMax) {
    const p = scraped.find(s => s.priceMax)?.priceMax;
    if (p) merged.priceMax = p;
  }
  if (!existing.sizeRangeMin) {
    const s = scraped.find(s => s.sizeRangeMin)?.sizeRangeMin;
    if (s) merged.sizeRangeMin = s;
  }
  if (!existing.estCompletion) {
    const e = scraped.find(s => s.estCompletion)?.estCompletion;
    if (e) merged.estCompletion = e;
  }

  // Merge all images from all sources
  const allImages: string[] = [
    ...(existing.images || []),
    ...scraped.flatMap(s => s.images || []),
  ];
  const dedupedImages = dedupeImages(allImages);

  if (dedupedImages.length > (existing.images || []).length) {
    merged.images = dedupedImages;
    if (!existing.mainImageUrl && dedupedImages.length > 0) {
      merged.mainImageUrl = dedupedImages[0];
    }
  }

  return merged;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔍 Fetching projects to enrich${DRY_RUN ? ' [DRY RUN]' : ''}...\n`);

  // Fetch projects — prioritize those with no description or images
  let query = supabase
    .from('projects')
    .select('id, name, slug, address, description, mainImageUrl, images, architect, floors, totalUnits, priceMin, priceMax, sizeRangeMin, sizeRangeMax, estCompletion, neighborhoodId')
    .order('name');

  // Focus on thin records first
  query = query.or('description.is.null,mainImageUrl.is.null');

  if (LIMIT) query = query.limit(LIMIT);

  const { data: projects, error } = await query;
  if (error) { console.error('DB error:', error); process.exit(1); }
  if (!projects || projects.length === 0) { console.log('No projects to enrich.'); return; }

  console.log(`Found ${projects.length} projects to enrich.\n`);

  let enrichedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i] as Project;
    const prefix = `[${String(i + 1).padStart(3)}/${projects.length}]`;

    process.stdout.write(`${prefix} ${project.name.slice(0, 50).padEnd(50)} `);

    try {
      // Run scrapers — stagger to avoid hammering any single domain
      // Run scrapers concurrently — different domains so no need to stagger
      const neighborhoodSlug = project.neighborhoodId; // stored as slug in our DB
      const [utResult, gtaResult, livResult, syResult] = await Promise.all([
        scrapeUrbanToronto(project),
        scrapeGtaHomes(project, neighborhoodSlug),
        scrapeLibabl(project),
        scrapeSquareYards(project),
      ]);

      const scraped = [utResult, gtaResult, livResult, syResult];
      const hasData = scraped.some(s =>
        s.description || (s.images && s.images.length > 0) || s.priceMin || s.floors
      );

      if (!hasData) {
        process.stdout.write('— no data found\n');
        skippedCount++;
        continue;
      }

      const updates = mergeResults(project, scraped);
      const sources = scraped.map(s => s.source).filter(Boolean).join(', ');

      if (Object.keys(updates).length === 0) {
        process.stdout.write('— already complete\n');
        skippedCount++;
        continue;
      }

      const summary = [
        updates.description ? `desc(${updates.description.length}ch)` : null,
        updates.images ? `imgs(${updates.images.length})` : null,
        updates.architect ? `arch` : null,
        updates.floors ? `${updates.floors}fl` : null,
        updates.totalUnits ? `${updates.totalUnits}u` : null,
        updates.priceMin ? `$${Math.round(updates.priceMin / 1000)}k` : null,
      ].filter(Boolean).join(' ');

      process.stdout.write(`✓ ${summary} [${sources || 'no source'}]\n`);

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({ ...updates, updatedAt: new Date().toISOString() })
          .eq('id', project.id);

        if (updateError) {
          console.error(`  ✗ Update failed: ${updateError.message}`);
          errorCount++;
        } else {
          enrichedCount++;
        }
      } else {
        enrichedCount++;
      }

    } catch (err) {
      process.stdout.write(`✗ Error: ${err instanceof Error ? err.message : String(err)}\n`);
      errorCount++;
    }

    // Brief pause between projects
    await sleep(100);
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Enriched: ${enrichedCount}  |  Skipped: ${skippedCount}  |  Errors: ${errorCount}`);
  if (DRY_RUN) console.log('(dry run — no DB changes written)');
  console.log('Done.\n');
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
