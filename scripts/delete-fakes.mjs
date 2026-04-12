import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const report = JSON.parse(fs.readFileSync('scripts/verification-report.json', 'utf-8'));

async function main() {
  const fakeNames = report.fakeProjects.map(f => f.name);
  console.log(`Attempting to delete ${fakeNames.length} fake listings...`);

  // Test: can we read one?
  const { data: testRead } = await supabase
    .from('projects')
    .select('id, name')
    .eq('name', 'Lux Park')
    .single();

  console.log('Can read "Lux Park"?', testRead ? `Yes (id=${testRead.id})` : 'No — not found or RLS blocked');

  if (!testRead) {
    console.log('Cannot find fake projects — they may already be deleted or RLS is blocking.');
    const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
    console.log('Current project count:', count);
    return;
  }

  // Try delete
  const { error: delError, count: delCount } = await supabase
    .from('projects')
    .delete({ count: 'exact' })
    .eq('id', testRead.id);

  console.log('Delete result:', delError ? `Error: ${delError.message} (${delError.code})` : `Deleted ${delCount} rows`);

  // If RLS blocks, we need to use the Prisma direct connection instead
  if (delError) {
    console.log('\nRLS is blocking deletes via anon key.');
    console.log('Options:');
    console.log('1. Use SUPABASE_SERVICE_ROLE_KEY (not in .env.local)');
    console.log('2. Use Prisma to delete via DATABASE_URL');
    console.log('3. Disable RLS temporarily in Supabase dashboard');

    // Try Prisma approach
    console.log('\nAttempting Prisma delete...');
  }

  const { count } = await supabase.from('projects').select('*', { count: 'exact', head: true });
  console.log('Current project count:', count);
}

main().catch(console.error);
