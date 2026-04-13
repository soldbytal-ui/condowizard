// Scrape complete pre-construction project list from livabl.com
import * as cheerio from 'cheerio';
import fs from 'fs';

const STATUSES = ['pending', 'pre-construction', 'under-construction'];
const BASE = 'https://livabl.com/new-condos/toronto';

async function scrapePage(url) {
  console.log(`  Fetching: ${url}`);
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) { console.log(`    HTTP ${res.status}`); return { projects: [], hasNext: false }; }
  const html = await res.text();
  const $ = cheerio.load(html);

  const projects = [];

  // Extract project cards
  $('a[href*="/project/"]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const name = $(el).find('h2, h3, .project-name, [class*="title"]').first().text().trim() ||
                 $(el).find('img').attr('alt')?.trim() || '';
    const address = $(el).find('[class*="address"], [class*="location"]').text().trim();
    const developer = $(el).find('[class*="developer"], [class*="builder"]').text().trim();

    if (name && href.includes('/project/')) {
      projects.push({
        name: name.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        address: address.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        developer: developer.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim(),
        url: href.startsWith('http') ? href : `https://livabl.com${href}`,
        slug: href.split('/project/')[1]?.split(/[?#]/)[0] || '',
      });
    }
  });

  // Check for next page
  const hasNext = $('a[rel="next"], [class*="next"], a:contains("Next")').length > 0;

  return { projects, hasNext };
}

async function scrapeStatus(status) {
  const allProjects = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 50) {
    const url = page === 1
      ? `${BASE}?status[]=${status}`
      : `${BASE}?status[]=${status}&page=${page}`;

    const result = await scrapePage(url);
    allProjects.push(...result.projects);
    hasNext = result.hasNext && result.projects.length > 0;
    page++;

    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  return allProjects;
}

async function main() {
  console.log('=== Scraping livabl.com pre-construction listings ===\n');

  const allProjects = [];

  for (const status of STATUSES) {
    console.log(`\nStatus: ${status}`);
    const projects = await scrapeStatus(status);
    console.log(`  Found: ${projects.length} projects`);

    for (const p of projects) {
      allProjects.push({ ...p, status });
    }
  }

  // Deduplicate by slug
  const seen = new Set();
  const unique = allProjects.filter(p => {
    if (!p.slug || seen.has(p.slug)) return false;
    seen.add(p.slug);
    return true;
  });

  console.log(`\n=== RESULTS ===`);
  console.log(`Total scraped: ${allProjects.length}`);
  console.log(`Unique projects: ${unique.length}`);

  // Save
  fs.writeFileSync('scripts/livabl-verified.json', JSON.stringify(unique, null, 2));
  console.log(`Saved to scripts/livabl-verified.json`);

  // Show sample
  console.log(`\nSample (first 10):`);
  unique.slice(0, 10).forEach(p => console.log(`  ${p.name} | ${p.address} | ${p.developer} | ${p.status}`));
}

main().catch(console.error);
