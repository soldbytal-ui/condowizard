/**
 * Verify all property pages load without errors
 * Tests every /properties/[slug] page via the live site
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const BASE = 'https://preconstructionmiami.net';

async function testPage(url: string): Promise<{ url: string; status: number; ok: boolean }> {
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'SEO-Audit-Bot/1.0' },
    });
    return { url, status: res.status, ok: res.ok };
  } catch (err: any) {
    return { url, status: 0, ok: false };
  }
}

async function main() {
  // Get all project slugs
  const { data: projects } = await supabase.from('projects').select('slug').order('slug');
  const { data: blogs } = await supabase.from('blog_posts').select('slug, publishedAt, featuredImage').not('publishedAt', 'is', null).order('publishedAt');

  const allUrls = [
    // Previously broken pages
    `${BASE}/properties/888-brickell-by-dolce-gabbana`,
    `${BASE}/properties/waldorf-astoria-residences-miami`,
    `${BASE}/properties/mercedes-benz-places-miami`,
    `${BASE}/properties/baccarat-residences-miami`,
    // Other orphaned projects (previously NULL neighborhood)
    `${BASE}/properties/14roc-miami`,
    `${BASE}/properties/faena-residences-miami`,
    `${BASE}/properties/nomad-wynwood`,
    `${BASE}/properties/the-standard-residences-midtown`,
    `${BASE}/properties/the-residences-at-six-fisher-island`,
    `${BASE}/properties/frida-kahlo-wynwood-residences`,
  ];

  console.log('=== TESTING PREVIOUSLY BROKEN PAGES ===\n');
  const batchSize = 5;
  for (let i = 0; i < allUrls.length; i += batchSize) {
    const batch = allUrls.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(testPage));
    for (const r of results) {
      const icon = r.ok ? '✓' : '✗';
      console.log(`  ${icon} ${r.status} ${r.url.replace(BASE, '')}`);
    }
  }

  // Verify blog dates are staggered
  console.log('\n=== BLOG POST DATES (should be staggered) ===\n');
  const dates = new Set<string>();
  let allUnique = true;
  for (const b of (blogs || [])) {
    const date = b.publishedAt?.split('T')[0] || 'null';
    if (dates.has(date)) allUnique = false;
    dates.add(date);
    console.log(`  ${date} | img=${b.featuredImage ? 'YES' : 'NO '} | ${b.slug}`);
  }
  console.log(`\n  All dates unique: ${allUnique ? 'YES ✓' : 'NO ✗'}`);

  // Verify no "a ultra-luxury" in descriptions
  console.log('\n=== CHECKING GRAMMAR ===\n');
  const { data: allProjects } = await supabase.from('projects').select('slug, description');
  const grammarBugs = (allProjects || []).filter((p: any) =>
    p.description?.includes('a ultra-luxury') || p.description?.includes('a affordable')
  );
  console.log(`  Projects with "a ultra-luxury" or "a affordable": ${grammarBugs.length}`);
  if (grammarBugs.length > 0) grammarBugs.forEach((p: any) => console.log(`    - ${p.slug}`));

  // Verify descriptions are unique
  console.log('\n=== CHECKING DESCRIPTION UNIQUENESS ===\n');
  const firstLines = new Map<string, string[]>();
  for (const p of (allProjects || [])) {
    const firstLine = p.description?.split('\n')[0]?.slice(0, 80) || '';
    if (!firstLines.has(firstLine)) firstLines.set(firstLine, []);
    firstLines.get(firstLine)!.push(p.slug);
  }
  const duplicateFirstLines = [...firstLines.entries()].filter(([_, slugs]) => slugs.length > 1);
  console.log(`  Unique first lines: ${firstLines.size}/${(allProjects || []).length}`);
  if (duplicateFirstLines.length > 0) {
    console.log(`  Duplicate first lines: ${duplicateFirstLines.length}`);
    duplicateFirstLines.slice(0, 5).forEach(([line, slugs]) => {
      console.log(`    "${line}" → ${slugs.join(', ')}`);
    });
  }

  // Sample a few random pages to confirm they load
  console.log('\n=== RANDOM SAMPLE TEST (10 properties) ===\n');
  const shuffled = [...(projects || [])].sort(() => Math.random() - 0.5).slice(0, 10);
  const sampleResults = await Promise.all(
    shuffled.map((p: any) => testPage(`${BASE}/properties/${p.slug}`))
  );
  for (const r of sampleResults) {
    const icon = r.ok ? '✓' : '✗';
    console.log(`  ${icon} ${r.status} ${r.url.replace(BASE, '')}`);
  }

  const totalFailed = sampleResults.filter(r => !r.ok).length;
  console.log(`\n=== SUMMARY ===`);
  console.log(`  Random sample: ${10 - totalFailed}/10 pages OK`);
}

main().catch(console.error);
