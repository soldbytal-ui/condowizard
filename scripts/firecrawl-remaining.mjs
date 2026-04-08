/**
 * Use Firecrawl API to find and scrape images for remaining projects.
 * Uses search to find project pages, then scrapes them for images.
 *
 * Usage: FIRECRAWL_API_KEY=fc-xxx node scripts/firecrawl-remaining.mjs
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

// ---- Firecrawl API helpers ----

async function firecrawlScrape(url) {
  const cacheFile = path.join(CACHE_DIR, `scrape-${slugify(url.replace(/https?:\/\//, '').slice(0, 60))}.json`);
  if (existsSync(cacheFile)) {
    try { return JSON.parse(readFileSync(cacheFile, 'utf-8')); } catch {}
  }

  try {
    const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}` },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'links'],
        timeout: 30000,
      })
    });
    if (!res.ok) {
      if (res.status === 402) { console.log('    [firecrawl] Credits exhausted!'); return null; }
      return null;
    }
    const data = await res.json();
    if (data.success) writeFileSync(cacheFile, JSON.stringify(data, null, 2));
    return data.success ? data : null;
  } catch (e) {
    console.log(`    [firecrawl] Scrape error: ${e.message?.slice(0, 60)}`);
    return null;
  }
}

async function firecrawlCrawl(url, limit = 10) {
  const cacheFile = path.join(CACHE_DIR, `crawl-${slugify(url.replace(/https?:\/\//, '').slice(0, 60))}.json`);
  if (existsSync(cacheFile)) {
    try { return JSON.parse(readFileSync(cacheFile, 'utf-8')); } catch {}
  }

  try {
    console.log(`    [firecrawl] Starting crawl of ${url} (limit ${limit})...`);
    const res = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}` },
      body: JSON.stringify({
        url,
        limit,
        maxDepth: 2,
        scrapeOptions: { formats: ['markdown', 'links'] },
        includePaths: ['gallery', 'photos', 'images', 'amenities', 'residences', 'floor-plan',
          'views', 'lifestyle', 'features', 'interiors', 'exterior', 'renderings',
          'units', 'penthouses', 'design', 'living', 'experience', 'explore', 'about'],
      })
    });
    if (!res.ok) {
      if (res.status === 402) { console.log('    [firecrawl] Credits exhausted!'); return null; }
      console.log(`    [firecrawl] Crawl start error: ${res.status}`);
      return null;
    }
    const { id, success } = await res.json();
    if (!success || !id) return null;

    // Poll for completion
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const poll = await fetch(`https://api.firecrawl.dev/v1/crawl/${id}`, {
        headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}` }
      });
      const result = await poll.json();
      if (result.status === 'completed') {
        const pages = result.data || [];
        console.log(`    [firecrawl] Crawled ${pages.length} pages`);
        writeFileSync(cacheFile, JSON.stringify(pages, null, 2));
        return pages;
      }
      if (result.status === 'failed') {
        console.log(`    [firecrawl] Crawl failed`);
        return null;
      }
    }
    console.log(`    [firecrawl] Crawl timeout`);
    return null;
  } catch (e) {
    console.log(`    [firecrawl] Crawl error: ${e.message?.slice(0, 60)}`);
    return null;
  }
}

// ---- Image extraction from markdown ----

function extractImagesFromMarkdown(markdown, metadata) {
  const imgs = new Set();

  // OG image
  const ogImg = metadata?.ogImage || metadata?.['og:image'] || metadata?.image || '';
  if (ogImg && ogImg.startsWith('http')) imgs.add(ogImg);

  // Image URLs from markdown: ![alt](url) and bare URLs
  const mdImgRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m;
  while ((m = mdImgRegex.exec(markdown)) !== null) {
    if (m[1].startsWith('http')) imgs.add(m[1].split(' ')[0]);
  }

  // Bare image URLs
  const urlRegex = /(https?:\/\/[^\s\)\"\>\]\,]+\.(?:jpg|jpeg|png|webp)(?:[^\s\)\"\>\]]*)?)/gi;
  const matches = markdown.match(urlRegex) || [];
  for (const url of matches) imgs.add(url);

  return [...imgs];
}

function extractImagesFromLinks(links) {
  if (!Array.isArray(links)) return [];
  return links.filter(l =>
    /\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(l) &&
    !/\.svg/i.test(l)
  );
}

// ---- Filtering ----

function filterImages(images) {
  const skip = [
    /favicon/i, /icon/i, /sprite/i, /arrow/i, /chevron/i, /button/i, /close/i,
    /menu/i, /hamburger/i, /search/i, /social/i, /facebook/i, /twitter/i,
    /instagram/i, /linkedin/i, /youtube/i, /gravatar/i, /avatar/i, /placeholder/i,
    /blank\./i, /pixel/i, /spacer/i, /tracking/i, /analytics/i, /\.gif(\?|$)/i,
    /1x1/i, /loading/i, /spinner/i, /wp-emoji/i, /smilies/i, /widget/i,
    /badge/i, /payment/i, /visa/i, /mastercard/i, /logo/i, /\.svg/i,
  ];
  const tooSmall = /[_-](thumb|tiny|mini|xs|small|32|48|64|96|128)\b/i;

  return images.filter(url => {
    if (url.length > 500 || url.length < 30) return false;
    if (skip.some(p => p.test(url))) return false;
    if (tooSmall.test(url)) return false;
    if (/\.svg(\?|$)/i.test(url)) return false;
    return true;
  });
}

function dedupeImages(images) {
  const seen = new Set();
  return images.filter(url => {
    const base = url.split('?')[0].split('#')[0].replace(/-(scaled|rotated|\d+x\d+)/, '');
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function pickBestMainImage(images, name) {
  const heroPatterns = [/hero/i, /exterior/i, /aerial/i, /render/i, /building/i, /tower/i, /facade/i, /main/i, /featured/i, /header/i, /banner/i, /cover/i, /CAM/i];
  for (const p of heroPatterns) {
    const match = images.find(u => p.test(u));
    if (match) return match;
  }
  return images.find(u => /upload|media|cdn/i.test(u)) || images[0] || null;
}

// ---- Website discovery via Firecrawl search ----

async function findProjectSite(projectName) {
  // Try common domain patterns first (free, no credits)
  const slug = slugify(projectName);
  const variants = [
    `https://${slug}.com`,
    `https://www.${slug}.com`,
    `https://${slug.replace(/-/g, '')}.com`,
  ];
  for (const url of variants) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' } });
      clearTimeout(t);
      if (res.ok) return res.url || url;
    } catch {}
  }
  return null;
}

// ---- Process one project ----

async function processProject(project) {
  let allImages = [];

  // Step 1: Try to find and crawl the project's own website
  const site = await findProjectSite(project.name);
  if (site) {
    console.log(`    Found site: ${site}`);
    const pages = await firecrawlCrawl(site, 8);
    if (pages) {
      for (const page of pages) {
        const md = page.markdown || '';
        const meta = page.metadata || {};
        allImages.push(...extractImagesFromMarkdown(md, meta));
        allImages.push(...extractImagesFromLinks(page.links || []));
      }
    }
  }

  // Step 2: If not enough, scrape search results for this project
  if (allImages.length < 3) {
    const searchQueries = [
      `${project.name} Miami condo`,
      `${project.name} pre-construction renderings`,
    ];
    for (const query of searchQueries) {
      if (allImages.length >= 5) break;

      // Use Firecrawl scrape on known listing sites
      const listingUrls = [
        `https://www.condoblackbook.com/buildings/${slugify(project.name)}`,
        `https://www.miamicondoinvestments.com/${slugify(project.name)}/`,
        `https://preconstruction.info/miami/${slugify(project.name)}/`,
        `https://www.bfrealtygroup.com/new-construction/${slugify(project.name)}`,
      ];

      for (const url of listingUrls) {
        if (allImages.length >= 5) break;
        const result = await firecrawlScrape(url);
        if (result?.data) {
          const md = result.data.markdown || '';
          const meta = result.data.metadata || {};
          allImages.push(...extractImagesFromMarkdown(md, meta));
          allImages.push(...extractImagesFromLinks(result.data.links || []));
        }
        await sleep(500);
      }
    }
  }

  // Step 3: Try developer website with project name in path
  if (allImages.length < 3 && project.developer?.websiteUrl) {
    const devUrl = project.developer.websiteUrl;
    const paths = [`/projects/${slugify(project.name)}`, `/${slugify(project.name)}`, `/properties/${slugify(project.name)}`];
    for (const p of paths) {
      const result = await firecrawlScrape(devUrl + p);
      if (result?.data) {
        const md = result.data.markdown || '';
        const meta = result.data.metadata || {};
        allImages.push(...extractImagesFromMarkdown(md, meta));
        if (allImages.length >= 3) break;
      }
      await sleep(300);
    }
  }

  return dedupeImages(filterImages(allImages));
}

// ---- Main ----

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

  console.log(`Processing ${targets.length} projects with Firecrawl API\n`);

  let updated = 0, noImages = 0, creditsDepleted = false;

  for (let i = 0; i < targets.length; i++) {
    if (creditsDepleted) break;

    const p = targets[i];
    console.log(`[${i + 1}/${targets.length}] ${p.name}`);

    const images = await processProject(p);

    if (images.length === 0) {
      console.log(`  NO IMAGES FOUND`);
      noImages++;
      continue;
    }

    const mainImage = pickBestMainImage(images, p.name);
    const gallery = images.slice(0, 12).map((url, idx) => ({
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
      console.log(`  OK: ${mainImage && updates.mainImageUrl ? 'main + ' : ''}${gallery.length} gallery images`);
      updated++;
    }

    await sleep(1000);
  }

  console.log(`\n=== Done: ${updated} updated, ${noImages} no images found ===`);
}

main().catch(console.error);
