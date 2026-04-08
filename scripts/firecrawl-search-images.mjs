/**
 * Use Firecrawl SEARCH to find and scrape images for remaining projects.
 * Searches the web for each project, scrapes top results for images.
 *
 * Usage: FIRECRAWL_API_KEY=fc-xxx node scripts/firecrawl-search-images.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;
if (!FIRECRAWL_KEY) { console.error('Set FIRECRAWL_API_KEY'); process.exit(1); }

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const CACHE_DIR = '.firecrawl-cache';
mkdirSync(CACHE_DIR, { recursive: true });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

async function firecrawlSearch(query, limit = 5) {
  const cacheFile = path.join(CACHE_DIR, `search-${slugify(query.slice(0, 60))}.json`);
  if (existsSync(cacheFile)) {
    try { return JSON.parse(readFileSync(cacheFile, 'utf-8')); } catch {}
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}` },
      body: JSON.stringify({
        query,
        limit,
        scrapeOptions: { formats: ['markdown'] }
      })
    });
    if (res.status === 402) { console.log('    CREDITS EXHAUSTED'); return null; }
    if (!res.ok) { console.log(`    Search error: ${res.status}`); return null; }
    const data = await res.json();
    if (data.success && data.data) {
      writeFileSync(cacheFile, JSON.stringify(data.data, null, 2));
      return data.data;
    }
    return null;
  } catch (e) {
    console.log(`    Search error: ${e.message?.slice(0, 60)}`);
    return null;
  }
}

function extractImages(markdown, metadata) {
  const imgs = new Set();

  // OG image
  const ogImg = metadata?.ogImage || metadata?.['og:image'] || metadata?.image || '';
  if (ogImg?.startsWith('http')) imgs.add(ogImg);

  // Markdown image syntax: ![alt](url)
  const mdRegex = /!\[[^\]]*\]\(([^)\s]+)/g;
  let m;
  while ((m = mdRegex.exec(markdown)) !== null) {
    if (m[1].startsWith('http')) imgs.add(m[1]);
  }

  // Bare image URLs in text
  const urlRegex = /(https?:\/\/[^\s\)\"\>\]\,]+\.(?:jpg|jpeg|png|webp)(?:[^\s\)\"\>\]]*)?)/gi;
  const matches = markdown.match(urlRegex) || [];
  for (const url of matches) imgs.add(url);

  return [...imgs];
}

function filterImages(images) {
  const skip = [
    /favicon/i, /icon[\-_]/i, /sprite/i, /arrow/i, /chevron/i, /button/i,
    /menu/i, /hamburger/i, /social/i, /facebook/i, /twitter/i, /instagram/i,
    /linkedin/i, /youtube/i, /gravatar/i, /avatar/i, /placeholder/i,
    /pixel/i, /spacer/i, /tracking/i, /analytics/i, /\.gif(\?|$)/i,
    /loading/i, /spinner/i, /wp-emoji/i, /smilies/i, /widget/i, /badge/i,
    /payment/i, /\.svg(\?|$)/i, /unsplash\.com/i, /logo[\-_\.]/i,
    /author/i, /profile/i, /headshot/i, /team[\-_]/i,
  ];
  const tooSmall = /[_-](thumb|tiny|mini|xs|small|32|48|64|96|128|150x)\b/i;

  return images.filter(url => {
    if (url.length > 500 || url.length < 30) return false;
    if (skip.some(p => p.test(url))) return false;
    if (tooSmall.test(url)) return false;
    return true;
  });
}

function dedupeImages(images) {
  const seen = new Set();
  return images.filter(url => {
    const base = url.split('?')[0].split('#')[0];
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function pickBestMainImage(images, name) {
  // Prefer exterior/hero renderings from project-specific domains
  const heroPatterns = [/exterior/i, /hero/i, /aerial/i, /render/i, /building/i, /tower/i, /facade/i, /main/i, /featured/i, /banner/i, /cover/i, /EXT/];
  for (const p of heroPatterns) {
    const match = images.find(u => p.test(u));
    if (match) return match;
  }
  // Prefer images from known real estate / project CDNs
  const cdn = images.find(u => /upload|media|cdn|s3\.amazonaws|cloudinary|imgix/i.test(u));
  if (cdn) return cdn;
  return images[0] || null;
}

async function main() {
  const filterName = process.argv[2];

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, mainImageUrl, images, developer:developers(name, websiteUrl)')
    .order('name');

  let targets;
  if (filterName) {
    targets = projects.filter(p => p.name.toLowerCase().includes(filterName.toLowerCase()));
  } else {
    targets = projects.filter(p => !p.images?.gallery?.length);
  }

  console.log(`Searching for images for ${targets.length} projects\n`);

  let updated = 0, noImages = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    console.log(`[${i + 1}/${targets.length}] ${p.name}`);

    // Search with multiple queries for better coverage
    const queries = [
      `${p.name} Miami pre-construction condo images`,
      `${p.name} residences renderings gallery`,
    ];

    let allImages = [];

    for (const query of queries) {
      if (allImages.length >= 8) break;

      const results = await firecrawlSearch(query, 4);
      if (!results) { noImages++; continue; }

      for (const result of results) {
        const md = result.markdown || '';
        const meta = result.metadata || {};
        const pageImages = extractImages(md, meta);
        allImages.push(...pageImages);
      }

      await sleep(1500); // Rate limit between searches
    }

    allImages = dedupeImages(filterImages(allImages));

    if (allImages.length === 0) {
      console.log(`  NO IMAGES FOUND`);
      noImages++;
      continue;
    }

    const mainImage = pickBestMainImage(allImages, p.name);
    const gallery = allImages.slice(0, 12).map((url, idx) => ({
      url,
      alt: `${p.name} - Image ${idx + 1}`,
      type: url.toLowerCase().includes('interior') ? 'interior' :
            url.toLowerCase().includes('amenit') ? 'amenity' : 'rendering',
    }));

    const existingFloorPlans = p.images?.floorPlans || [];
    const updates = {};
    if (mainImage && (p.mainImageUrl?.includes('unsplash') || p.mainImageUrl?.includes('.svg') || !p.mainImageUrl)) {
      updates.mainImageUrl = mainImage;
    }
    updates.images = {
      gallery,
      ...(existingFloorPlans.length > 0 ? { floorPlans: existingFloorPlans } : {}),
    };

    const { error } = await supabase.from('projects').update(updates).eq('id', p.id);
    if (error) {
      console.log(`  DB ERROR: ${error.message}`);
    } else {
      console.log(`  OK: ${updates.mainImageUrl ? 'main + ' : ''}${gallery.length} gallery images`);
      updated++;
    }

    await sleep(1000);
  }

  console.log(`\n=== Done: ${updated} updated, ${noImages} no images ===`);
}

main().catch(console.error);
