/**
 * Diagnostic script to identify why users with same role/department have different training
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnose() {
  console.log('🔍 DIAGNOSING TRAINING ASSIGNMENT INCONSISTENCIES\n');
  console.log('='.repeat(80));

  try {
    // 1. Pick a role with users and check consistency
    console.log('\n📋 Step 1: Finding roles with multiple users...\n');

    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name, role_id, department_id')
      .not('auth_id', 'is', null)
      .not('role_id', 'is', null)
      .limit(500);

    // Get roles and departments separately
    const { data: roles } = await supabase
      .from('roles')
      .select('id, title, department_id');

    const { data: departments } = await supabase
      .from('departments')
      .select('id, name');

    const rolesMap = new Map(roles?.map(r => [r.id, r]) || []);
    const deptsMap = new Map(departments?.map(d => [d.id, d]) || []);

    if (usersError) throw usersError;

    // Group users by role
    const usersByRole = new Map<string, any[]>();
    for (const user of users || []) {
      if (!user.role_id) continue;
      if (!usersByRole.has(user.role_id)) {
        usersByRole.set(user.role_id, []);
      }
      usersByRole.get(user.role_id)!.push(user);
    }

    // Find roles with multiple users
    const rolesWithMultipleUsers = Array.from(usersByRole.entries())
      .filter(([_, users]) => users.length >= 2)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 5);

    console.log(`Found ${rolesWithMultipleUsers.length} roles with multiple users\n`);

    // 2. Check each role for inconsistencies
    for (const [roleId, roleUsers] of rolesWithMultipleUsers) {
      const role = rolesMap.get(roleId);
      const dept = role ? deptsMap.get(role.department_id) : null;
      const roleName = role?.title || 'Unknown Role';
      const deptName = dept?.name || 'Unknown Dept';
      const deptId = role?.department_id;

      console.log('─'.repeat(80));
      console.log(`\n🔍 Analyzing Role: "${roleName}" (Department: "${deptName}")`);
      console.log(`   Users in this role: ${roleUsers.length}\n`);

      // Get role assignments
      const { data: roleAssignments, error: roleAssignError } = await supabase
        .from('role_assignments')
        .select('item_id, type')
        .eq('role_id', roleId);

      if (roleAssignError) {
        console.error('   ❌ Error fetching role assignments:', roleAssignError);
        continue;
      }

      console.log(`   📚 Training assigned to this role: ${roleAssignments?.length || 0} items`);

      if (!roleAssignments || roleAssignments.length === 0) {
        console.log('   ⚠️  This role has NO training assigned\n');
        continue;
      }

      // Get department assignments
      const { data: deptAssignments } = await supabase
        .from('department_assignments')
        .select('item_id, type')
        .eq('department_id', deptId);

      console.log(`   📚 Training assigned to department: ${deptAssignments?.length || 0} items`);

      // Create set of expected assignments
      const expectedAssignments = new Set<string>();
      for (const ra of roleAssignments) {
        expectedAssignments.add(`${ra.item_id}:${ra.type}`);
      }
      for (const da of deptAssignments || []) {
        expectedAssignments.add(`${da.item_id}:${da.type}`);
      }

      console.log(`   📊 Total expected unique assignments: ${expectedAssignments.size}\n`);

      // Check each user's assignments
      let inconsistenciesFound = false;

      for (const user of roleUsers.slice(0, 10)) { // Check first 10 users
        const { data: userAssignments } = await supabase
          .from('user_assignments')
          .select('item_id, item_type')
          .eq('auth_id', user.auth_id);

        const userAssignmentSet = new Set(
          (userAssignments || []).map(a => `${a.item_id}:${a.item_type}`)
        );

        const missing = Array.from(expectedAssignments).filter(
          expected => !userAssignmentSet.has(expected)
        );

        if (missing.length > 0) {
          inconsistenciesFound = true;
          console.log(`   ❌ ${user.first_name} ${user.last_name}:`);
          console.log(`      Has: ${userAssignments?.length || 0} assignments`);
          console.log(`      Missing: ${missing.length} expected assignments`);
          console.log(`      Missing items:`, missing.slice(0, 3));
        } else {
          console.log(`   ✅ ${user.first_name} ${user.last_name}: Has all ${expectedAssignments.size} expected assignments`);
        }
      }

      if (!inconsistenciesFound) {
        console.log(`   ✅ All users in this role have consistent training!\n`);
      } else {
        console.log(`   ⚠️  INCONSISTENCY DETECTED in this role!\n`);
      }
    }

    // 3. Check if triggers exist
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 Step 2: Checking if database triggers exist...\n');

    const { data: triggers, error: triggersError } = await supabase
      .rpc('get_triggers', {})
      .select('*')
      .catch(() => ({ data: null, error: 'RPC not available' }));

    // Alternative check using direct query
    const triggerCheckQuery = `
      SELECT
        trigger_name,
        event_object_table as table_name,
        action_timing,
        event_manipulation as event
      FROM information_schema.triggers
      WHERE trigger_name IN (
        'trigger_sync_role_training_on_insert',
        'trigger_sync_role_training_on_update',
        'trigger_sync_new_role_assignment',
        'trigger_sync_department_training_on_insert',
        'trigger_sync_department_training_on_update',
        'trigger_sync_new_department_assignment'
      )
      ORDER BY trigger_name;
    `;

    console.log('   Checking for role and department training triggers...');
    console.log('   (This would require a database query via SQL editor)\n');

    // 4. Summary
    console.log('='.repeat(80));
    console.log('\n📊 DIAGNOSIS SUMMARY\n');
    console.log('Next steps:');
    console.log('1. If inconsistencies found: Users are missing role/department training');
    console.log('2. Check if triggers exist in database (via Supabase dashboard)');
    console.log('3. If triggers exist but assignments missing: Re-run backfill');
    console.log('4. If triggers don\'t exist: Migration may not have applied correctly');
    console.log('\n');

  } catch (error: any) {
    console.error('\n❌ Diagnosis failed:', error.message);
    process.exit(1);
  }
}

diagnose();
