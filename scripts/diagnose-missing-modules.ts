import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface User {
  auth_id: string;
  first_name: string;
  last_name: string;
  role_id: string | null;
  department_id: string | null;
}

interface RoleInfo {
  id: string;
  title: string;
}

interface ModuleInfo {
  id: string;
  name: string;
}

async function diagnoseModuleInheritance() {
  console.log('🔍 Diagnosing Module Inheritance Issues\n');
  console.log('=' .repeat(80));

  // 1. Get all users with their roles
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('auth_id, first_name, last_name, role_id, department_id')
    .not('auth_id', 'is', null)
    .order('last_name');

  if (usersError || !users) {
    console.error('❌ Error fetching users:', usersError);
    return;
  }

  console.log(`\n📊 Found ${users.length} users with auth_id\n`);

  // 2. Get all roles with their module assignments
  const { data: roleAssignments, error: roleAssError } = await supabase
    .from('role_assignments')
    .select('role_id, item_id, type')
    .eq('type', 'module');

  if (roleAssError) {
    console.error('❌ Error fetching role assignments:', roleAssError);
    return;
  }

  console.log(`📋 Found ${roleAssignments?.length || 0} role-module assignments\n`);

  // 3. Get all roles
  const { data: roles, error: rolesError } = await supabase
    .from('roles')
    .select('id, title');

  if (rolesError || !roles) {
    console.error('❌ Error fetching roles:', rolesError);
    return;
  }

  const roleMap = new Map(roles.map(r => [r.id, r]));

  // 4. Get all modules
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('id, name');

  if (modulesError || !modules) {
    console.error('❌ Error fetching modules:', modulesError);
    return;
  }

  const moduleMap = new Map(modules.map(m => [m.id, m]));

  // 5. Group role assignments by role_id
  const roleModulesMap = new Map<string, string[]>();
  roleAssignments?.forEach(ra => {
    if (!roleModulesMap.has(ra.role_id)) {
      roleModulesMap.set(ra.role_id, []);
    }
    roleModulesMap.get(ra.role_id)!.push(ra.item_id);
  });

  // 6. Check each user
  let usersWithIssues = 0;
  let totalMissingAssignments = 0;

  for (const user of users) {
    const userName = `${user.first_name} ${user.last_name}`;

    if (!user.role_id) {
      console.log(`\n⚠️  User: ${userName} (${user.auth_id})`);
      console.log('   Issue: NO ROLE ASSIGNED');
      console.log('   Fix: Assign a role to this user');
      usersWithIssues++;
      continue;
    }

    const role = roleMap.get(user.role_id);
    const expectedModules = roleModulesMap.get(user.role_id) || [];

    if (expectedModules.length === 0) {
      // Role has no modules assigned - this is OK, skip
      continue;
    }

    // Get user's actual assignments
    const { data: userAssignments, error: userAssError } = await supabase
      .from('user_assignments')
      .select('item_id, item_type')
      .eq('auth_id', user.auth_id)
      .eq('item_type', 'module');

    if (userAssError) {
      console.error(`❌ Error fetching assignments for ${userName}:`, userAssError);
      continue;
    }

    const assignedModuleIds = new Set((userAssignments || []).map(ua => ua.item_id));
    const missingModules = expectedModules.filter(modId => !assignedModuleIds.has(modId));

    if (missingModules.length > 0) {
      console.log(`\n❌ User: ${userName} (${user.auth_id})`);
      console.log(`   Role: ${role?.title || 'Unknown'} (${user.role_id})`);
      console.log(`   Expected: ${expectedModules.length} modules`);
      console.log(`   Has: ${assignedModuleIds.size} modules`);
      console.log(`   Missing: ${missingModules.length} modules`);
      console.log('   Missing modules:');
      missingModules.forEach(modId => {
        const module = moduleMap.get(modId);
        console.log(`     - ${module?.name || 'Unknown'} (${modId})`);
      });

      usersWithIssues++;
      totalMissingAssignments += missingModules.length;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('\n📊 SUMMARY');
  console.log('─'.repeat(80));
  console.log(`Total users checked: ${users.length}`);
  console.log(`Users with missing modules: ${usersWithIssues}`);
  console.log(`Total missing assignments: ${totalMissingAssignments}`);

  if (usersWithIssues === 0) {
    console.log('\n✅ All users have the correct module assignments from their roles!');
  } else {
    console.log('\n⚠️  Some users are missing module assignments');
    console.log('\nRecommended Fix:');
    console.log('Run the backfill script to fix existing users:');
    console.log('  npx tsx scripts/backfill-all-training.ts');
  }

  // 7. Check if triggers exist
  console.log('\n' + '='.repeat(80));
  console.log('\n🔧 CHECKING DATABASE TRIGGERS');
  console.log('─'.repeat(80));

  const { data: triggers, error: triggersError } = await supabase.rpc('get_triggers_info' as any);

  if (!triggersError && triggers) {
    console.log('✅ Trigger check query successful');
  } else {
    console.log('ℹ️  Cannot verify triggers via RPC (this is normal)');
    console.log('   To verify triggers, check Supabase Dashboard → Database → Triggers');
    console.log('   Expected triggers:');
    console.log('   - sync_role_training_to_user (on users INSERT/UPDATE)');
    console.log('   - sync_new_role_assignment_to_users (on role_assignments INSERT)');
  }

  console.log('\n' + '='.repeat(80));
}

diagnoseModuleInheritance()
  .then(() => {
    console.log('\n✅ Diagnosis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
