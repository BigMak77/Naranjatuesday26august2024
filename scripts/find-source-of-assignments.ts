/**
 * Find where Logan Smith's 7 assignments are coming from
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

async function findSource() {
  console.log('🔍 FINDING SOURCE OF ASSIGNMENTS\n');

  try {
    // Get Logan Smith
    const { data: users } = await supabase
      .from('users')
      .select('*')
      .eq('first_name', 'Logan')
      .eq('last_name', 'Smith');

    if (!users || users.length === 0) {
      console.log('User not found');
      return;
    }

    const user = users[0];
    console.log(`Found: ${user.first_name} ${user.last_name}`);
    console.log(`Auth ID: ${user.auth_id}`);
    console.log(`Role ID: ${user.role_id}`);
    console.log(`Dept ID: ${user.department_id}\n`);

    // Get their role
    const { data: role } = await supabase
      .from('roles')
      .select('*, departments(name)')
      .eq('id', user.role_id)
      .single();

    console.log(`Role: ${role?.title}`);
    console.log(`Department: ${(role as any)?.departments?.name || 'N/A'}\n`);

    // Get user's assignments
    const { data: assignments } = await supabase
      .from('user_assignments')
      .select('*, modules(name), documents(title)')
      .eq('auth_id', user.auth_id);

    console.log(`User has ${assignments?.length || 0} assignments:\n`);

    if (assignments) {
      for (const a of assignments) {
        const name = (a as any).modules?.name || (a as any).documents?.title || 'Unknown';
        console.log(`  ${a.item_type}: ${name}`);
        console.log(`    Item ID: ${a.item_id}`);

        // Check if this is in role_assignments
        const { data: roleMatch } = await supabase
          .from('role_assignments')
          .select('*')
          .eq('item_id', a.item_id)
          .eq('type', a.item_type);

        // Check if this is in department_assignments
        const { data: deptMatch } = await supabase
          .from('department_assignments')
          .select('*')
          .eq('item_id', a.item_id)
          .eq('type', a.item_type);

        if (roleMatch && roleMatch.length > 0) {
          console.log(`    ✅ Found in role_assignments for role: ${roleMatch[0].role_id}`);
        }
        if (deptMatch && deptMatch.length > 0) {
          console.log(`    ✅ Found in department_assignments for dept: ${deptMatch[0].department_id}`);
        }
        if ((!roleMatch || roleMatch.length === 0) && (!deptMatch || deptMatch.length === 0)) {
          console.log(`    ⚠️  NOT in any role or department assignments - MANUAL/ORPHANED`);
        }
        console.log();
      }
    }

    // Now check Gail Cue who has 0 assignments
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 Comparing with Gail Cue (0 assignments):\n');

    const { data: gailUsers } = await supabase
      .from('users')
      .select('*')
      .eq('first_name', 'Gail')
      .eq('last_name', 'Cue');

    if (gailUsers && gailUsers.length > 0) {
      const gail = gailUsers[0];
      console.log(`Gail Cue:`);
      console.log(`  Auth ID: ${gail.auth_id}`);
      console.log(`  Role ID: ${gail.role_id}`);
      console.log(`  Same role as Logan? ${gail.role_id === user.role_id ? 'YES ✅' : 'NO ❌'}`);

      const { data: gailAssignments } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', gail.auth_id);

      console.log(`  Assignments: ${gailAssignments?.length || 0}`);
    }

  } catch (error: any) {
    console.error('\n❌ Failed:', error.message);
    process.exit(1);
  }
}

findSource();
