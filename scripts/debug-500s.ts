/**
 * Debug the 4 remaining 500 errors by examining their full data
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fnyrtptmcazhmoztmuay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZueXJ0cHRtY2F6aG1venRtdWF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3NjE3MDEsImV4cCI6MjA5MDMzNzcwMX0.g-xX5_3KjesxPDcs390w2c7J35PKN0niRzaTFRcHRiI'
);

const BROKEN = [
  '888-brickell-by-dolce-gabbana',
  'waldorf-astoria-residences-miami',
  'mercedes-benz-places-miami',
  'baccarat-residences-miami',
];

async function main() {
  for (const slug of BROKEN) {
    console.log(`\n=== ${slug} ===`);
    const { data: p, error } = await supabase
      .from('projects')
      .select('*, neighborhood:neighborhoods(*), developer:developers(*)')
      .eq('slug', slug)
      .single();

    if (error) { console.log('  QUERY ERROR:', error.message); continue; }
    if (!p) { console.log('  NOT FOUND'); continue; }

    // Check all fields the template accesses
    console.log(`  name: ${p.name}`);
    console.log(`  slug: ${p.slug}`);
    console.log(`  status: ${p.status}`);
    console.log(`  category: ${p.category}`);
    console.log(`  neighborhood: ${JSON.stringify(p.neighborhood?.name)}`);
    console.log(`  developer: ${JSON.stringify(p.developer?.name)}`);
    console.log(`  priceMin: ${p.priceMin}`);
    console.log(`  priceMax: ${p.priceMax}`);
    console.log(`  floors: ${p.floors}`);
    console.log(`  totalUnits: ${p.totalUnits}`);
    console.log(`  estCompletion: ${p.estCompletion}`);
    console.log(`  address: ${p.address}`);
    console.log(`  mainImageUrl: ${p.mainImageUrl?.slice(0, 80)}`);
    console.log(`  images type: ${typeof p.images}, keys: ${p.images ? Object.keys(p.images) : 'null'}`);
    console.log(`  amenities type: ${typeof p.amenities}, isArray: ${Array.isArray(p.amenities)}, len: ${Array.isArray(p.amenities) ? p.amenities.length : 'N/A'}`);
    console.log(`  faqJson type: ${typeof p.faqJson}, isArray: ${Array.isArray(p.faqJson)}`);
    console.log(`  description len: ${p.description?.length || 0}`);
    console.log(`  featured: ${p.featured}`);

    // Check for any null values that might cause issues
    if (p.images && typeof p.images === 'object') {
      const gallery = (p.images as any).gallery;
      const floorPlans = (p.images as any).floorPlans;
      console.log(`  images.gallery: ${Array.isArray(gallery) ? `${gallery.length} items` : typeof gallery}`);
      console.log(`  images.floorPlans: ${Array.isArray(floorPlans) ? `${floorPlans.length} items` : typeof floorPlans}`);
      // Check for malformed URLs
      if (Array.isArray(gallery)) {
        gallery.forEach((img: any, i: number) => {
          if (typeof img === 'string' || !img.url) {
            console.log(`    MALFORMED gallery[${i}]: ${JSON.stringify(img).slice(0, 100)}`);
          } else if (img.url && (img.url.includes('undefined') || img.url.includes('null') || img.url.startsWith('https://miamiresidential.comhttps'))) {
            console.log(`    BAD URL gallery[${i}]: ${img.url.slice(0, 100)}`);
          }
        });
      }
    }
  }

  // Also fix ella-miami-beach grammar
  console.log('\n=== FIXING ella-miami-beach grammar ===');
  const { data: ella } = await supabase.from('projects').select('description').eq('slug', 'ella-miami-beach').single();
  if (ella?.description?.includes('a ultra') || ella?.description?.includes('a affordable')) {
    let d = ella.description;
    d = d.replace(/\ba ultra-luxury\b/gi, 'an ultra-luxury');
    d = d.replace(/\ba affordable\b/gi, 'an affordable');
    await supabase.from('projects').update({ description: d }).eq('slug', 'ella-miami-beach');
    console.log('  Fixed ella-miami-beach');
  }
}

main().catch(console.error);
