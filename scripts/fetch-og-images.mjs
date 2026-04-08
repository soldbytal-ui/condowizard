/**
 * Fetch real project images by scraping OG images from listing sites.
 * No Firecrawl credits needed — uses direct HTTP requests.
 *
 * Strategy:
 * 1. Search Google for "{project name} Miami condo"
 * 2. Check known listing sites: preconstruction.buzz, condoblackbook.com,
 *    miamicondoinvestments.com, newconstructioncondomiami.com
 * 3. Fetch the page HTML and extract og:image meta tag
 * 4. Also extract any gallery images from the page
 *
 * Usage: node scripts/fetch-og-images.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Known listing sites that always have good project images
const LISTING_SITES = [
  { base: 'https://preconstruction.buzz/miami', pathFn: (slug) => `/${slug}` },
  { base: 'https://www.condoblackbook.com/new-preconstruction', pathFn: (slug) => `/${slug}` },
  { base: 'https://miamicondoinvestments.com', pathFn: (slug) => `/${slug}` },
  { base: 'https://www.newconstructioncondomiami.com', pathFn: (slug) => `/${slug}` },
  { base: 'https://www.manhattanmiami.com/new-pre-construction', pathFn: (slug) => `/${slug}` },
];

async function fetchWithTimeout(url, timeout = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      redirect: 'follow',
    });
    clearTimeout(id);
    return res;
  } catch {
    clearTimeout(id);
    return null;
  }
}

function extractOgImage(html) {
  // og:image
  const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
  if (ogMatch) return ogMatch[1];

  // twitter:image
  const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i)
    || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
  if (twMatch) return twMatch[1];

  return null;
}

function extractGalleryImages(html, baseUrl) {
  const images = [];
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    let src = match[1];
    // Skip tiny icons, tracking pixels, avatars
    if (src.includes('icon') || src.includes('favicon') || src.includes('avatar') ||
        src.includes('logo') || src.includes('1x1') || src.includes('pixel') ||
        src.includes('tracking') || src.length < 20 || src.startsWith('data:')) continue;
    // Make absolute
    if (src.startsWith('//')) src = 'https:' + src;
    else if (src.startsWith('/')) {
      try { src = new URL(src, baseUrl).href; } catch { continue; }
    }
    if (src.startsWith('http')) images.push(src);
  }
  // Dedupe
  return [...new Set(images)];
}

async function findProjectImage(name, slug) {
  // Strategy 1: Try known listing sites with project slug
  for (const site of LISTING_SITES) {
    const url = site.base + site.pathFn(slug);
    const res = await fetchWithTimeout(url);
    if (res && res.ok) {
      const html = await res.text();
      const ogImg = extractOgImage(html);
      if (ogImg && ogImg.startsWith('http') && !ogImg.includes('default') && !ogImg.includes('placeholder')) {
        const gallery = extractGalleryImages(html, url)
          .filter(u => !u.includes('logo') && !u.includes('icon'))
          .slice(0, 8);
        return { mainImage: ogImg, gallery, source: url };
      }
    }
  }

  // Strategy 2: Try Google-friendly URL patterns
  const altSlugs = [
    slug,
    slug.replace(/-miami$/, ''),
    slug.replace(/-residences$/, ''),
    slugify(name),
  ];

  for (const s of altSlugs) {
    for (const site of LISTING_SITES) {
      const url = site.base + site.pathFn(s);
      const res = await fetchWithTimeout(url);
      if (res && res.ok) {
        const html = await res.text();
        const ogImg = extractOgImage(html);
        if (ogImg && ogImg.startsWith('http') && !ogImg.includes('default') && !ogImg.includes('placeholder')) {
          const gallery = extractGalleryImages(html, url).filter(u => !u.includes('logo')).slice(0, 8);
          return { mainImage: ogImg, gallery, source: url };
        }
      }
    }
  }

  return null;
}

async function findDeveloperLogo(name) {
  // Try to find developer's website and extract logo
  const slug = slugify(name);
  const searchUrls = [
    `https://www.${slug}.com`,
    `https://${slug}.com`,
    `https://www.${slug.replace(/-/g, '')}.com`,
  ];

  for (const url of searchUrls) {
    const res = await fetchWithTimeout(url, 5000);
    if (res && res.ok) {
      const html = await res.text();
      // Look for logo in img tags
      const logoMatch = html.match(/<img[^>]*(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]*src=["']([^"']+)["']/i)
        || html.match(/<img[^>]*src=["']([^"']+logo[^"']+)["']/i);
      if (logoMatch) {
        let src = logoMatch[1];
        if (src.startsWith('/')) src = new URL(src, url).href;
        if (src.startsWith('http')) return src;
      }
      // Fallback: og:image as logo
      const ogImg = extractOgImage(html);
      if (ogImg) return ogImg;
    }
  }
  return null;
}

async function main() {
  // Get projects still using Unsplash placeholders
  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, slug')
    .like('mainImageUrl', '%unsplash%')
    .order('name');

  console.log(`\n=== Fetching real images for ${projects.length} projects with placeholders ===\n`);

  let updated = 0;
  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    process.stdout.write(`[${i + 1}/${projects.length}] ${p.name} ... `);

    const result = await findProjectImage(p.name, p.slug);
    if (result) {
      const updates = { mainImageUrl: result.mainImage };
      if (result.gallery.length > 0) {
        updates.images = {
          gallery: result.gallery.map((url, j) => ({ url, alt: `${p.name} - Image ${j + 1}`, type: 'rendering' })),
        };
      }
      const { error } = await supabase.from('projects').update(updates).eq('id', p.id);
      if (error) {
        console.log(`ERROR: ${error.message}`);
      } else {
        console.log(`OK (${result.gallery.length} images from ${new URL(result.source).hostname})`);
        updated++;
      }
    } else {
      console.log('SKIP');
    }

    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n=== Projects: ${updated}/${projects.length} updated with real images ===\n`);

  // Developer logos
  const { data: developers } = await supabase
    .from('developers')
    .select('id, name, slug, logoUrl')
    .is('logoUrl', null)
    .order('name');

  console.log(`=== Fetching logos for ${developers.length} developers ===\n`);

  let logoCount = 0;
  for (let i = 0; i < developers.length; i++) {
    const dev = developers[i];
    process.stdout.write(`[${i + 1}/${developers.length}] ${dev.name} ... `);

    const logo = await findDeveloperLogo(dev.name);
    if (logo) {
      const { error } = await supabase.from('developers').update({ logoUrl: logo }).eq('id', dev.id);
      if (!error) {
        console.log(`OK: ${logo.slice(0, 60)}`);
        logoCount++;
      } else {
        console.log(`ERROR: ${error.message}`);
      }
    } else {
      console.log('SKIP');
    }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n=== Developers: ${logoCount}/${developers.length} logos found ===`);
  console.log('\nDone!');
}

main().catch(console.error);
