/**
 * Second-pass image audit using Firecrawl for the 86 projects the
 * direct scraper could not fill.
 *
 * Per project:
 *   1. Firecrawl /v1/search for "{name} {city} {builder} community" (1 credit)
 *   2. If a promising URL comes back, Firecrawl /v1/scrape it (1 credit)
 *   3. Extract ogImage from response metadata
 *   4. Reject logos/icons/generic; save real renderings to DB
 *
 * Budget guard: DEFAULT_MAX_CREDITS caps the run.
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(function loadEnv() {
  const text = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
})();

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_KEY) throw new Error('FIRECRAWL_API_KEY missing');

const prisma = new PrismaClient();
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v ?? true];
}));
const DEFAULT_MAX_CREDITS = 250;
const MAX_CREDITS = args.credits ? parseInt(args.credits, 10) : DEFAULT_MAX_CREDITS;
const LIMIT = args.limit ? parseInt(args.limit, 10) : 9999;
let creditsUsed = 0;

async function fcSearch(query) {
  const r = await fetch('https://api.firecrawl.dev/v1/search', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, limit: 3 }),
  });
  creditsUsed += 1;
  if (!r.ok) return null;
  const d = await r.json();
  return d?.data || [];
}

async function fcScrape(url) {
  const r = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: false }),
  });
  creditsUsed += 1;
  if (!r.ok) return null;
  const d = await r.json();
  return d?.data || null;
}

// Reject URLs that look like logos, icons, generic OGs, third-party trackers
const IMAGE_BLACKLIST = [
  /\/logo/i, /_logo/i, /-logo/i,
  /favicon/i, /apple-touch/i,
  /placeholder/i, /default/i, /share[-_]?image/i,
  /\.svg$/i,
  /flagcdn\.com/i, /gravatar/i, /googletagmanager/i, /googleusercontent\.com\/img/i,
  /mattamylogo/i, /prodmh\.b-cdn\.net\/-\/media\/Feature\/Content\/Identity/i,
];
const isRejected = (u) => !u || IMAGE_BLACKLIST.some(rx => rx.test(u));

// Look through markdown for gallery images
function findImagesInMarkdown(md, slug) {
  if (!md) return [];
  const images = [...md.matchAll(/!\[[^\]]*\]\(([^)]+\.(?:jpg|jpeg|png|webp))[^)]*\)/gi)]
    .map(m => m[1])
    .filter(u => !isRejected(u));
  // Prefer ones referencing the project slug word
  const words = slug.split('-').filter(w => w.length > 3);
  images.sort((a, b) => {
    const aHit = words.some(w => a.toLowerCase().includes(w));
    const bHit = words.some(w => b.toLowerCase().includes(w));
    if (aHit && !bHit) return -1;
    if (!aHit && bHit) return 1;
    return 0;
  });
  return images;
}

// Reject unhelpful search hosts (social, forums, aggregators without pictures)
const SEARCH_HOST_BLACKLIST = [
  /facebook\.com/i, /reddit\.com/i, /twitter\.com/i, /instagram\.com/i,
  /linkedin\.com/i, /youtube\.com/i, /pinterest\.com/i,
  /realtor\.ca/i, // limited OG data
];

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

async function findImageForProject(p) {
  const city = p.address?.split(',')?.[1]?.trim() || p.neighborhood?.name || '';
  const builder = p.developer?.name || '';
  const q = `${p.name} ${city} ${builder} community renderings`;

  const searchResults = await fcSearch(q);
  if (!searchResults?.length) return null;

  const candidates = searchResults
    .filter(r => r?.url && !SEARCH_HOST_BLACKLIST.some(rx => rx.test(r.url)))
    .slice(0, 2); // top 2 usable results

  const slug = slugify(p.name);

  for (const result of candidates) {
    if (creditsUsed >= MAX_CREDITS) return null;
    const scraped = await fcScrape(result.url);
    if (!scraped) continue;
    const meta = scraped.metadata || {};
    const md = scraped.markdown || '';

    // Priority order: ogImage, twitterImage, images in markdown
    const candidatePool = [];
    if (meta.ogImage && !isRejected(meta.ogImage)) candidatePool.push(meta.ogImage);
    if (meta.twitterImage && !isRejected(meta.twitterImage)) candidatePool.push(meta.twitterImage);
    candidatePool.push(...findImagesInMarkdown(md, slug));

    if (candidatePool.length === 0) continue;

    // Verify chosen URL actually returns an image
    const chosen = candidatePool[0];
    try {
      const check = await fetch(chosen, { method: 'HEAD' });
      if (!check.ok) continue;
      const ct = check.headers.get('content-type') || '';
      if (!ct.startsWith('image/')) continue;
    } catch { continue; }

    return {
      mainImageUrl: chosen,
      gallery: candidatePool.slice(0, 8).map((url, i) => ({ url, alt: `${p.name} - Image ${i + 1}` })),
      sourceUrl: result.url,
    };
  }

  return null;
}

async function main() {
  const missing = await prisma.project.findMany({
    where: { mainImageUrl: null },
    include: { developer: true, neighborhood: true },
    orderBy: { createdAt: 'asc' },
    take: LIMIT,
  });
  console.log(`Firecrawl audit: ${missing.length} projects, budget ${MAX_CREDITS} credits\n`);

  const hits = [], misses = [];

  // Sequential to strictly bound credit use
  for (const p of missing) {
    if (creditsUsed >= MAX_CREDITS) {
      console.log(`\n[BUDGET] ${creditsUsed}/${MAX_CREDITS} credits used, stopping`);
      break;
    }
    try {
      const result = await findImageForProject(p);
      if (result) {
        await prisma.project.update({
          where: { id: p.id },
          data: {
            mainImageUrl: result.mainImageUrl,
            images: { gallery: result.gallery },
          },
        });
        hits.push(p.name);
        console.log(`✓ [${p.buildingType}] ${p.name.padEnd(40)} → ${new URL(result.sourceUrl).hostname} (${creditsUsed} cred used)`);
      } else {
        misses.push(p.name);
        console.log(`· [${p.buildingType}] ${p.name.padEnd(40)}   (${creditsUsed} cred used)`);
      }
    } catch (e) {
      misses.push(p.name);
      console.log(`✗ [${p.buildingType}] ${p.name.padEnd(40)}   error: ${e.message}`);
    }
  }

  console.log(`\n════════════════════════════════`);
  console.log(`Hits:    ${hits.length}`);
  console.log(`Misses:  ${misses.length}`);
  console.log(`Credits: ${creditsUsed}`);

  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
