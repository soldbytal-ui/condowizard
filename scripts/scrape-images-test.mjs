// Phase 2 TEST: Scrape images for 5 test projects using Firecrawl + urbantoronto.ca
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY;

// Test batch: 5 known real projects that need images
const TEST_PROJECTS = [
  { name: 'Block 22 at Regent Park', slug: 'block-22-at-regent-park', searchTerm: 'block-22-regent-park' },
  { name: '441 Spring', slug: '441-spring', searchTerm: '441-spring-garden' },
  { name: '906 Keele', slug: '906-keele', searchTerm: '906-keele-street' },
  { name: '19 Queens', slug: '19-queens', searchTerm: '19-queens-quay-east' },
  { name: 'Framework Condos', slug: 'framework-condos', searchTerm: 'framework-condos' },
];

async function scrapeProject(project) {
  const urls = [
    `https://urbantoronto.ca/database/projects/${project.searchTerm}`,
    `https://www.livabl.com/project/${project.searchTerm}`,
  ];

  const allImages = [];
  let creditsUsed = 0;

  for (const url of urls) {
    try {
      console.log(`  Scraping: ${url}`);
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${FIRECRAWL_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, formats: ['markdown'], onlyMainContent: true }),
      });

      creditsUsed++;
      const data = await res.json();

      if (data.success) {
        const md = data.data?.markdown || '';
        // Extract image URLs
        const imgRegex = /https?:\/\/[^\s"'\)]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'\)]*)?/gi;
        const imgs = [...new Set(md.match(imgRegex) || [])];

        // Filter: keep project rendering images, exclude UI/nav/icons
        const filtered = imgs.filter(img => {
          const lower = img.toLowerCase();
          // Reject known UI/nav images
          if (lower.includes('release/img/') || // urbantoronto UI sprites
              lower.includes('logo') || lower.includes('icon') || lower.includes('avatar') ||
              lower.includes('sprite') || lower.includes('emoji') ||
              lower.includes('placeholder') || lower.includes('loading') ||
              img.length < 40) return false;

          // Accept known project image CDN paths
          if (lower.includes('/sites/default/files/images/projects/') ||
              lower.includes('/sites/default/files/styles/') ||
              lower.includes('gta-homes.com/wp-content/uploads/') ||
              lower.includes('precondo.ca/wp-content/') ||
              lower.includes('condosdeal.com') ||
              lower.includes('buzzbuzzhome.com')) return true;

          // Accept any .jpg/.jpeg/.png that isn't from a known UI path
          if ((lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png') || lower.endsWith('.webp')) &&
              !lower.includes('/img/') && !lower.includes('footer') && !lower.includes('header') &&
              !lower.includes('menu') && !lower.includes('social') && !lower.includes('trending')) return true;

          return false;
        });

        console.log(`    Found ${imgs.length} images, ${filtered.length} after filter`);
        allImages.push(...filtered);
      } else {
        console.log(`    Error: ${data.error || 'unknown'}`);
      }
    } catch (err) {
      console.log(`    Failed: ${err.message}`);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  return { images: [...new Set(allImages)].slice(0, 5), creditsUsed };
}

async function main() {
  console.log('=== Phase 2 TEST: Scraping images for 5 projects ===\n');
  let totalCredits = 0;
  const results = [];

  for (const project of TEST_PROJECTS) {
    console.log(`\n--- ${project.name} ---`);
    const result = await scrapeProject(project);
    totalCredits += result.creditsUsed;
    results.push({ name: project.name, ...result });

    if (result.images.length > 0) {
      console.log(`  Best image: ${result.images[0].slice(0, 80)}`);

      // Update database with the best image
      const { error } = await supabase
        .from('projects')
        .update({ mainImageUrl: result.images[0] })
        .eq('slug', project.slug);

      console.log(`  DB update: ${error ? error.message : 'success'}`);
    } else {
      console.log('  No usable images found');
    }
  }

  console.log('\n=== RESULTS ===');
  console.log(`Firecrawl credits used: ${totalCredits}`);
  for (const r of results) {
    console.log(`  ${r.name}: ${r.images.length} images found`);
  }

  console.log('\n=== SAMPLE IMAGES ===');
  for (const r of results) {
    if (r.images.length > 0) {
      console.log(`${r.name}:`);
      r.images.slice(0, 3).forEach(img => console.log(`  ${img.slice(0, 100)}`));
    }
  }
}

main().catch(console.error);
