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

async function findMissedUsers() {
  console.log('🔍 FINDING USERS WHO MISSED MODULE INHERITANCE\n');
  console.log('=' .repeat(80));

  // 1. Get all role assignments (what modules should be assigned to roles)
  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('role_id, item_id, type')
    .eq('type', 'module');

  console.log(`\n📋 Found ${roleAssignments?.length || 0} role-module assignments\n`);

  if (!roleAssignments || roleAssignments.length === 0) {
    console.log('⚠️  No role-module assignments found. Nothing to check.');
    return;
  }

  // 2. Group by role_id
  const roleModulesMap = new Map<string, string[]>();
  roleAssignments.forEach(ra => {
    if (!roleModulesMap.has(ra.role_id)) {
      roleModulesMap.set(ra.role_id, []);
    }
    roleModulesMap.get(ra.role_id)!.push(ra.item_id);
  });

  // 3. Get all roles
  const { data: roles } = await supabase
    .from('roles')
    .select('id, title');

  const roleMap = new Map(roles?.map(r => [r.id, r.title]) || []);

  // 4. Get all modules
  const { data: modules } = await supabase
    .from('modules')
    .select('id, name, ref_code');

  const moduleMap = new Map(modules?.map(m => [m.id, m]) || []);

  console.log('Checking each role that has module assignments...\n');
  console.log('='.repeat(80));

  let totalMissedUsers = 0;
  let totalMissedAssignments = 0;

  // 5. For each role with modules, check all users
  for (const [roleId, expectedModuleIds] of roleModulesMap.entries()) {
    const roleName = roleMap.get(roleId) || 'Unknown Role';

    console.log(`\n👔 Role: ${roleName}`);
    console.log(`   Expected modules: ${expectedModuleIds.length}`);

    // Get all users with this role
    const { data: usersInRole } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('role_id', roleId)
      .not('auth_id', 'is', null);

    if (!usersInRole || usersInRole.length === 0) {
      console.log(`   ✅ No users in this role`);
      continue;
    }

    console.log(`   Users in role: ${usersInRole.length}`);

    let missedInThisRole = 0;

    // Check each user
    for (const user of usersInRole) {
      const userName = `${user.first_name} ${user.last_name}`;

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
        console.log(`\n   ❌ ${userName} (${user.auth_id})`);
        console.log(`      Expected: ${expectedModuleIds.length} modules`);
        console.log(`      Has: ${assignedModuleIds.size} modules`);
        console.log(`      Missing: ${missingModuleIds.length} modules`);

        missingModuleIds.forEach(mid => {
          const module = moduleMap.get(mid);
          console.log(`        - ${module?.name || 'Unknown'} (${module?.ref_code || 'no ref'})`);
        });

        missedInThisRole++;
        totalMissedAssignments += missingModuleIds.length;
      }
    }

    if (missedInThisRole === 0) {
      console.log(`   ✅ All ${usersInRole.length} users have correct assignments`);
    } else {
      console.log(`\n   ⚠️  ${missedInThisRole} out of ${usersInRole.length} users are missing modules`);
      totalMissedUsers += missedInThisRole;
    }

    console.log('   ' + '─'.repeat(76));
  }

  // 6. Check department assignments too
  console.log('\n\n' + '='.repeat(80));
  console.log('CHECKING DEPARTMENT-LEVEL ASSIGNMENTS');
  console.log('='.repeat(80));

  const { data: deptAssignments } = await supabase
    .from('department_assignments')
    .select('department_id, item_id, type')
    .eq('type', 'module');

  console.log(`\n📋 Found ${deptAssignments?.length || 0} department-module assignments\n`);

  if (deptAssignments && deptAssignments.length > 0) {
    // Group by department_id
    const deptModulesMap = new Map<string, string[]>();
    deptAssignments.forEach(da => {
      if (!deptModulesMap.has(da.department_id)) {
        deptModulesMap.set(da.department_id, []);
      }
      deptModulesMap.get(da.department_id)!.push(da.item_id);
    });

    // Get departments
    const { data: departments } = await supabase
      .from('departments')
      .select('id, name');

    const deptMap = new Map(departments?.map(d => [d.id, d.name]) || []);

    let deptMissedUsers = 0;
    let deptMissedAssignments = 0;

    // Check each department
    for (const [deptId, expectedModuleIds] of deptModulesMap.entries()) {
      const deptName = deptMap.get(deptId) || 'Unknown Department';

      console.log(`\n🏢 Department: ${deptName}`);
      console.log(`   Expected modules: ${expectedModuleIds.length}`);

      // Get all users in this department
      const { data: usersInDept } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name')
        .eq('department_id', deptId)
        .not('auth_id', 'is', null);

      if (!usersInDept || usersInDept.length === 0) {
        console.log(`   ✅ No users in this department`);
        continue;
      }

      console.log(`   Users in department: ${usersInDept.length}`);

      let missedInThisDept = 0;

      // Check each user
      for (const user of usersInDept) {
        const userName = `${user.first_name} ${user.last_name}`;

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
          console.log(`\n   ❌ ${userName} (${user.auth_id})`);
          console.log(`      Expected: ${expectedModuleIds.length} modules`);
          console.log(`      Has: ${assignedModuleIds.size} modules`);
          console.log(`      Missing: ${missingModuleIds.length} modules`);

          missingModuleIds.slice(0, 5).forEach(mid => {
            const module = moduleMap.get(mid);
            console.log(`        - ${module?.name || 'Unknown'} (${module?.ref_code || 'no ref'})`);
          });

          if (missingModuleIds.length > 5) {
            console.log(`        ... and ${missingModuleIds.length - 5} more`);
          }

          missedInThisDept++;
          deptMissedAssignments += missingModuleIds.length;
        }
      }

      if (missedInThisDept === 0) {
        console.log(`   ✅ All ${usersInDept.length} users have correct assignments`);
      } else {
        console.log(`\n   ⚠️  ${missedInThisDept} out of ${usersInDept.length} users are missing modules`);
        deptMissedUsers += missedInThisDept;
      }

      console.log('   ' + '─'.repeat(76));
    }

    totalMissedUsers += deptMissedUsers;
    totalMissedAssignments += deptMissedAssignments;
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));

  console.log(`\n📊 Total users missing module assignments: ${totalMissedUsers}`);
  console.log(`📊 Total missing assignments: ${totalMissedAssignments}`);

  if (totalMissedUsers === 0) {
    console.log('\n✅ All users have correct module assignments!');
  } else {
    console.log('\n⚠️  Some users are missing module assignments that should be inherited');
    console.log('\n💡 SOLUTION:');
    console.log('   Run the backfill script to fix these users:');
    console.log('   npx tsx scripts/backfill-all-training.ts');
  }

  console.log('\n' + '='.repeat(80));
}

findMissedUsers()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
