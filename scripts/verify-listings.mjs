// Phase 1: Verify listings — classify as REAL, SUSPECT, or FAKE
// Run: npx tsx scripts/verify-listings.mjs

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

// Known real Toronto pre-construction projects (from precondo.ca, livabl.com, buzzbuzzhome)
// These are VERIFIED real projects that exist
const KNOWN_REAL_DEVELOPERS = new Set([
  'Tridel', 'Menkes', 'Daniels Corporation', 'Great Gulf', 'CentreCourt',
  'Concord Adex', 'Greenland Group', 'Pinnacle International', 'Plaza',
  'Pemberton Group', 'Lifetime Developments', 'Tribute Communities',
  'Mattamy Homes', 'Marlin Spring', 'Davpart', 'Canderel', 'Devron',
  'Dream Unlimited', 'MOD Developments', 'Altree Developments',
  'Camrost Felcorp', 'Context Development', 'CreateTO', 'Cityzen',
  'Diamante', 'Empire Communities', 'First Capital', 'Greybrook Realty',
  'Hullmark', 'KingSett Capital', 'Lanterra', 'Lindvest', 'Minto',
  'NUCLEUS', 'Oxford Properties', 'Remington Group', 'Republic Developments',
  'RioCan', 'Stanton Renaissance', 'Stafford Homes', 'Streetcar Developments',
  'TAS', 'The Gupta Group', 'Urban Capital', 'Westbank', 'Westdale Properties',
  'North American Development Group', 'Daffodil Developments', 'State Building Group',
  'Capital Developments', 'QuadReal Property Group', 'Allied Properties',
  'Fieldgate Homes', 'Aspen Ridge Homes', 'CountryWide Homes', 'Sierra Building Group',
  'Bazis', 'Liberté Development', 'Reserve Properties',
]);

// Patterns that indicate AI-generated fake names
const FAKE_NAME_PATTERNS = [
  /^Alto \d/i, /^Apex \d/i, /^Arc \d/i, /^Aura \d/i, /^Brio \d/i,
  /^Cloud \d/i, /^Crest \d/i, /^Lux \d/i, /^Novo \d/i, /^Sola \d/i,
  /^Summit \d/i, /^Vantage \d/i, /^Zen \d/i, /^Skyline \d/i,
  /^Alto (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Apex (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts|Place)/i,
  /^Arc (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Aura (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Brio (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Cloud (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Crest (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Lux (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Novo (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Sola (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Summit (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Vantage (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Zen (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Skyline (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
  /^Rise (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts)/i,
];

async function main() {
  console.log('=== Phase 1: Listing Verification ===\n');

  // Fetch all projects
  const allProjects = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('*, developer:developers(name), neighborhood:neighborhoods(name)')
      .range(page * 100, (page + 1) * 100 - 1);
    if (error) { console.error('DB error:', error.message); break; }
    if (!data || data.length === 0) break;
    allProjects.push(...data);
    page++;
  }
  console.log(`Loaded ${allProjects.length} projects from database\n`);

  const verified = [];   // Real projects (have images + known developer OR address-based name)
  const suspect = [];    // Might be real but need checking (no image, unknown dev, non-generic name)
  const fake = [];       // Almost certainly AI-generated (pattern-matching name, no image, no known dev)

  for (const p of allProjects) {
    const name = p.name || '';
    const dev = p.developer?.name || '';
    const hasImage = !!(p.mainImageUrl || (p.images && p.images.length > 0));
    const isAddressBased = /^\d/.test(name);
    const hasKnownDev = [...KNOWN_REAL_DEVELOPERS].some(d => dev.toLowerCase().includes(d.toLowerCase()));
    const matchesFakePattern = FAKE_NAME_PATTERNS.some(pat => pat.test(name));

    const entry = {
      id: p.id,
      name,
      slug: p.slug,
      address: p.address,
      developer: dev,
      neighbourhood: p.neighborhood?.name || '',
      hasImage,
      floors: p.floors,
      units: p.totalUnits,
      priceMin: p.priceMin,
      status: p.status,
    };

    if (matchesFakePattern && !hasImage && !hasKnownDev) {
      // Pattern-matching AI name + no image + unknown dev = FAKE
      fake.push({ ...entry, reason: 'AI-generated name pattern, no image, unknown developer' });
    } else if (isAddressBased || (hasImage && hasKnownDev)) {
      // Address-based name OR has image AND known developer = VERIFIED
      verified.push({ ...entry, reason: hasImage && hasKnownDev ? 'Known developer + has image' : 'Address-based real project name' });
    } else if (hasImage || hasKnownDev) {
      // Has image OR known dev but not both = probably real
      verified.push({ ...entry, reason: hasImage ? 'Has real image' : 'Known developer' });
    } else if (matchesFakePattern) {
      // Matches fake pattern but has some data = SUSPECT
      suspect.push({ ...entry, reason: 'Name matches AI pattern, needs manual review' });
    } else {
      // Non-address name, no image, unknown dev, but doesn't match clear fake patterns
      suspect.push({ ...entry, reason: 'Unknown project, no image, unrecognized developer' });
    }
  }

  console.log(`=== RESULTS ===`);
  console.log(`VERIFIED: ${verified.length} projects (real, keep)`);
  console.log(`SUSPECT:  ${suspect.length} projects (need review)`);
  console.log(`FAKE:     ${fake.length} projects (delete candidates)\n`);

  // Write reports
  const report = {
    timestamp: new Date().toISOString(),
    total: allProjects.length,
    verified: verified.length,
    suspect: suspect.length,
    fake: fake.length,
    fakeProjects: fake.map(f => ({ name: f.name, address: f.address, reason: f.reason })),
    suspectProjects: suspect.map(s => ({ name: s.name, address: s.address, developer: s.developer, reason: s.reason })),
    verifiedCount: verified.length,
  };

  const fs = await import('fs');
  fs.writeFileSync('scripts/verification-report.json', JSON.stringify(report, null, 2));
  console.log('Wrote scripts/verification-report.json');

  // Write fake listings file
  const fakeList = fake.map(f => `${f.name} | ${f.address} | Dev: ${f.developer || 'none'}`).join('\n');
  fs.writeFileSync('scripts/fake-listings.txt', fakeList);
  console.log(`Wrote scripts/fake-listings.txt (${fake.length} entries)`);

  // Print summary of fakes
  console.log('\n=== FAKE LISTINGS (first 20) ===');
  fake.slice(0, 20).forEach(f => console.log(`  ✗ ${f.name} | ${f.address}`));
  if (fake.length > 20) console.log(`  ... and ${fake.length - 20} more`);

  console.log('\n=== SUSPECT LISTINGS (first 10) ===');
  suspect.slice(0, 10).forEach(s => console.log(`  ? ${s.name} | ${s.address} | Dev: ${s.developer}`));

  console.log('\n=== VERIFIED SAMPLE (first 10) ===');
  verified.slice(0, 10).forEach(v => console.log(`  ✓ ${v.name} | ${v.address}`));
}

main().catch(console.error);
