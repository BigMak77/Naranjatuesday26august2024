/**
 * Final verification - check current state of all Sanitation Workers
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verify() {
  console.log('🔍 FINAL VERIFICATION - Sanitation Workers\n');

  // Get Sanitation Worker role
  const { data: role } = await supabase
    .from('roles')
    .select('id, title')
    .ilike('title', '%sanitation%')
    .single();

  if (!role) {
    console.log('❌ Sanitation Worker role not found');
    return;
  }

  // Get all users with this role
  const { data: users } = await supabase
    .from('users')
    .select('auth_id, first_name, last_name')
    .eq('role_id', role.id)
    .not('auth_id', 'is', null)
    .order('last_name');

  console.log(`Found ${users?.length} Sanitation Workers:\n`);

  let allConsistent = true;
  const assignmentCounts = new Map<number, number>();

  for (const user of users || []) {
    const { data: assignments } = await supabase
      .from('user_assignments')
      .select('item_id')
      .eq('auth_id', user.auth_id);

    const count = assignments?.length || 0;
    assignmentCounts.set(count, (assignmentCounts.get(count) || 0) + 1);

    const icon = count >= 6 ? '✅' : count > 0 ? '⚠️ ' : '❌';
    console.log(`${icon} ${user.first_name} ${user.last_name}: ${count} assignments`);

    if (count < 6) {
      allConsistent = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log('Assignment distribution:');
  for (const [count, userCount] of Array.from(assignmentCounts.entries()).sort((a, b) => b[0] - a[0])) {
    console.log(`  ${count} assignments: ${userCount} users`);
  }

  if (allConsistent) {
    console.log('\n✅ ALL USERS CONSISTENT - Training inheritance is working!');
  } else {
    console.log('\n❌ INCONSISTENT - Some users still missing training');
    console.log('\nPossible causes:');
    console.log('1. Backfill script didnt process all users');
    console.log('2. Users were added after backfill without triggers working');
    console.log('3. RLS policies blocking queries');
  }
  console.log('='.repeat(60));
}

verify();
