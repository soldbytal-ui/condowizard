/**
 * Deep crawl developer/project websites for real images.
 * Uses Firecrawl API if FIRECRAWL_API_KEY is set, otherwise fetch + cheerio.
 *
 * Usage:
 *   node scripts/deep-crawl-images.mjs                  # all projects needing images
 *   node scripts/deep-crawl-images.mjs "Season One"     # single project by name
 */
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY || '';
const CACHE_DIR = '.crawl-cache';
mkdirSync(CACHE_DIR, { recursive: true });

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// Known project website patterns
const PROJECT_SITES = {
  'season-one-brickell': 'https://seasononebrickell.com',
  'baccarat-residences-miami': 'https://baccaratresidencesmiami.com',
  'cipriani-residences-miami': 'https://ciprianibrickell.com',
  'mercedes-benz-places': 'https://mercedesbenzplaces.com',
  'waldorf-astoria-residences': 'https://waldorfastoriaresidencesmiami.com',
  '888-brickell': 'https://888brickell.com',
  'the-residences-at-1428-brickell': 'https://1428brickell.com',
  'five-park-miami-beach': 'https://fiveparkmiamibeach.com',
  'st-regis-residences-miami': 'https://stregisresidencesmiami.com',
  'bentley-residences': 'https://bentleyresidences.com',
  'the-perigon-miami-beach': 'https://theperigon.com',
  'aston-martin-residences': 'https://astonmartinresidences.com',
  'dolce-and-gabbana-miami': 'https://dolcegabbanaresidencesmiami.com',
  'okan-tower': 'https://okantowermiami.com',
  'lofty-brickell': 'https://loftybrickell.com',
  'aria-reserve': 'https://ariareserve.com',
  'villa-miami': 'https://villaamiami.com',
  'casa-bella': 'https://casabellaresidences.com',
  'the-well-coconut-grove': 'https://www.thewellcoconutgrove.com',
  'rivage-bal-harbour': 'https://rivageresidences.com',
  'edition-residences-miami': 'https://editionresidencesmiami.com',
  'one-highline': 'https://onehighline.com',
  'aman-miami-beach': 'https://amanresidencesmiamibeach.com',
  'shore-club-private-collection': 'https://shoreclubprivatecollection.com',
  'the-ritz-carlton-residences-miami-beach': 'https://theritzmiami.com',
  '72-park-miami-beach': 'https://72parkmiamibeach.com',
  'nexo-residences': 'https://nexoresidences.com',
  'ella-miami': 'https://ellaresidencesmiami.com',
  '14roc-miami': 'https://14roc.com',
};

// Listing sites as fallback sources
const LISTING_SITES = [
  (name) => `https://www.condoblackbook.com/buildings/${slugify(name)}`,
  (name) => `https://www.miamicondoinvestments.com/${slugify(name)}`,
  (name) => `https://preconstruction.info/miami/${slugify(name)}`,
];

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function getCachePath(url) {
  const safe = slugify(url.replace(/https?:\/\//, '').slice(0, 80));
  return path.join(CACHE_DIR, `${safe}.html`);
}

async function fetchPage(url, retries = 2) {
  const cached = getCachePath(url);
  if (existsSync(cached)) {
    try { return readFileSync(cached, 'utf-8'); } catch {}
  }

  for (let i = 0; i <= retries; i++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*' },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (!res.ok) return null;
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html') && !ct.includes('application/xhtml')) return null;
      const html = await res.text();
      writeFileSync(cached, html);
      return html;
    } catch (e) {
      if (i === retries) return null;
      await sleep(1000);
    }
  }
  return null;
}

// ---- Firecrawl API crawl ----
async function firecrawlCrawl(url, maxPages = 10) {
  if (!FIRECRAWL_KEY) return null;
  try {
    console.log(`    [firecrawl] Starting crawl of ${url}...`);
    const res = await fetch('https://api.firecrawl.dev/v1/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${FIRECRAWL_KEY}` },
      body: JSON.stringify({
        url,
        limit: maxPages,
        maxDepth: 3,
        scrapeOptions: { formats: ['html'], includeTags: ['img', 'picture', 'source', 'meta'] }
      })
    });
    if (!res.ok) {
      console.log(`    [firecrawl] Error: ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    if (!data.success || !data.id) return null;

    // Poll for results
    for (let i = 0; i < 30; i++) {
      await sleep(3000);
      const poll = await fetch(`https://api.firecrawl.dev/v1/crawl/${data.id}`, {
        headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}` }
      });
      const result = await poll.json();
      if (result.status === 'completed') {
        console.log(`    [firecrawl] Crawled ${result.data?.length || 0} pages`);
        return result.data || [];
      }
      if (result.status === 'failed') {
        console.log(`    [firecrawl] Crawl failed`);
        return null;
      }
    }
    return null;
  } catch (e) {
    console.log(`    [firecrawl] Error: ${e.message}`);
    return null;
  }
}

// ---- Image extraction from HTML ----
function extractImagesFromHtml(html, baseUrl) {
  const $ = cheerio.load(html);
  const images = new Set();

  // <img> tags - src and srcset
  $('img').each((_, el) => {
    const src = $(el).attr('src');
    const srcset = $(el).attr('srcset');
    const dataSrc = $(el).attr('data-src') || $(el).attr('data-lazy-src') || $(el).attr('data-original');

    [src, dataSrc].filter(Boolean).forEach(s => {
      const resolved = resolveUrl(s, baseUrl);
      if (resolved) images.add(resolved);
    });

    if (srcset) {
      srcset.split(',').forEach(entry => {
        const url = entry.trim().split(/\s+/)[0];
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) images.add(resolved);
      });
    }
  });

  // <picture> <source> tags
  $('source').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(entry => {
        const url = entry.trim().split(/\s+/)[0];
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) images.add(resolved);
      });
    }
  });

  // OG image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    const resolved = resolveUrl(ogImage, baseUrl);
    if (resolved) images.add(resolved);
  }

  // Background images in style attributes
  $('[style*="background"]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const match = style.match(/url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/);
    if (match) images.add(match[1]);
  });

  // CSS background images in <style> tags
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    const regex = /url\(['"]?(https?:\/\/[^'")\s]+)['"]?\)/g;
    let m;
    while ((m = regex.exec(css)) !== null) {
      images.add(m[1]);
    }
  });

  // JSON-LD structured data images
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).html());
      extractJsonImages(json, images);
    } catch {}
  });

  return [...images];
}

function extractJsonImages(obj, images) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) { obj.forEach(item => extractJsonImages(item, images)); return; }
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string' && /^https?:\/\/.+\.(jpg|jpeg|png|webp)/i.test(val)) {
      images.add(val);
    } else if (typeof val === 'object') {
      extractJsonImages(val, images);
    }
  }
}

function resolveUrl(url, base) {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) return null;
  try {
    return new URL(url, base).href;
  } catch {
    return null;
  }
}

// ---- Link discovery for deep crawl ----
function findGalleryLinks(html, baseUrl) {
  const $ = cheerio.load(html);
  const links = new Set();
  const galleryKeywords = /gallery|photos|images|media|amenities|residences|floor.?plan|views|lifestyle|features|interiors|exterior|renderings|units|penthouses|design|living|experience|explore|discover|tower|building|neighborhood|location|about/i;

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    const text = ($(el).text() || '').trim();
    const resolved = resolveUrl(href, baseUrl);
    if (!resolved) return;

    // Same domain only
    try {
      const linkDomain = new URL(resolved).hostname;
      const baseDomain = new URL(baseUrl).hostname;
      if (linkDomain !== baseDomain) return;
    } catch { return; }

    // Match gallery-related links by URL path or link text
    if (galleryKeywords.test(resolved) || galleryKeywords.test(text)) {
      links.add(resolved);
    }
  });

  return [...links];
}

// ---- Image filtering ----
function filterImages(images, projectName) {
  const skipPatterns = [
    /favicon/i, /icon/i, /logo.*\.(svg|png)/i, /sprite/i, /arrow/i, /chevron/i,
    /button/i, /close/i, /menu/i, /hamburger/i, /search/i, /social/i,
    /facebook/i, /twitter/i, /instagram/i, /linkedin/i, /youtube/i, /pinterest/i,
    /gravatar/i, /avatar/i, /placeholder/i, /blank\./i, /pixel\./i, /spacer/i,
    /tracking/i, /analytics/i, /\.gif$/i, /1x1/i, /loading/i, /spinner/i,
    /wp-emoji/i, /smilies/i, /widget/i, /badge/i, /payment/i, /visa/i, /mastercard/i,
  ];

  // Size heuristics from URL
  const tooSmall = /[_-](\d{1,2}x\d{1,2}|thumb|tiny|mini|xs|small|32|48|64|96|128)\./i;

  return images.filter(url => {
    if (url.length > 500) return false;
    if (skipPatterns.some(p => p.test(url))) return false;
    if (tooSmall.test(url)) return false;
    // Skip SVGs - they're logos/icons, not photos
    if (/\.svg(\?|$)/i.test(url)) return false;
    // Keep only raster image file extensions
    const hasImageExt = /\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(url);
    const isKnownCdn = /wp-content\/uploads|amazonaws\.com|cloudinary|imgix|supabase/i.test(url);
    if (!hasImageExt && !isKnownCdn) return false;
    return true;
  });
}

function dedupeImages(images) {
  const seen = new Set();
  return images.filter(url => {
    // Normalize: strip query params for dedup, but keep original URL
    const base = url.split('?')[0].split('#')[0].replace(/-(scaled|rotated|\d+x\d+)/, '');
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function pickBestMainImage(images, projectName) {
  const name = projectName.toLowerCase();

  // Priority 1: exterior/hero/aerial rendering from the project site
  const heroPatterns = [/hero/i, /exterior/i, /aerial/i, /render/i, /building/i, /tower/i, /facade/i, /main/i, /featured/i, /header/i, /banner/i, /cover/i];
  for (const pattern of heroPatterns) {
    const match = images.find(u => pattern.test(u));
    if (match) return match;
  }

  // Priority 2: OG image or first large image
  const ogImage = images.find(u => u.includes('og-image') || u.includes('og_image') || u.includes('share'));
  if (ogImage) return ogImage;

  // Priority 3: first image that's likely a rendering (from uploads/media paths)
  const upload = images.find(u => u.includes('upload') || u.includes('media') || u.includes('cdn'));
  if (upload) return upload;

  return images[0] || null;
}

// ---- Deep crawl a single site ----
async function deepCrawlSite(startUrl, projectName) {
  console.log(`  Crawling ${startUrl}...`);

  // Try Firecrawl first
  if (FIRECRAWL_KEY) {
    const pages = await firecrawlCrawl(startUrl, 10);
    if (pages && pages.length > 0) {
      let allImages = [];
      for (const page of pages) {
        const html = page.html || page.rawHtml || '';
        if (html) {
          allImages.push(...extractImagesFromHtml(html, page.url || startUrl));
        }
      }
      return dedupeImages(filterImages(allImages, projectName));
    }
  }

  // Fallback: manual crawl with fetch + cheerio
  const allImages = [];
  const visited = new Set();

  // Level 0: homepage
  const homepage = await fetchPage(startUrl);
  if (!homepage) {
    console.log(`    Failed to fetch ${startUrl}`);
    return [];
  }

  visited.add(startUrl);
  allImages.push(...extractImagesFromHtml(homepage, startUrl));

  // Find gallery-related links
  const galleryLinks = findGalleryLinks(homepage, startUrl);
  console.log(`    Found ${galleryLinks.length} gallery-related links`);

  // Level 1: crawl gallery/amenity/residences pages
  for (const link of galleryLinks.slice(0, 12)) {
    if (visited.has(link)) continue;
    visited.add(link);

    await sleep(500);
    const html = await fetchPage(link);
    if (!html) continue;

    const pageImages = extractImagesFromHtml(html, link);
    allImages.push(...pageImages);
    console.log(`    ${new URL(link).pathname}: ${pageImages.length} images`);

    // Level 2: follow gallery sub-links
    const subLinks = findGalleryLinks(html, link);
    for (const subLink of subLinks.slice(0, 5)) {
      if (visited.has(subLink)) continue;
      visited.add(subLink);

      await sleep(300);
      const subHtml = await fetchPage(subLink);
      if (!subHtml) continue;

      const subImages = extractImagesFromHtml(subHtml, subLink);
      allImages.push(...subImages);
      if (subImages.length > 0) {
        console.log(`      ${new URL(subLink).pathname}: ${subImages.length} images`);
      }
    }
  }

  return dedupeImages(filterImages(allImages, projectName));
}

// ---- Scrape listing sites as fallback ----
async function scrapeListingSites(projectName) {
  console.log(`  Trying listing sites for "${projectName}"...`);
  const allImages = [];

  const searchUrls = [
    `https://www.condoblackbook.com/buildings/${slugify(projectName)}`,
    `https://www.miamicondoinvestments.com/${slugify(projectName)}/`,
    `https://preconstruction.info/miami/${slugify(projectName)}/`,
  ];

  for (const url of searchUrls) {
    await sleep(500);
    const html = await fetchPage(url);
    if (!html) continue;

    const images = extractImagesFromHtml(html, url);
    const filtered = filterImages(images, projectName);
    if (filtered.length > 0) {
      console.log(`    ${new URL(url).hostname}: ${filtered.length} images`);
      allImages.push(...filtered);
    }
  }

  return dedupeImages(allImages);
}

// ---- Google search for project website ----
async function findProjectWebsite(projectName) {
  // Try common domain patterns
  const slug = slugify(projectName);
  const attempts = [
    `https://${slug}.com`,
    `https://www.${slug}.com`,
    `https://${slug.replace(/-/g, '')}.com`,
  ];

  for (const url of attempts) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
        redirect: 'follow',
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        console.log(`    Discovered website: ${url}`);
        return url;
      }
    } catch {}
  }
  return null;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

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
    console.log(`Filtering to ${targets.length} projects matching "${filterName}"`);
  } else {
    // Prioritize: unsplash placeholders first, then no gallery
    targets = projects.filter(p =>
      p.mainImageUrl?.includes('unsplash') ||
      !p.images?.gallery?.length
    );
    console.log(`${targets.length} projects need images (${projects.length} total)`);
  }

  let updated = 0, failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    console.log(`\n[${i + 1}/${targets.length}] ${p.name}`);

    let images = [];

    // 1. Try known project website
    const knownSite = PROJECT_SITES[p.slug];
    if (knownSite) {
      images = await deepCrawlSite(knownSite, p.name);
    }

    // 2. Try discovering the project website
    if (images.length < 3) {
      const discovered = await findProjectWebsite(p.name);
      if (discovered) {
        const moreImages = await deepCrawlSite(discovered, p.name);
        images = dedupeImages([...images, ...moreImages]);
      }
    }

    // 3. Try developer website + project path
    if (images.length < 3 && p.developer?.websiteUrl) {
      const devUrl = p.developer.websiteUrl;
      const devSlug = slugify(p.name);
      const devProjectUrls = [
        `${devUrl}/projects/${devSlug}`,
        `${devUrl}/properties/${devSlug}`,
        `${devUrl}/${devSlug}`,
      ];
      for (const url of devProjectUrls) {
        const html = await fetchPage(url);
        if (html) {
          const devImages = filterImages(extractImagesFromHtml(html, url), p.name);
          if (devImages.length > 0) {
            console.log(`    Developer site: ${devImages.length} images`);
            images = dedupeImages([...images, ...devImages]);
            break;
          }
        }
        await sleep(300);
      }
    }

    // 4. Fallback to listing sites
    if (images.length < 3) {
      const listingImages = await scrapeListingSites(p.name);
      images = dedupeImages([...images, ...listingImages]);
    }

    if (images.length === 0) {
      console.log(`  NO IMAGES FOUND`);
      failed++;
      continue;
    }

    // Pick best main image and build gallery
    const mainImage = pickBestMainImage(images, p.name);
    const gallery = images.slice(0, 12).map((url, idx) => ({
      url,
      alt: `${p.name} - Image ${idx + 1}`,
      type: url.toLowerCase().includes('interior') ? 'interior' :
            url.toLowerCase().includes('amenit') ? 'amenity' : 'rendering',
    }));

    // Preserve existing floor plans if they exist
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
      failed++;
    } else {
      console.log(`  OK: ${mainImage ? 'main + ' : ''}${gallery.length} gallery images`);
      updated++;
    }

    await sleep(800);
  }

  console.log(`\n=== Done: ${updated} updated, ${failed} failed, ${targets.length - updated - failed} skipped ===`);
}

main().catch(console.error);
