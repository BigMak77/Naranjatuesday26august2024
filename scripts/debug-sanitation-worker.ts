/**
 * Debug script to investigate Sanitation Worker training inconsistency
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

async function debug() {
  console.log('🔍 DEBUGGING SANITATION WORKER ROLE\n');

  try {
    // 1. Find Sanitation Worker role
    const { data: roles } = await supabase
      .from('roles')
      .select('id, title, department_id, departments(id, name)')
      .ilike('title', '%sanitation%');

    console.log('📋 Sanitation Worker Roles Found:', roles?.length);
    if (roles && roles.length > 0) {
      console.log(JSON.stringify(roles, null, 2));
    }

    const sanitationRole = roles?.[0];
    if (!sanitationRole) {
      console.log('❌ No Sanitation Worker role found!');
      return;
    }

    console.log(`\n✅ Found role: ${sanitationRole.title} (ID: ${sanitationRole.id})`);
    console.log(`   Department: ${(sanitationRole as any).departments?.name}\n`);

    // 2. Check role_assignments
    const { data: roleAssignments } = await supabase
      .from('role_assignments')
      .select('*, modules(name), documents(title)')
      .eq('role_id', sanitationRole.id);

    console.log('📚 Role Assignments:');
    console.log(`   Total: ${roleAssignments?.length || 0}`);
    if (roleAssignments && roleAssignments.length > 0) {
      roleAssignments.forEach(ra => {
        const name = (ra as any).modules?.name || (ra as any).documents?.title || 'Unknown';
        console.log(`   - ${ra.type}: ${name} (${ra.item_id})`);
      });
    } else {
      console.log('   ⚠️  NO TRAINING ASSIGNED TO THIS ROLE!\n');
    }

    // 3. Check department_assignments
    const deptId = sanitationRole.department_id;
    const { data: deptAssignments } = await supabase
      .from('department_assignments')
      .select('*, modules(name), documents(title)')
      .eq('department_id', deptId);

    console.log('\n📚 Department Assignments:');
    console.log(`   Total: ${deptAssignments?.length || 0}`);
    if (deptAssignments && deptAssignments.length > 0) {
      deptAssignments.forEach(da => {
        const name = (da as any).modules?.name || (da as any).documents?.title || 'Unknown';
        console.log(`   - ${da.type}: ${name} (${da.item_id})`);
      });
    } else {
      console.log('   ⚠️  NO TRAINING ASSIGNED TO THIS DEPARTMENT!\n');
    }

    // 4. Get specific users from the screenshot
    const userNames = ['Logan Smith', 'John McHugh', 'Gail Cue', 'Violet Gonzalez'];

    console.log('\n👥 Checking specific users from screenshot:\n');

    for (const name of userNames) {
      const [firstName, lastName] = name.split(' ');

      const { data: users } = await supabase
        .from('users')
        .select('auth_id, first_name, last_name, role_id, roles(title)')
        .eq('first_name', firstName)
        .eq('last_name', lastName);

      if (!users || users.length === 0) {
        console.log(`❌ ${name}: Not found`);
        continue;
      }

      const user = users[0];
      const roleName = (user as any).roles?.title || 'Unknown';

      // Get their assignments
      const { data: userAssignments } = await supabase
        .from('user_assignments')
        .select('item_id, item_type, completed_at')
        .eq('auth_id', user.auth_id);

      console.log(`📌 ${name}:`);
      console.log(`   Role: ${roleName}`);
      console.log(`   Role ID: ${user.role_id}`);
      console.log(`   Assignments: ${userAssignments?.length || 0}`);

      if (user.role_id === sanitationRole.id) {
        console.log(`   ✅ In Sanitation Worker role`);
      } else {
        console.log(`   ❌ NOT in Sanitation Worker role (role_id: ${user.role_id})`);
      }

      if (userAssignments && userAssignments.length > 0) {
        userAssignments.slice(0, 3).forEach(ua => {
          console.log(`     - ${ua.item_type}: ${ua.item_id.substring(0, 8)}... ${ua.completed_at ? '✅' : '⏳'}`);
        });
      }
      console.log();
    }

    // 5. Check ALL users with Sanitation Worker role
    const { data: allSanitationUsers } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('role_id', sanitationRole.id)
      .not('auth_id', 'is', null)
      .limit(20);

    console.log(`\n📊 Total Sanitation Workers: ${allSanitationUsers?.length || 0}`);

    if (allSanitationUsers && allSanitationUsers.length > 0) {
      console.log('\nChecking assignment counts for each:\n');

      for (const user of allSanitationUsers.slice(0, 10)) {
        const { data: assignments } = await supabase
          .from('user_assignments')
          .select('item_id')
          .eq('auth_id', user.auth_id);

        console.log(`   ${user.first_name} ${user.last_name}: ${assignments?.length || 0} assignments`);
      }
    }

  } catch (error: any) {
    console.error('\n❌ Debug failed:', error.message);
    process.exit(1);
  }
}

debug();
