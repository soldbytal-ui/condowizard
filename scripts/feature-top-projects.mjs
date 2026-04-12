// Mark top projects with real images as featured
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function main() {
  // Get all active projects with real (non-Unsplash) images
  const { data } = await supabase
    .from('projects')
    .select('id, name, slug, mainImageUrl, developer:developers(name)')
    .neq('status', 'COMPLETED');

  const withRealImages = (data || []).filter(p => {
    const img = p.mainImageUrl || '';
    return img && !img.includes('unsplash') && !img.includes('placeholder') && img.length > 10;
  });

  console.log(`Found ${withRealImages.length} projects with real images`);

  // Mark the top 25 (by developer importance) as featured
  const majorDevs = ['Tridel', 'Menkes', 'Daniels', 'Concord', 'CentreCourt', 'Pemberton',
    'Lifetime', 'Lanterra', 'Great Gulf', 'Pinnacle', 'Camrost', 'Canderel',
    'Greenland', 'MOD', 'Altree', 'Minto', 'Dream', 'Oxford', 'Empire', 'Plaza'];

  // Score each project
  const scored = withRealImages.map(p => {
    const devName = p.developer?.name || '';
    const isMajorDev = majorDevs.some(d => devName.toLowerCase().includes(d.toLowerCase()));
    return { ...p, score: isMajorDev ? 2 : 1 };
  }).sort((a, b) => b.score - a.score);

  const top25 = scored.slice(0, 25);

  console.log('\n=== Marking as FEATURED ===');
  let marked = 0;
  for (const p of top25) {
    const { error } = await supabase
      .from('projects')
      .update({ featured: true })
      .eq('id', p.id);

    if (!error) {
      marked++;
      console.log(`  ✓ ${p.name} (${p.developer?.name || 'N/A'})`);
    } else {
      console.log(`  ✗ ${p.name}: ${error.message}`);
    }
  }

  // Un-feature everything else (clean slate)
  const topIds = top25.map(p => p.id);
  const { data: others } = await supabase
    .from('projects')
    .select('id')
    .eq('featured', true);

  let unfeatured = 0;
  for (const o of (others || [])) {
    if (!topIds.includes(o.id)) {
      await supabase.from('projects').update({ featured: false }).eq('id', o.id);
      unfeatured++;
    }
  }

  console.log(`\nFeatured: ${marked} projects`);
  console.log(`Un-featured: ${unfeatured} other projects`);

  // Final count
  const { count: featuredCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('featured', true);
  const { count: activeCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'COMPLETED');
  console.log(`\nFinal: ${featuredCount} featured / ${activeCount} active`);
}

main().catch(console.error);
