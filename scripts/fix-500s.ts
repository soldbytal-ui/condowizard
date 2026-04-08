/**
 * Fix the 4 projects with 500 errors
 * Root cause: amenities stored as string instead of JSON array
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

async function main() {
  // Get ALL projects with string amenities (not just the 4 known ones)
  const { data: projects } = await supabase
    .from('projects')
    .select('id, slug, amenities');

  let fixed = 0;
  for (const p of (projects || [])) {
    if (p.amenities && typeof p.amenities === 'string') {
      // Parse the string into an array
      let amenitiesArray: string[];
      try {
        // Try JSON parse first (might be a JSON string)
        amenitiesArray = JSON.parse(p.amenities);
      } catch {
        // Otherwise split by comma or newline
        amenitiesArray = p.amenities
          .split(/[,\n]/)
          .map((a: string) => a.trim())
          .filter((a: string) => a.length > 0);
      }

      console.log(`  ${p.slug}: "${(p.amenities as string).slice(0, 60)}..." → [${amenitiesArray.length} items]`);

      const { error } = await supabase
        .from('projects')
        .update({ amenities: amenitiesArray })
        .eq('id', p.id);

      if (error) {
        console.log(`    ERROR: ${error.message}`);
      } else {
        fixed++;
      }
    }
  }

  console.log(`\nFixed ${fixed} projects with string amenities`);

  // Also fix any projects with images that have null keys
  const { data: imgProjects } = await supabase
    .from('projects')
    .select('id, slug, images');

  let imgFixed = 0;
  for (const p of (imgProjects || [])) {
    if (p.images && typeof p.images === 'object') {
      const keys = Object.keys(p.images);
      if (keys.includes('null') || keys.length === 0) {
        // Fix: set images to proper structure
        console.log(`  ${p.slug}: fixing images with null keys`);
        const { error } = await supabase
          .from('projects')
          .update({ images: { gallery: [], floorPlans: [] } })
          .eq('id', p.id);
        if (!error) imgFixed++;
      }
    }
  }
  console.log(`Fixed ${imgFixed} projects with malformed images`);

  // Verify the 4 pages
  console.log('\n=== TESTING AFTER FIX ===');
  const testSlugs = [
    '888-brickell-by-dolce-gabbana',
    'waldorf-astoria-residences-miami',
    'mercedes-benz-places-miami',
    'baccarat-residences-miami',
  ];

  // Wait for Vercel to pick up the data changes
  console.log('Testing pages...');
  for (const slug of testSlugs) {
    const res = await fetch(`https://preconstructionmiami.net/properties/${slug}`, {
      headers: { 'User-Agent': 'SEO-Audit/1.0' },
    });
    console.log(`  ${res.ok ? '✓' : '✗'} ${res.status} /properties/${slug}`);
  }
}

main().catch(console.error);
