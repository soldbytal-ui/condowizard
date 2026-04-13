// Verify pre-construction status using Repliers MLS data
// Logic: If a building has ACTIVE resale listings, it's COMPLETED, not pre-construction
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const API_KEY = process.env.REPLIERS_API_KEY;

async function checkIfBuilt(address) {
  // Parse the address into street number + name
  const match = address.match(/^(\d+)\s+(.+?)(?:\s+(St|Ave|Blvd|Rd|Dr|Way|Ter|Crt|Ln|Pl|Cres|Pkwy|Ct|Gate|Trail))/i);
  if (!match) return { built: false, reason: 'unparseable' };

  const streetNum = match[1];
  const streetName = match[2];

  try {
    // Search Repliers for ACTIVE resale listings at this address
    const url = `https://api.repliers.io/listings?streetNumber=${streetNum}&streetName=${encodeURIComponent(streetName)}&status=A&type=sale&resultsPerPage=1`;
    const res = await fetch(url, {
      headers: { 'REPLIERS-API-KEY': API_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { built: false, reason: 'api-error' };
    const data = await res.json();

    if (data.count > 0) {
      // Active resale listings exist → building is COMPLETED
      return {
        built: true,
        count: data.count,
        reason: `${data.count} active resale listings found`,
        sample: data.listings?.[0]?.mlsNumber,
      };
    }

    // Also check sold history — if units have SOLD, the building is built
    const soldUrl = `https://api.repliers.io/listings?streetNumber=${streetNum}&streetName=${encodeURIComponent(streetName)}&status=U&lastStatus=Sld&resultsPerPage=1`;
    const soldRes = await fetch(soldUrl, {
      headers: { 'REPLIERS-API-KEY': API_KEY },
      signal: AbortSignal.timeout(8000),
    });
    if (soldRes.ok) {
      const soldData = await soldRes.json();
      if (soldData.count > 5) {
        // Many sold units → definitely completed
        return {
          built: true,
          count: soldData.count,
          reason: `${soldData.count} sold listings found`,
        };
      }
    }

    return { built: false, reason: 'no-resale-found' };
  } catch (err) {
    return { built: false, reason: 'timeout' };
  }
}

async function main() {
  console.log('=== Verifying pre-construction status via Repliers MLS ===\n');
  console.log('Logic: If a building has active resale or 5+ sold listings, it\'s COMPLETED.\n');

  const { data: projects } = await supabase.from('projects')
    .select('id, name, slug, address, floors, totalUnits, featured, developer:developers(name), neighborhood:neighborhoods(name)')
    .neq('status', 'COMPLETED');

  console.log(`Checking ${projects?.length} active projects...\n`);

  const completed = [];
  const precon = [];
  const unknown = [];
  let checked = 0;

  for (const p of (projects || [])) {
    const addr = (p.address || '').split(',')[0].trim();
    if (!addr) { unknown.push({ ...p, reason: 'no-address' }); checked++; continue; }

    const result = await checkIfBuilt(addr);

    if (result.built) {
      completed.push({
        id: p.id, name: p.name, address: p.address,
        developer: p.developer?.name,
        neighbourhood: p.neighborhood?.name,
        featured: p.featured,
        resaleCount: result.count,
        reason: result.reason,
      });
    } else {
      precon.push({ id: p.id, name: p.name, address: p.address, developer: p.developer?.name });
    }

    checked++;
    if (checked % 50 === 0) {
      console.log(`  Progress: ${checked}/${projects.length} — ${completed.length} completed, ${precon.length} pre-con`);
      // Rate limit: pause every 50
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== RESULTS ===`);
  console.log(`Checked: ${checked}`);
  console.log(`COMPLETED (has resale/sold listings — DELETE): ${completed.length}`);
  console.log(`PRE-CONSTRUCTION (no resale found — KEEP): ${precon.length}`);
  console.log(`Unknown (no address): ${unknown.length}`);

  // Show completed projects (these are FAKES or already-built)
  console.log(`\n=== COMPLETED BUILDINGS TO DELETE (first 30) ===`);
  completed.slice(0, 30).forEach(p => {
    console.log(`  ✗ ${p.name} | ${(p.address||'').slice(0,40)} | ${p.resaleCount} resale | ${p.reason}`);
  });
  if (completed.length > 30) console.log(`  ... and ${completed.length - 30} more`);

  // Show featured ones that are completed (CRITICAL)
  const featuredCompleted = completed.filter(p => p.featured);
  if (featuredCompleted.length > 0) {
    console.log(`\n!!! FEATURED PROJECTS THAT ARE ACTUALLY COMPLETED !!!`);
    featuredCompleted.forEach(p => console.log(`  ✗ ${p.name} | ${p.resaleCount} resale listings`));
  }

  // Soft-delete the completed ones
  console.log(`\nSoft-deleting ${completed.length} completed buildings...`);
  let deleted = 0;
  for (const p of completed) {
    const { data } = await supabase.from('projects')
      .update({ status: 'COMPLETED', featured: false })
      .eq('id', p.id)
      .select('id');
    if (data?.length) deleted++;
  }
  console.log(`Deleted: ${deleted}/${completed.length}`);

  // Final count
  const { count: active } = await supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED');
  console.log(`\nFinal active projects: ${active}`);

  // Show 20 random survivors
  console.log(`\n=== 20 RANDOM SURVIVORS (spot-check) ===`);
  const survivors = precon.sort(() => Math.random() - 0.5).slice(0, 20);
  for (const s of survivors) {
    console.log(`  ✓ ${s.name} | ${(s.address||'').slice(0,45)} | Dev: ${s.developer || 'N/A'}`);
  }

  // Save report
  const fs = await import('fs');
  fs.writeFileSync('scripts/repliers-verification.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    checked, completed: completed.length, precon: precon.length, unknown: unknown.length,
    completedProjects: completed,
    survivorSample: survivors,
  }, null, 2));
  console.log(`\nReport saved to scripts/repliers-verification.json`);
}

main().catch(console.error);
