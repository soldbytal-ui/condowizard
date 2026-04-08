/**
 * SEO Data Audit Script
 * Queries Supabase to find all data issues that need fixing
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

async function audit() {
  // 1. Get all projects with neighborhood/developer joins
  const { data: projects, error: projErr } = await supabase
    .from('projects')
    .select('id, name, slug, status, category, description, neighborhoodId, developerId, priceMin, mainImageUrl, neighborhood:neighborhoods(name, slug), developer:developers(name, slug)')
    .order('name');

  if (projErr) { console.error('Projects error:', projErr); return; }
  console.log(`\n=== PROJECTS (${projects?.length}) ===`);

  // Find projects with missing critical fields
  const broken = (projects || []).filter((p: any) =>
    !p.name || !p.slug || !p.neighborhoodId || !p.neighborhood
  );
  console.log(`\nBroken projects (missing name/slug/neighborhood): ${broken.length}`);
  broken.forEach((p: any) => console.log(`  - ${p.slug}: name=${p.name}, nhId=${p.neighborhoodId}, nh=${JSON.stringify(p.neighborhood)}`));

  // Find "a ultra-luxury" in descriptions
  const grammarBugs = (projects || []).filter((p: any) =>
    p.description?.includes('a ultra-luxury') || p.description?.includes('a Ultra')
  );
  console.log(`\nProjects with "a ultra-luxury" grammar: ${grammarBugs.length}`);
  grammarBugs.forEach((p: any) => console.log(`  - ${p.slug}`));

  // Projects with no description or very short description
  const noDesc = (projects || []).filter((p: any) => !p.description || p.description.length < 100);
  console.log(`\nProjects with no/short description: ${noDesc.length}`);
  noDesc.forEach((p: any) => console.log(`  - ${p.slug}: ${p.description?.length || 0} chars`));

  // Projects with missing neighborhood join (could cause 500)
  const noNeighborhood = (projects || []).filter((p: any) => !p.neighborhood);
  console.log(`\nProjects with no neighborhood (NULL join): ${noNeighborhood.length}`);
  noNeighborhood.forEach((p: any) => console.log(`  - ${p.slug}: nhId=${p.neighborhoodId}`));

  // Projects with missing developer
  const noDev = (projects || []).filter((p: any) => !p.developer);
  console.log(`\nProjects with no developer: ${noDev.length}`);
  noDev.forEach((p: any) => console.log(`  - ${p.slug}`));

  // 2. Get all blog posts
  const { data: blogs, error: blogErr } = await supabase
    .from('blog_posts')
    .select('id, title, slug, publishedAt, featuredImage, author, excerpt')
    .order('publishedAt', { ascending: false });

  if (blogErr) { console.error('Blog error:', blogErr); return; }
  console.log(`\n=== BLOG POSTS (${blogs?.length}) ===`);
  blogs?.forEach((b: any) => console.log(`  - ${b.slug}: published=${b.publishedAt}, image=${b.featuredImage ? 'YES' : 'NO'}, author=${b.author}`));

  // 3. Specific slugs the auditor found with 500 errors
  const problem500s = ['888-brickell-by-dolce-gabbana', 'waldorf-astoria-residences-miami', 'mercedes-benz-places-miami', 'baccarat-residences-miami'];
  console.log(`\n=== CHECKING 500 ERROR SLUGS ===`);
  for (const slug of problem500s) {
    const match = (projects || []).find((p: any) => p.slug === slug);
    if (match) {
      console.log(`  ${slug}: EXISTS, nh=${JSON.stringify(match.neighborhood)}, dev=${JSON.stringify(match.developer)}, priceMin=${match.priceMin}`);
    } else {
      console.log(`  ${slug}: NOT FOUND in projects table`);
    }
  }

  // 4. Check all categories
  const cats = new Set((projects || []).map((p: any) => p.category));
  console.log(`\n=== CATEGORIES ===`);
  cats.forEach(c => console.log(`  - ${c}`));

  // 5. All statuses
  const statuses = new Set((projects || []).map((p: any) => p.status));
  console.log(`\n=== STATUSES ===`);
  statuses.forEach(s => console.log(`  - ${s}`));

  // 6. Sample descriptions to understand templates
  console.log(`\n=== SAMPLE DESCRIPTIONS (first 200 chars) ===`);
  (projects || []).slice(0, 5).forEach((p: any) => {
    console.log(`\n  ${p.slug}:`);
    console.log(`  ${p.description?.slice(0, 200) || 'NULL'}`);
  });
}

audit();
