/**
 * Find why some Sanitation Workers have training when role has none assigned
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

async function investigate() {
  console.log('🔍 INVESTIGATING MYSTERY TRAINING\n');

  try {
    // Get Sanitation Worker role ID
    const { data: roles } = await supabase
      .from('roles')
      .select('id, title')
      .ilike('title', '%sanitation%')
      .single();

    if (!roles) {
      console.log('Role not found');
      return;
    }

    console.log(`Role: ${roles.title} (${roles.id})\n`);

    // Get ALL Sanitation Workers
    const { data: sanitationWorkers } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('role_id', roles.id)
      .not('auth_id', 'is', null);

    console.log(`Found ${sanitationWorkers?.length} Sanitation Workers\n`);

    // Check each one's assignments
    const usersWithTraining: any[] = [];
    const usersWithoutTraining: any[] = [];

    for (const user of sanitationWorkers || []) {
      const { data: assignments } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', user.auth_id);

      if (assignments && assignments.length > 0) {
        usersWithTraining.push({ ...user, assignmentCount: assignments.length, assignments });
      } else {
        usersWithoutTraining.push(user);
      }
    }

    console.log(`Users WITH training: ${usersWithTraining.length}`);
    console.log(`Users WITHOUT training: ${usersWithoutTraining.length}\n`);

    // Analyze the first user WITH training
    if (usersWithTraining.length > 0) {
      const userWithTraining = usersWithTraining[0];
      console.log('─'.repeat(80));
      console.log(`\n📌 Analyzing: ${userWithTraining.first_name} ${userWithTraining.last_name} (${userWithTraining.assignmentCount} assignments)\n`);

      for (const assignment of userWithTraining.assignments.slice(0, 5)) {
        // Get module/document name
        let itemName = 'Unknown';
        if (assignment.item_type === 'module') {
          const { data: module } = await supabase
            .from('modules')
            .select('name')
            .eq('id', assignment.item_id)
            .single();
          itemName = module?.name || 'Unknown Module';
        } else {
          const { data: doc } = await supabase
            .from('documents')
            .select('title')
            .eq('id', assignment.item_id)
            .single();
          itemName = doc?.title || 'Unknown Document';
        }

        console.log(`  ${assignment.item_type}: ${itemName}`);

        // Check if in role_assignments (for ANY role)
        const { data: roleAssignments } = await supabase
          .from('role_assignments')
          .select('role_id, roles(title)')
          .eq('item_id', assignment.item_id)
          .eq('type', assignment.item_type);

        if (roleAssignments && roleAssignments.length > 0) {
          console.log(`    ✅ Found in role_assignments:`);
          for (const ra of roleAssignments) {
            console.log(`       - Role: ${(ra as any).roles?.title || 'Unknown'} (${ra.role_id})`);
          }
        }

        // Check if in department_assignments (for ANY department)
        const { data: deptAssignments } = await supabase
          .from('department_assignments')
          .select('department_id, departments(name)')
          .eq('item_id', assignment.item_id)
          .eq('type', assignment.item_type);

        if (deptAssignments && deptAssignments.length > 0) {
          console.log(`    ✅ Found in department_assignments:`);
          for (const da of deptAssignments) {
            console.log(`       - Dept: ${(da as any).departments?.name || 'Unknown'} (${da.department_id})`);
          }
        }

        if ((!roleAssignments || roleAssignments.length === 0) &&
            (!deptAssignments || deptAssignments.length === 0)) {
          console.log(`    ⚠️  NOT in role_assignments or department_assignments!`);
          console.log(`    🔍 This is ORPHANED/MANUAL data`);
        }

        console.log();
      }

      // Check user's PREVIOUS roles (role history)
      console.log('\n🕒 Checking user role history...\n');

      const { data: roleHistory } = await supabase
        .from('user_role_history')
        .select('*, old_roles:roles!user_role_history_old_role_id_fkey(title), new_roles:roles!user_role_history_new_role_id_fkey(title)')
        .eq('user_id', (await supabase
          .from('users')
          .select('id')
          .eq('auth_id', userWithTraining.auth_id)
          .single()
        ).data?.id)
        .order('changed_at', { ascending: false })
        .limit(5);

      if (roleHistory && roleHistory.length > 0) {
        console.log(`  Found ${roleHistory.length} role changes:\n`);
        for (const change of roleHistory) {
          console.log(`  ${change.changed_at}:`);
          console.log(`    From: ${(change as any).old_roles?.title || 'N/A'}`);
          console.log(`    To: ${(change as any).new_roles?.title || 'N/A'}`);
          console.log(`    Reason: ${change.change_reason}`);
          console.log();

          // Check if old role had this training
          if (change.old_role_id) {
            const { data: oldRoleAssignments } = await supabase
              .from('role_assignments')
              .select('item_id, type')
              .eq('role_id', change.old_role_id);

            if (oldRoleAssignments && oldRoleAssignments.length > 0) {
              console.log(`    Old role had ${oldRoleAssignments.length} training assignments`);

              // Check if user still has these
              const oldAssignmentIds = new Set(oldRoleAssignments.map(ra => `${ra.item_id}:${ra.type}`));
              const userAssignmentIds = new Set(userWithTraining.assignments.map((a: any) => `${a.item_id}:${a.item_type}`));

              const overlap = Array.from(oldAssignmentIds).filter(id => userAssignmentIds.has(id));
              if (overlap.length > 0) {
                console.log(`    🔍 User STILL HAS ${overlap.length} assignments from old role!`);
                console.log(`    💡 FOUND IT: Training persisted from previous role\n`);
              }
            }
          }
        }
      } else {
        console.log('  No role history found - user never changed roles\n');
      }
    }

    console.log('='.repeat(80));
    console.log('\n📊 SUMMARY\n');
    console.log(`Users with training likely got it from:`);
    console.log(`  1. Previous role assignments (before changing to Sanitation Worker)`);
    console.log(`  2. Manual assignments`);
    console.log(`  3. Department assignments from a different department\n`);
    console.log(`Users without training: Correct - Sanitation Worker role has no training\n`);

  } catch (error: any) {
    console.error('\n❌ Investigation failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

investigate();
