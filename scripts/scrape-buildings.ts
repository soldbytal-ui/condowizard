/**
 * scrape-buildings.ts
 *
 * Scrapes Miami pre-construction aggregator sites and extracts building data
 * using Claude API for structured extraction.
 *
 * Usage: npx tsx scripts/scrape-buildings.ts
 *
 * Requires:
 * - ANTHROPIC_API_KEY env var (for Claude extraction)
 * - NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY env vars
 * - Optional: FIRECRAWL_API_KEY for better scraping
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fnyrtptmcazhmoztmuay.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const TARGET_URLS = [
  'https://www.miamiresidential.com/new-developments/',
  'https://www.condoblackbook.com/pre-construction/miami-fl/',
  'https://www.miamiresidence.com/preconstruction.htm',
  'https://www.miamicondoinvestments.com/preconstruction-condos',
  'https://www.miami-luxury.com/miami-pre-construction-condos',
];

async function fetchPage(url: string): Promise<string> {
  // Try Firecrawl first
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FIRECRAWL_API_KEY}`,
        },
        body: JSON.stringify({ url, formats: ['markdown'] }),
      });
      const data = await res.json();
      if (data.success && data.data?.markdown) {
        return data.data.markdown;
      }
    } catch (e) {
      console.log(`Firecrawl failed for ${url}, falling back to fetch`);
    }
  }

  // Fallback: basic fetch
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' },
    });
    const html = await res.text();
    // Strip HTML tags for a rough text extraction
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 50000); // Limit to ~50K chars
  } catch (e: any) {
    console.log(`Failed to fetch ${url}: ${e.message}`);
    return '';
  }
}

async function extractBuildings(content: string, sourceUrl: string): Promise<any[]> {
  if (!ANTHROPIC_API_KEY) {
    console.log('No ANTHROPIC_API_KEY set. Skipping Claude extraction.');
    return [];
  }

  const prompt = `Extract all pre-construction condo/building projects from this content. For each project, return a JSON object with these fields:

- name: string (building name)
- address: string (full address with city/state)
- floors: number or null
- totalUnits: number or null
- priceMin: number or null (minimum price in USD, no formatting)
- priceMax: number or null
- status: one of "PRE_LAUNCH", "PRE_CONSTRUCTION", "UNDER_CONSTRUCTION", "NEAR_COMPLETION", "COMPLETED"
- category: one of "ULTRA_LUXURY" (>$3M), "LUXURY_BRANDED" (branded hotel), "LUXURY" ($1.5M+), "PREMIUM" ($500K-$1.5M), "AFFORDABLE_LUXURY" (<$500K)
- estCompletion: string (year, e.g. "2028")
- architect: string or null
- developer: string or null
- neighborhood: string or null (e.g. "Brickell", "Downtown Miami", "Edgewater", "Miami Beach")
- description: string (2-3 sentences about the project)
- amenities: string[] (list of amenities)

Return ONLY a JSON array. No other text. If you can't find any projects, return [].

Source URL: ${sourceUrl}

Content:
${content.slice(0, 30000)}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await res.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e: any) {
    console.log(`Claude extraction failed: ${e.message}`);
  }

  return [];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeForComparison(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function upsertBuildings(buildings: any[]) {
  // Get existing projects for deduplication
  const { data: existing } = await supabase
    .from('projects')
    .select('id, name, slug');

  const existingNames = new Set(
    (existing || []).map(p => normalizeForComparison(p.name))
  );

  // Get neighborhoods and developers for linking
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, name, slug');

  const { data: developers } = await supabase
    .from('developers')
    .select('id, name, slug');

  let inserted = 0, skipped = 0, errors = 0;

  for (const building of buildings) {
    if (!building.name) continue;

    const normalized = normalizeForComparison(building.name);
    if (existingNames.has(normalized)) {
      skipped++;
      continue;
    }

    // Find or create developer
    let developerId = null;
    if (building.developer) {
      const devSlug = slugify(building.developer);
      let dev = developers?.find(d => d.slug === devSlug);
      if (!dev) {
        const { data } = await supabase
          .from('developers')
          .upsert({ name: building.developer, slug: devSlug }, { onConflict: 'slug' })
          .select('id')
          .single();
        developerId = data?.id;
      } else {
        developerId = dev.id;
      }
    }

    // Find neighborhood
    let neighborhoodId = null;
    if (building.neighborhood) {
      const hood = neighborhoods?.find(
        n => n.name.toLowerCase().includes(building.neighborhood.toLowerCase()) ||
             building.neighborhood.toLowerCase().includes(n.name.toLowerCase())
      );
      neighborhoodId = hood?.id || null;
    }

    const row = {
      name: building.name,
      slug: slugify(building.name),
      address: building.address || null,
      floors: building.floors || null,
      totalUnits: building.totalUnits || null,
      priceMin: building.priceMin || null,
      priceMax: building.priceMax || null,
      status: building.status || 'PRE_CONSTRUCTION',
      category: building.category || 'PREMIUM',
      estCompletion: building.estCompletion || null,
      architect: building.architect || null,
      description: building.description || null,
      amenities: building.amenities ? JSON.stringify(building.amenities) : null,
      neighborhoodId,
      developerId,
      featured: false,
    };

    const { error } = await supabase.from('projects').insert(row);
    if (error) {
      if (error.message.includes('duplicate')) {
        skipped++;
      } else {
        console.log(`Error inserting ${building.name}: ${error.message}`);
        errors++;
      }
    } else {
      inserted++;
      existingNames.add(normalized);
      console.log(`  + ${building.name}`);
    }
  }

  return { inserted, skipped, errors };
}

async function main() {
  console.log('=== PreConstructionMiami Building Scraper ===\n');

  if (!ANTHROPIC_API_KEY) {
    console.log('WARNING: ANTHROPIC_API_KEY not set. Claude extraction will be skipped.');
    console.log('Set it to enable AI-powered data extraction.\n');
  }

  let totalInserted = 0, totalSkipped = 0;

  for (const url of TARGET_URLS) {
    console.log(`\nScraping: ${url}`);

    const content = await fetchPage(url);
    if (!content) {
      console.log('  No content retrieved, skipping.');
      continue;
    }
    console.log(`  Content length: ${content.length} chars`);

    const buildings = await extractBuildings(content, url);
    console.log(`  Extracted: ${buildings.length} buildings`);

    if (buildings.length > 0) {
      const { inserted, skipped } = await upsertBuildings(buildings);
      totalInserted += inserted;
      totalSkipped += skipped;
      console.log(`  Inserted: ${inserted}, Skipped (duplicates): ${skipped}`);
    }

    // Rate limit between sources
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`\n=== Done ===`);
  console.log(`Total inserted: ${totalInserted}`);
  console.log(`Total skipped: ${totalSkipped}`);

  // Final count
  const { count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true });
  console.log(`Total projects in database: ${count}`);
}

main().catch(console.error);
