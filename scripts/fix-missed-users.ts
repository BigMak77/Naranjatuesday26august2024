import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface MissedUser {
  auth_id: string;
  first_name: string;
  last_name: string;
  department_id: string;
  role_id: string | null;
  missingModules: string[];
}

async function fixMissedUsers() {
  console.log('🔧 FIXING USERS WITH MISSED MODULE INHERITANCE\n');
  console.log('=' .repeat(80));

  const missedUsers: MissedUser[] = [];

  // 1. Get department assignments
  const { data: deptAssignments } = await supabase
    .from('department_assignments')
    .select('department_id, item_id, type')
    .eq('type', 'module');

  if (!deptAssignments || deptAssignments.length === 0) {
    console.log('No department assignments found');
    return;
  }

  // Group by department_id
  const deptModulesMap = new Map<string, string[]>();
  deptAssignments.forEach(da => {
    if (!deptModulesMap.has(da.department_id)) {
      deptModulesMap.set(da.department_id, []);
    }
    deptModulesMap.get(da.department_id)!.push(da.item_id);
  });

  // 2. Check each department
  for (const [deptId, expectedModuleIds] of deptModulesMap.entries()) {
    // Get all users in this department
    const { data: usersInDept } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name, department_id, role_id')
      .eq('department_id', deptId)
      .not('auth_id', 'is', null);

    if (!usersInDept || usersInDept.length === 0) {
      continue;
    }

    // Check each user
    for (const user of usersInDept) {
      // Get user's actual module assignments
      const { data: userAssignments } = await supabase
        .from('user_assignments')
        .select('item_id, item_type')
        .eq('auth_id', user.auth_id)
        .eq('item_type', 'module');

      const assignedModuleIds = new Set(userAssignments?.map(ua => ua.item_id) || []);

      // Find missing modules
      const missingModuleIds = expectedModuleIds.filter(mid => !assignedModuleIds.has(mid));

      if (missingModuleIds.length > 0) {
        missedUsers.push({
          auth_id: user.auth_id,
          first_name: user.first_name,
          last_name: user.last_name,
          department_id: user.department_id,
          role_id: user.role_id,
          missingModules: missingModuleIds
        });
      }
    }
  }

  // 3. Also check role assignments
  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('role_id, item_id, type')
    .eq('type', 'module');

  if (roleAssignments && roleAssignments.length > 0) {
    const roleModulesMap = new Map<string, string[]>();
    roleAssignments.forEach(ra => {
      if (!roleModulesMap.has(ra.role_id)) {
        roleModulesMap.set(ra.role_id, []);
      }
      roleModulesMap.get(ra.role_id)!.push(ra.item_id);
    });

    for (const [roleId, expectedModuleIds] of roleModulesMap.entries()) {
      const { data: usersInRole } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, department_id, role_id')
        .eq('role_id', roleId)
        .not('auth_id', 'is', null);

      if (!usersInRole || usersInRole.length === 0) {
        continue;
      }

      for (const user of usersInRole) {
        const { data: userAssignments } = await supabase
          .from('user_assignments')
          .select('item_id, item_type')
          .eq('auth_id', user.auth_id)
          .eq('item_type', 'module');

        const assignedModuleIds = new Set(userAssignments?.map(ua => ua.item_id) || []);
        const missingModuleIds = expectedModuleIds.filter(mid => !assignedModuleIds.has(mid));

        if (missingModuleIds.length > 0) {
          // Check if user already in list
          const existingUser = missedUsers.find(u => u.auth_id === user.auth_id);
          if (existingUser) {
            // Add missing modules to existing entry
            existingUser.missingModules.push(...missingModuleIds);
          } else {
            missedUsers.push({
              auth_id: user.auth_id,
              first_name: user.first_name,
              last_name: user.last_name,
              department_id: user.department_id,
              role_id: user.role_id,
              missingModules: missingModuleIds
            });
          }
        }
      }
    }
  }

  console.log(`\n📊 Found ${missedUsers.length} users with missing module assignments\n`);

  if (missedUsers.length === 0) {
    console.log('✅ No users need fixing!');
    return;
  }

  // Get module info for display
  const { data: modules } = await supabase
    .from('modules')
    .select('id, name, ref_code');

  const moduleMap = new Map(modules?.map(m => [m.id, m]) || []);

  // 4. Fix each user
  console.log('='.repeat(80));
  console.log('FIXING USERS');
  console.log('='.repeat(80));

  let totalFixed = 0;
  let totalAssignmentsCreated = 0;

  for (const user of missedUsers) {
    const userName = `${user.first_name} ${user.last_name}`;

    // Deduplicate missing modules
    const uniqueMissingModules = Array.from(new Set(user.missingModules));

    console.log(`\n👤 ${userName} (${user.auth_id})`);
    console.log(`   Missing ${uniqueMissingModules.length} modules:`);

    uniqueMissingModules.forEach(mid => {
      const module = moduleMap.get(mid);
      console.log(`     - ${module?.name || 'Unknown'} (${module?.ref_code || 'no ref'})`);
    });

    // Create assignments
    const assignmentsToCreate = uniqueMissingModules.map(moduleId => ({
      auth_id: user.auth_id,
      item_id: moduleId,
      item_type: 'module',
      assigned_at: new Date().toISOString(),
      completed_at: null
    }));

    const { data: insertedData, error: insertError } = await supabase
      .from('user_assignments')
      .insert(assignmentsToCreate)
      .select();

    if (insertError) {
      console.log(`   ❌ Error: ${insertError.message}`);
      if (insertError.code === '23505') {
        console.log(`   (Assignments may already exist - checking...)`);

        // Verify assignments exist
        const { data: existing } = await supabase
          .from('user_assignments')
          .select('item_id')
          .eq('auth_id', user.auth_id)
          .in('item_id', uniqueMissingModules);

        if (existing && existing.length === uniqueMissingModules.length) {
          console.log(`   ✅ All assignments already exist - skipping`);
          totalFixed++;
        }
      }
    } else {
      console.log(`   ✅ Created ${insertedData?.length || 0} assignments`);
      totalFixed++;
      totalAssignmentsCreated += (insertedData?.length || 0);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n✅ Fixed ${totalFixed} users`);
  console.log(`✅ Created ${totalAssignmentsCreated} new assignments`);

  // 5. Verify the fix
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION');
  console.log('='.repeat(80));

  let stillMissing = 0;

  for (const user of missedUsers) {
    const { data: userAssignments } = await supabase
      .from('user_assignments')
      .select('item_id')
      .eq('auth_id', user.auth_id)
      .eq('item_type', 'module');

    const assignedModuleIds = new Set(userAssignments?.map(ua => ua.item_id) || []);
    const uniqueMissingModules = Array.from(new Set(user.missingModules));
    const stillMissingModules = uniqueMissingModules.filter(mid => !assignedModuleIds.has(mid));

    if (stillMissingModules.length > 0) {
      console.log(`\n⚠️  ${user.first_name} ${user.last_name} still missing ${stillMissingModules.length} modules`);
      stillMissing++;
    }
  }

  if (stillMissing === 0) {
    console.log('\n✅ All users have been successfully fixed!');
  } else {
    console.log(`\n⚠️  ${stillMissing} users still have issues`);
  }

  console.log('\n' + '='.repeat(80));
}

fixMissedUsers()
  .then(() => {
    console.log('\n✅ Fix complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
