// Step 1: Free image scraping from gta-homes.com and urbantoronto.ca
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import * as cheerio from 'cheerio';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Convert project slug/name to search terms
function makeSearchSlugs(name, address) {
  const slugs = [];
  // Try the project name as-is (slugified)
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  slugs.push(nameSlug);

  // Try address-based slug
  if (address) {
    const addr = address.split(',')[0].trim();
    const addrSlug = addr.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    slugs.push(addrSlug);
    // Also try just the street number + name
    const parts = addr.match(/^(\d+)\s+(.+)/);
    if (parts) {
      slugs.push(parts[1] + '-' + parts[2].toLowerCase().replace(/[^a-z0-9]+/g, '-'));
    }
  }
  return [...new Set(slugs)];
}

async function tryGtaHomes(slug) {
  try {
    const url = `https://www.gta-homes.com/${slug}/`;
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Find og:image or main project image
    let img = $('meta[property="og:image"]').attr('content');
    if (img && !img.includes('logo') && !img.includes('favicon')) return img;

    // Find first large image in content
    const imgs = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || '';
      if (src.includes('/uploads/') && !src.includes('logo') && !src.includes('icon') && src.includes('.jpg')) {
        imgs.push(src);
      }
    });
    return imgs[0] || null;
  } catch { return null; }
}

async function tryUrbanToronto(slug) {
  try {
    const url = `https://urbantoronto.ca/database/projects/${slug}`;
    const res = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Find project rendering image
    let img = $('meta[property="og:image"]').attr('content');
    if (img && img.includes('skyrisecities.com') && img.includes('/images/projects/')) return img;

    // Search for project images in content
    const imgs = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src') || '';
      if (src.includes('/images/projects/') && !src.includes('release/img/')) {
        imgs.push(src);
      }
    });
    return imgs[0] || null;
  } catch { return null; }
}

async function main() {
  console.log('=== Step 1: Free Image Scraping ===\n');

  const { data: projects } = await supabase.from('projects')
    .select('id, name, slug, address, mainImageUrl')
    .neq('status', 'COMPLETED');

  // Only process projects with Unsplash or no images
  const toProcess = (projects || []).filter(p => {
    const img = p.mainImageUrl || '';
    return !img || img.includes('unsplash');
  });

  console.log(`Processing ${toProcess.length} projects (Unsplash or no image)\n`);

  let upgraded = 0;
  let failed = 0;
  let processed = 0;

  // Process in batches of 5
  for (let i = 0; i < toProcess.length; i += 5) {
    const batch = toProcess.slice(i, i + 5);

    await Promise.all(batch.map(async (p) => {
      const slugs = makeSearchSlugs(p.name, p.address);
      let newImg = null;

      for (const slug of slugs) {
        if (newImg) break;
        // Try gta-homes
        newImg = await tryGtaHomes(slug);
        if (newImg) break;
        // Try urbantoronto
        newImg = await tryUrbanToronto(slug);
      }

      if (newImg) {
        const { error } = await supabase.from('projects').update({ mainImageUrl: newImg }).eq('id', p.id);
        if (!error) {
          upgraded++;
          if (upgraded <= 20) console.log(`  ✓ ${p.name} → ${newImg.slice(0, 70)}`);
        }
      } else {
        failed++;
      }
      processed++;
    }));

    // Rate limit: 2 second pause between batches
    if (i + 5 < toProcess.length) {
      await new Promise(r => setTimeout(r, 2000));
    }

    // Progress every 50
    if (processed % 50 === 0) {
      console.log(`  Progress: ${processed}/${toProcess.length} (${upgraded} upgraded, ${failed} no image found)`);
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Upgraded: ${upgraded}`);
  console.log(`No image found: ${failed}`);

  // Final image count
  const { data: final } = await supabase.from('projects').select('mainImageUrl').neq('status', 'COMPLETED');
  const realNow = (final || []).filter(p => p.mainImageUrl && !p.mainImageUrl.includes('unsplash')).length;
  const unsplashNow = (final || []).filter(p => p.mainImageUrl?.includes('unsplash')).length;
  const noImgNow = (final || []).filter(p => !p.mainImageUrl).length;
  console.log(`\nFinal image status: ${realNow} real, ${unsplashNow} Unsplash, ${noImgNow} none`);
}

main().catch(console.error);
