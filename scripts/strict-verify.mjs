// Strict verification: only keep projects with REAL data from known sources
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Known COMPLETED projects that should NOT be listed as pre-construction
const KNOWN_COMPLETED = [
  'zen condos', 'ice condos', 'maple leaf square', 'aura condos',
  'one bloor', 'casa condos', 'x condos', 'u condos', 'charlie condos',
  'fly condos', 'king charlotte', 'minto westside',
];

// Projects with images from REAL scraped sources (not Unsplash)
const REAL_IMAGE_DOMAINS = ['gta-homes.com', 'skyrisecities.com', 'precondo.ca',
  'livabl.com', 'buzzbuzzhome.com', 'mizrahidevelopments.ca', 'photos.gta-homes.com'];

async function main() {
  const { data } = await supabase.from('projects')
    .select('id, name, slug, address, floors, totalUnits, priceMin, status, mainImageUrl, images, developer:developers(name), neighborhood:neighborhoods(name)')
    .neq('status', 'COMPLETED');

  console.log(`Auditing ${data?.length} active projects...\n`);

  const keep = [];      // Verifiably real pre-con
  const remove = [];    // Fake or completed — soft-delete

  for (const p of (data || [])) {
    const name = (p.name || '').toLowerCase();
    const img = p.mainImageUrl || '';
    const imgDomain = img ? (() => { try { return new URL(img).hostname; } catch { return ''; } })() : '';
    const hasRealImage = REAL_IMAGE_DOMAINS.some(d => imgDomain.includes(d));
    const hasUnsplash = img.includes('unsplash');
    const hasDev = !!p.developer?.name;

    // Check if known completed
    const isCompleted = KNOWN_COMPLETED.some(k => name.includes(k));
    if (isCompleted) {
      remove.push({ id: p.id, name: p.name, reason: 'Known completed project' });
      continue;
    }

    // Check for clearly fabricated stats
    if (p.floors && p.floors > 80 && !['pinnacle one yonge', '1 yonge', 'the one'].some(k => name.includes(k))) {
      remove.push({ id: p.id, name: p.name, reason: `Fabricated floors: ${p.floors}` });
      continue;
    }
    if (p.totalUnits && p.totalUnits > 2500 && !['galleria'].some(k => name.includes(k))) {
      remove.push({ id: p.id, name: p.name, reason: `Fabricated units: ${p.totalUnits}` });
      continue;
    }

    // Projects with REAL images from scraped sources = keep
    if (hasRealImage) {
      keep.push({ id: p.id, name: p.name, reason: 'Real image from ' + imgDomain });
      continue;
    }

    // Address-based projects from the Livabl/precondo scraper run (have Unsplash images =
    // were seeded from a real source but given placeholder images)
    // These likely have REAL addresses from development applications
    if (/^\d/.test(p.name) && hasUnsplash) {
      keep.push({ id: p.id, name: p.name, reason: 'Address-based with placeholder image (from dev applications)' });
      continue;
    }

    // Address-based with no image but address looks real
    if (/^\d+\s+\w+/.test(p.name) && p.address?.includes(', Toronto')) {
      keep.push({ id: p.id, name: p.name, reason: 'Toronto address-based project' });
      continue;
    }
    if (/^\d+\s+\w+/.test(p.name) && p.address?.match(/, (Mississauga|Brampton|Markham|Vaughan|Hamilton|Oakville|Burlington|Oshawa|Whitby|Ajax|Pickering|Milton|Newmarket|Aurora|Richmond Hill|Barrie)/)) {
      keep.push({ id: p.id, name: p.name, reason: 'GTA address-based project' });
      continue;
    }

    // Named projects with known real developers = keep
    if (hasDev && hasUnsplash) {
      keep.push({ id: p.id, name: p.name, reason: 'Has developer + placeholder image' });
      continue;
    }

    // Named projects without developer, without real image = likely fake
    if (!hasDev && !hasRealImage) {
      remove.push({ id: p.id, name: p.name, reason: 'Named project, no developer, no real image' });
      continue;
    }

    // Everything else = keep conservatively
    keep.push({ id: p.id, name: p.name, reason: 'Kept conservatively' });
  }

  console.log(`=== RESULTS ===`);
  console.log(`KEEP: ${keep.length}`);
  console.log(`REMOVE: ${remove.length}\n`);

  // Show what's being removed
  console.log('=== REMOVING ===');
  const reasons = {};
  for (const r of remove) {
    const key = r.reason.split(':')[0];
    reasons[key] = (reasons[key] || 0) + 1;
  }
  for (const [reason, count] of Object.entries(reasons)) {
    console.log(`  ${reason}: ${count}`);
  }

  console.log('\nSample removals:');
  remove.slice(0, 15).forEach(r => console.log(`  ✗ ${r.name} — ${r.reason}`));

  // Execute soft-delete
  console.log(`\nSoft-deleting ${remove.length} projects...`);
  let deleted = 0;
  for (const r of remove) {
    const { data: updated } = await supabase.from('projects').update({ status: 'COMPLETED', featured: false }).eq('id', r.id).select('id');
    if (updated?.length) deleted++;
  }
  console.log(`Deleted: ${deleted}/${remove.length}`);

  // Final count
  const { count: active } = await supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED');
  const { count: total } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  console.log(`\nFinal: ${active} active / ${total} total (${total - active} soft-deleted)`);

  // Show 10 random samples from the kept projects
  console.log('\n=== 10 RANDOM KEPT PROJECTS ===');
  const shuffled = keep.sort(() => Math.random() - 0.5).slice(0, 10);
  for (const s of shuffled) {
    const { data: proj } = await supabase.from('projects').select('name, address, floors, totalUnits, priceMin, developer:developers(name), neighborhood:neighborhoods(name)').eq('id', s.id).single();
    if (proj) {
      console.log(JSON.stringify({
        name: proj.name,
        address: proj.address?.slice(0, 50),
        dev: proj.developer?.name || 'N/A',
        hood: proj.neighborhood?.name || 'N/A',
        floors: proj.floors,
        units: proj.totalUnits,
        price: proj.priceMin,
      }));
    }
  }
}

main().catch(console.error);
