import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function test() {
  console.log('Testing different fetch approaches:\n');

  // Test 1: Default (no range)
  const { data: test1 } = await supabase
    .from('user_assignments')
    .select('id');
  console.log('1. Default query:', test1?.length, 'rows');

  // Test 2: .range(0, 9999)
  const { data: test2 } = await supabase
    .from('user_assignments')
    .select('id')
    .range(0, 9999);
  console.log('2. .range(0, 9999):', test2?.length, 'rows');

  // Test 3: .limit(10000)
  const { data: test3 } = await supabase
    .from('user_assignments')
    .select('id')
    .limit(10000);
  console.log('3. .limit(10000):', test3?.length, 'rows');

  // Test 4: Fetch all with pagination
  console.log('\n4. Fetching all with pagination...');
  const allAssignments = [];
  let page = 0;
  const pageSize = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('user_assignments')
      .select('auth_id, item_id, item_type, completed_at')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (error) {
      console.error('Error:', error);
      break;
    }

    if (!data || data.length === 0) break;

    allAssignments.push(...data);
    console.log(`   Page ${page + 1}: ${data.length} rows (total: ${allAssignments.length})`);

    if (data.length < pageSize) break;
    page++;
  }

  console.log('   TOTAL:', allAssignments.length, 'rows');

  // Find Gail
  const gailAssignments = allAssignments.filter(a =>
    a.auth_id === '068c30c7-6c6f-44ca-ad3e-50cdb08b3714'
  );
  console.log('\n✅ Gail Cue assignments found:', gailAssignments.length);
}

test();
