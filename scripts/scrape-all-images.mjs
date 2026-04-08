/**
 * Scrape real images for all projects using Firecrawl search + scrape.
 * Updates mainImageUrl and images JSON in Supabase.
 * Also scrapes floor plans and developer logos.
 *
 * Usage: node scripts/scrape-all-images.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const CACHE_DIR = '.firecrawl';
mkdirSync(CACHE_DIR, { recursive: true });

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function extractImages(markdown, metadata) {
  const imgs = [];
  const ogImg = metadata?.ogImage || metadata?.['og:image'] || '';
  if (ogImg && ogImg.startsWith('http')) imgs.push(ogImg);

  // Extract from markdown
  const urlRegex = /(https?:\/\/[^\s\)\"\>\]\,]+\.(?:jpg|jpeg|png|webp)(?:[^\s\)\"\>\]]*)?)/gi;
  const matches = markdown.match(urlRegex) || [];
  for (const m of matches) {
    if (!m.includes('icon') && !m.includes('favicon') && !m.includes('logo') && !m.includes('avatar') && m.length < 500) {
      imgs.push(m);
    }
  }

  // Dedupe by base URL
  const seen = new Set();
  return imgs.filter(url => {
    const base = url.split('?')[0].split('#')[0];
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function extractFloorPlans(markdown) {
  const plans = [];
  const urlRegex = /(https?:\/\/[^\s\)\"\>\]\,]+\.(?:jpg|jpeg|png|webp|pdf)(?:[^\s\)\"\>\]]*)?)/gi;
  const matches = markdown.match(urlRegex) || [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (lower.includes('floor') || lower.includes('plan') || lower.includes('layout') || lower.includes('unit') || lower.includes('floorplan')) {
      plans.push(m);
    }
  }
  const seen = new Set();
  return plans.filter(url => {
    const base = url.split('?')[0];
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function extractLogos(markdown, metadata) {
  const logos = [];
  const ogImg = metadata?.ogImage || metadata?.['og:image'] || '';
  if (ogImg && ogImg.startsWith('http')) logos.push(ogImg);

  const urlRegex = /(https?:\/\/[^\s\)\"\>\]\,]+\.(?:jpg|jpeg|png|webp|svg)(?:[^\s\)\"\>\]]*)?)/gi;
  const matches = markdown.match(urlRegex) || [];
  for (const m of matches) {
    const lower = m.toLowerCase();
    if (lower.includes('logo') || lower.includes('brand')) {
      logos.push(m);
    }
  }
  // First image on the page is often the logo
  if (matches.length > 0 && logos.length === 0) {
    logos.push(matches[0]);
  }
  const seen = new Set();
  return logos.filter(url => {
    const base = url.split('?')[0];
    if (seen.has(base)) return false;
    seen.add(base);
    return true;
  });
}

function firecrawlSearch(query, limit = 3) {
  const cacheFile = path.join(CACHE_DIR, `search-${slugify(query)}.json`);
  if (existsSync(cacheFile)) {
    try {
      return JSON.parse(readFileSync(cacheFile, 'utf-8'));
    } catch { /* re-fetch */ }
  }

  try {
    execSync(`firecrawl search "${query.replace(/"/g, '\\"')}" --scrape --limit ${limit} -o "${cacheFile}" --json`, {
      timeout: 45000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return JSON.parse(readFileSync(cacheFile, 'utf-8'));
  } catch (e) {
    console.error(`  Search failed: ${e.message?.slice(0, 80)}`);
    return null;
  }
}

function pickBestImage(images) {
  // Prefer images from developer websites over blogs
  const devSite = images.find(u =>
    !u.includes('unsplash') && !u.includes('yimby') && !u.includes('wikipedia') &&
    !u.includes('facebook') && !u.includes('twitter') && !u.includes('instagram') &&
    (u.includes('render') || u.includes('hero') || u.includes('exterior') || u.includes('building') || u.includes('aerial'))
  );
  if (devSite) return devSite;

  // Prefer first non-social-media image
  const real = images.find(u =>
    !u.includes('unsplash') && !u.includes('facebook') && !u.includes('twitter') &&
    !u.includes('icon') && !u.includes('avatar') && u.length > 30
  );
  if (real) return real;

  return images[0] || null;
}

async function scrapeProjects() {
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug, address, neighborhood:neighborhoods(name)')
    .order('name');

  console.log(`\n=== Scraping images for ${projects.length} projects ===\n`);

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    const hood = p.neighborhood?.name || 'Miami';
    const query = `${p.name} Miami pre-construction condo`;

    console.log(`[${i + 1}/${projects.length}] ${p.name}`);

    const result = firecrawlSearch(query, 3);
    if (!result) {
      console.log('  SKIP: no results');
      skipped++;
      continue;
    }

    const items = result?.data?.web || [];
    let allImages = [];
    let allFloorPlans = [];

    for (const item of items) {
      const md = item.markdown || '';
      const meta = item.metadata || {};
      allImages.push(...extractImages(md, meta));
      allFloorPlans.push(...extractFloorPlans(md));
    }

    const mainImage = pickBestImage(allImages);
    const gallery = allImages.slice(0, 8);
    const floorPlans = [...new Set(allFloorPlans.map(u => u.split('?')[0]))].slice(0, 5);

    if (!mainImage && gallery.length === 0) {
      console.log('  SKIP: no images found');
      skipped++;
      continue;
    }

    const updates = {};
    if (mainImage) updates.mainImageUrl = mainImage;
    if (gallery.length > 0 || floorPlans.length > 0) {
      updates.images = {
        gallery: gallery.map((url, i) => ({ url, alt: `${p.name} - Image ${i + 1}`, type: 'rendering' })),
        ...(floorPlans.length > 0 ? { floorPlans: floorPlans.map((url, i) => ({ url, label: `Floor Plan ${i + 1}` })) } : {}),
      };
    }

    const { error } = await supabase.from('projects').update(updates).eq('id', p.id);
    if (error) {
      console.log(`  ERROR: ${error.message}`);
    } else {
      console.log(`  OK: ${mainImage ? '1 main' : '0 main'} + ${gallery.length} gallery + ${floorPlans.length} floor plans`);
      updated++;
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Projects: ${updated} updated, ${skipped} skipped ===\n`);
}

async function scrapeDeveloperLogos() {
  const { data: developers } = await supabase
    .from('developers')
    .select('id, name, slug, logoUrl')
    .order('name');

  // Only scrape developers without logos
  const needLogos = developers.filter(d => !d.logoUrl);
  console.log(`\n=== Scraping logos for ${needLogos.length} developers (${developers.length - needLogos.length} already have logos) ===\n`);

  let updated = 0;

  for (let i = 0; i < needLogos.length; i++) {
    const dev = needLogos[i];
    console.log(`[${i + 1}/${needLogos.length}] ${dev.name}`);

    const result = firecrawlSearch(`${dev.name} real estate developer Miami official site`, 2);
    if (!result) {
      console.log('  SKIP: no results');
      continue;
    }

    const items = result?.data?.web || [];
    let logos = [];

    for (const item of items) {
      const md = item.markdown || '';
      const meta = item.metadata || {};
      logos.push(...extractLogos(md, meta));
    }

    if (logos.length === 0) {
      console.log('  SKIP: no logo found');
      continue;
    }

    const logoUrl = logos[0];
    const { error } = await supabase.from('developers').update({ logoUrl }).eq('id', dev.id);
    if (error) {
      console.log(`  ERROR: ${error.message}`);
    } else {
      console.log(`  OK: ${logoUrl.slice(0, 80)}`);
      updated++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n=== Developers: ${updated} logos updated ===\n`);
}

async function main() {
  console.log('Starting Firecrawl image scraping pipeline...\n');
  await scrapeProjects();
  await scrapeDeveloperLogos();
  console.log('Done!');
}

main().catch(console.error);
