import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const report = JSON.parse(fs.readFileSync('scripts/verification-report.json', 'utf-8'));

// Additional known real project names (branded names that ARE real)
const KNOWN_REAL_PROJECTS = new Set([
  'The Well', 'One Yonge', 'Concord CityPlace', 'Harbour Plaza',
  'Sugar Wharf', 'Pinnacle One Yonge', 'The One', 'SQ Condos',
  'Galleria', 'YC Condos', 'E Condos', 'X Condos', 'U Condos',
  'M City', 'Transit City', 'Via Bloor', 'Rise', 'Grid',
]);

// Clearly fake pattern: "[Prefix] [Number] [Suffix]" with no known developer
const CLEARLY_FAKE_PATTERNS = [
  /^(Grand|West|East|North|South|Upper|Sky|Park|Port|Junction|Rise|Cloud) (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts|Condos|Place)$/i,
  /^(Grand|West|East|North|South|Upper|Sky|Park|Port|Junction) \d+ (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts|Condos|Place)$/i,
];

async function main() {
  const suspects = report.suspectProjects;
  console.log(`Second-pass verification of ${suspects.length} suspect listings...\n`);

  const reclassifyVerified = [];
  const reclassifyFake = [];
  const stillSuspect = [];

  for (const s of suspects) {
    const name = s.name;
    const dev = s.developer || '';
    const addr = s.address || '';

    // Check if it's a known real project
    if (KNOWN_REAL_PROJECTS.has(name)) {
      reclassifyVerified.push({ ...s, reason: 'Known real project name' });
      continue;
    }

    // Check if it has a real Toronto address (specific civic number + known street)
    const hasRealAddress = /^\d+\s+\w+/.test(addr) && (addr.includes(', Toronto') || addr.includes(', Mississauga') || addr.includes(', Brampton') || addr.includes(', Markham') || addr.includes(', Vaughan') || addr.includes(', Hamilton') || addr.includes(', Oakville'));

    // Check if the name matches clearly fake patterns
    const isClearlyFake = CLEARLY_FAKE_PATTERNS.some(p => p.test(name));

    // Check for specific red flags
    const hasGenericName = /^(Grand|West|East|North|South|Upper|Sky|Park|Port|Junction|Harbour|Rise|Cloud|CityPlace|Vaughan|The) (Collection|Living|Park|Residences|Square|Suites|Towers|Lofts|Condos|Place|Lofts|Tower)$/i.test(name);
    const hasNoDevNoImage = !dev;

    if (isClearlyFake || (hasGenericName && hasNoDevNoImage)) {
      reclassifyFake.push({ ...s, reason: `Generic name "${name}" with no developer` });
    } else if (hasRealAddress) {
      // Has a real-looking address — probably a real development application
      reclassifyVerified.push({ ...s, reason: 'Has valid GTA address' });
    } else {
      stillSuspect.push(s);
    }
  }

  console.log(`=== SECOND PASS RESULTS ===`);
  console.log(`Reclassified as VERIFIED: ${reclassifyVerified.length}`);
  console.log(`Reclassified as FAKE: ${reclassifyFake.length}`);
  console.log(`Still suspect: ${stillSuspect.length}\n`);

  // Mark the newly-found fakes
  if (reclassifyFake.length > 0) {
    console.log('=== NEW FAKES (marking as COMPLETED) ===');
    let marked = 0;
    for (const f of reclassifyFake) {
      console.log(`  ✗ ${f.name} | ${f.address} | Reason: ${f.reason}`);
      const { data } = await supabase
        .from('projects')
        .update({ status: 'COMPLETED', featured: false })
        .eq('name', f.name)
        .select('id');
      if (data?.length) marked++;
    }
    console.log(`\nMarked ${marked}/${reclassifyFake.length} additional fakes`);
  }

  if (stillSuspect.length > 0) {
    console.log('\n=== STILL SUSPECT (keeping for now) ===');
    stillSuspect.forEach(s => console.log(`  ? ${s.name} | ${s.address} | Dev: ${s.developer}`));
  }

  // Final counts
  const { count: total } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  const { count: completed } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
  const active = total - completed;
  console.log(`\n=== FINAL COUNTS ===`);
  console.log(`Total in DB: ${total}`);
  console.log(`COMPLETED (soft-deleted fakes): ${completed}`);
  console.log(`Active verified projects: ${active}`);
}

main().catch(console.error);
