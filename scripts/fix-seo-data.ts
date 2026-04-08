/**
 * SEO Data Fix Script
 * 1. Fix 16 projects with NULL neighborhoodId (causes 500 errors)
 * 2. Fix grammar: "a ultra-luxury" → "an ultra-luxury", "a affordable" → "an affordable"
 * 3. Stagger blog post dates across 3 months
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

// ─── 1. FIX NULL NEIGHBORHOODS ───
// Map each orphaned project to its correct neighborhood based on project name/location
const NEIGHBORHOOD_MAP: Record<string, string> = {
  'baccarat-residences-miami': 'brickell',
  'mercedes-benz-places-miami': 'downtown-miami',
  '14roc-miami': 'downtown-miami',
  'casa-bella': 'downtown-miami',
  'faena-residences-miami': 'miami-beach',
  'frida-kahlo-wynwood-residences': 'midtown-wynwood',
  'jean-georges-miami-tropic-residences': 'downtown-miami',
  'midtown-park-residences-by-proper': 'midtown-wynwood',
  'nomad-wynwood': 'midtown-wynwood',
  'the-cloud-one-hotel-and-residences': 'downtown-miami',
  'the-links-estates': 'key-biscayne',
  'the-residences-at-six-fisher-island': 'key-biscayne',
  'the-rider-residences': 'midtown-wynwood',
  'the-standard-residences-midtown': 'midtown-wynwood',
  'twenty-sixth-and-2nd-wynwood': 'midtown-wynwood',
  'vista-harbor-residences-and-yacht-club': 'north-bay-village',
};

async function fixNeighborhoods() {
  console.log('\n=== FIXING NULL NEIGHBORHOODS ===');

  // Get all neighborhoods to map slug -> id
  const { data: neighborhoods } = await supabase
    .from('neighborhoods')
    .select('id, slug, name');

  const nhMap = new Map<string, string>();
  neighborhoods?.forEach((n: any) => nhMap.set(n.slug, n.id));

  let fixed = 0;
  for (const [projectSlug, nhSlug] of Object.entries(NEIGHBORHOOD_MAP)) {
    const nhId = nhMap.get(nhSlug);
    if (!nhId) {
      console.log(`  SKIP ${projectSlug}: neighborhood "${nhSlug}" not found`);
      continue;
    }

    const { error } = await supabase
      .from('projects')
      .update({ neighborhoodId: nhId })
      .eq('slug', projectSlug);

    if (error) {
      console.log(`  ERROR ${projectSlug}: ${error.message}`);
    } else {
      console.log(`  FIXED ${projectSlug} → ${nhSlug} (${nhId})`);
      fixed++;
    }
  }
  console.log(`Fixed ${fixed}/${Object.keys(NEIGHBORHOOD_MAP).length} neighborhoods`);
}

// ─── 2. FIX GRAMMAR ───
async function fixGrammar() {
  console.log('\n=== FIXING GRAMMAR ===');

  // Get all projects with descriptions
  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, description, longDescription, metaDescription');

  let fixed = 0;
  for (const p of (projects || [])) {
    const updates: any = {};
    let changed = false;

    if (p.description) {
      let d = p.description;
      if (d.includes('a ultra-luxury') || d.includes('a Ultra-Luxury')) {
        d = d.replace(/\ba ultra-luxury\b/gi, 'an ultra-luxury');
        d = d.replace(/\ba Ultra-Luxury\b/g, 'an Ultra-Luxury');
        updates.description = d;
        changed = true;
      }
      if (d.includes('a affordable')) {
        d = d.replace(/\ba affordable\b/gi, 'an affordable');
        updates.description = d;
        changed = true;
      }
    }

    if (p.longDescription) {
      let ld = p.longDescription;
      if (ld.includes('a ultra-luxury') || ld.includes('a affordable')) {
        ld = ld.replace(/\ba ultra-luxury\b/gi, 'an ultra-luxury');
        ld = ld.replace(/\ba affordable\b/gi, 'an affordable');
        updates.longDescription = ld;
        changed = true;
      }
    }

    if (p.metaDescription) {
      let md = p.metaDescription;
      if (md.includes('a ultra-luxury') || md.includes('a affordable')) {
        md = md.replace(/\ba ultra-luxury\b/gi, 'an ultra-luxury');
        md = md.replace(/\ba affordable\b/gi, 'an affordable');
        updates.metaDescription = md;
        changed = true;
      }
    }

    if (changed) {
      const { error } = await supabase.from('projects').update(updates).eq('id', p.id);
      if (error) {
        console.log(`  ERROR ${p.slug}: ${error.message}`);
      } else {
        console.log(`  FIXED grammar: ${p.slug}`);
        fixed++;
      }
    }
  }
  console.log(`Fixed grammar in ${fixed} projects`);
}

// ─── 3. STAGGER BLOG DATES ───
async function staggerBlogDates() {
  console.log('\n=== STAGGERING BLOG DATES ===');

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, title, slug, publishedAt')
    .not('publishedAt', 'is', null)
    .order('publishedAt', { ascending: true });

  if (!posts || posts.length === 0) {
    console.log('No published posts found');
    return;
  }

  // Space 20 posts across ~3 months (Jan 6 - Mar 29, 2026)
  // 4-5 days apart, published at varied times
  const startDate = new Date('2026-01-06T09:00:00Z');
  const daySpacing = [4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 5, 5, 4, 5, 4, 5, 4, 5];
  const hours = [9, 10, 14, 11, 15, 9, 13, 10, 16, 11, 14, 9, 10, 15, 11, 13, 9, 14, 10, 11];

  // Order posts logically: foundational guides first, then specific topics
  const publishOrder = [
    'pre-construction-condos-in-miami-the-complete-2026-buyers-guide',
    'how-to-buy-a-pre-construction-condo-in-miami-step-by-step-process',
    'miami-pre-construction-deposit-structure-explained',
    'pre-construction-vs-resale-condos-in-miami-which-is-better',
    'miami-condo-market-report-2026-trends-prices-and-forecast',
    'is-miami-a-good-investment-for-pre-construction-condos',
    'pre-construction-condo-financing-in-miami-mortgage-options-and-developer-terms',
    'miami-pre-construction-closing-costs-what-buyers-need-to-know',
    'foreign-buyers-guide-purchasing-pre-construction-in-miami',
    'miami-condo-rental-income-what-to-expect-from-pre-construction-investments',
    'miami-condo-hoa-fees-what-pre-construction-buyers-should-know',
    'best-pre-construction-condos-in-brickell-2026',
    'best-new-condos-in-miami-beach-2026',
    'best-new-condos-in-downtown-miami-and-edgewater-2026',
    'top-pre-construction-condos-in-sunny-isles-beach-2026',
    'brickell-vs-edgewater-vs-downtown-miami-where-to-buy-pre-construction',
    'coconut-grove-and-coral-gables-the-hidden-gems-of-miami-pre-construction',
    'luxury-branded-residences-in-miami-the-complete-guide',
    'fort-lauderdale-pre-construction-condos-the-rising-alternative-to-miami',
    'top-10-miami-developers-whos-building-the-best-new-condos',
  ];

  let currentDate = new Date(startDate);
  let fixed = 0;

  for (let i = 0; i < publishOrder.length; i++) {
    const slug = publishOrder[i];
    const post = posts.find((p: any) => p.slug === slug);
    if (!post) {
      console.log(`  SKIP: ${slug} not found`);
      continue;
    }

    if (i > 0) {
      currentDate.setDate(currentDate.getDate() + daySpacing[i]);
    }
    currentDate.setHours(hours[i], Math.floor(Math.random() * 60), 0, 0);

    const newDate = currentDate.toISOString();
    const { error } = await supabase
      .from('blog_posts')
      .update({ publishedAt: newDate })
      .eq('id', post.id);

    if (error) {
      console.log(`  ERROR ${slug}: ${error.message}`);
    } else {
      console.log(`  ${slug} → ${newDate.split('T')[0]}`);
      fixed++;
    }
  }

  // Handle any posts not in the order list
  const ordered = new Set(publishOrder);
  const remaining = posts.filter((p: any) => !ordered.has(p.slug));
  for (const post of remaining) {
    currentDate.setDate(currentDate.getDate() + 4);
    const newDate = currentDate.toISOString();
    const { error } = await supabase
      .from('blog_posts')
      .update({ publishedAt: newDate })
      .eq('id', post.id);

    if (!error) {
      console.log(`  ${post.slug} → ${newDate.split('T')[0]}`);
      fixed++;
    }
  }

  console.log(`Staggered ${fixed} blog post dates`);
}

// ─── RUN ALL ───
async function main() {
  await fixNeighborhoods();
  await fixGrammar();
  await staggerBlogDates();
  console.log('\n=== ALL DATA FIXES COMPLETE ===');
}

main().catch(console.error);
