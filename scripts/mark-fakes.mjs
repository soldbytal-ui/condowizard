import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const report = JSON.parse(fs.readFileSync('scripts/verification-report.json', 'utf-8'));

async function main() {
  const fakeNames = report.fakeProjects.map(f => f.name);
  console.log(`Marking ${fakeNames.length} fake listings as COMPLETED (soft-delete)...`);

  let marked = 0;
  for (const name of fakeNames) {
    const { data, error } = await supabase
      .from('projects')
      .update({ status: 'COMPLETED', featured: false })
      .eq('name', name)
      .select('id');

    if (error) {
      console.log(`  Error marking "${name}": ${error.message}`);
    } else if (data && data.length > 0) {
      marked++;
    }
  }

  console.log(`\nMarked ${marked}/${fakeNames.length} as COMPLETED`);

  // Verify: count active (non-COMPLETED) projects
  const { count: total } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  const { count: completed } = await supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
  const { count: active } = await supabase.from('projects').select('*', { count: 'exact', head: true }).neq('status', 'COMPLETED');

  console.log(`\nDatabase counts:`);
  console.log(`  Total: ${total}`);
  console.log(`  COMPLETED (soft-deleted): ${completed}`);
  console.log(`  Active (shown on site): ${active}`);
}

main().catch(console.error);
