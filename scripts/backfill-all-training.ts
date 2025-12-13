/**
 * Comprehensive backfill script to assign BOTH role and department training to all existing users
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
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillAllTraining() {
  console.log('🚀 Starting COMPREHENSIVE training backfill (Role + Department)...\n');

  try {
    // 1. Fetch all users
    console.log('📋 Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('auth_id, role_id, department_id, first_name, last_name')
      .not('auth_id', 'is', null);

    if (usersError) throw new Error(`Failed to fetch users: ${usersError.message}`);

    console.log(`✅ Found ${users?.length || 0} users\n`);

    // 2. Fetch all role assignments
    console.log('📋 Fetching role assignments...');
    const { data: roleAssignments, error: roleError } = await supabase
      .from('role_assignments')
      .select('role_id, item_id, type');

    if (roleError) throw new Error(`Failed to fetch role assignments: ${roleError.message}`);
    console.log(`✅ Found ${roleAssignments?.length || 0} role assignments\n`);

    // 3. Fetch all department assignments
    console.log('📋 Fetching department assignments...');
    const { data: deptAssignments, error: deptError } = await supabase
      .from('department_assignments')
      .select('department_id, item_id, type');

    if (deptError) throw new Error(`Failed to fetch department assignments: ${deptError.message}`);
    console.log(`✅ Found ${deptAssignments?.length || 0} department assignments\n`);

    // 4. Fetch roles to get department mappings
    console.log('📋 Fetching role-department mappings...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, department_id');

    if (rolesError) throw new Error(`Failed to fetch roles: ${rolesError.message}`);

    const roleToDept = new Map(roles?.map(r => [r.id, r.department_id]) || []);

    // 5. Group assignments
    const assignmentsByRole = new Map<string, Array<{item_id: string, type: string}>>();
    for (const ra of roleAssignments || []) {
      if (!assignmentsByRole.has(ra.role_id)) {
        assignmentsByRole.set(ra.role_id, []);
      }
      assignmentsByRole.get(ra.role_id)!.push({ item_id: ra.item_id, type: ra.type });
    }

    const assignmentsByDept = new Map<string, Array<{item_id: string, type: string}>>();
    for (const da of deptAssignments || []) {
      if (!assignmentsByDept.has(da.department_id)) {
        assignmentsByDept.set(da.department_id, []);
      }
      assignmentsByDept.get(da.department_id)!.push({ item_id: da.item_id, type: da.type });
    }

    // 6. Fetch existing user assignments
    console.log('📋 Fetching existing user assignments...');
    const { data: existingAssignments, error: existingError } = await supabase
      .from('user_assignments')
      .select('auth_id, item_id, item_type');

    if (existingError) throw new Error(`Failed to fetch existing assignments: ${existingError.message}`);

    const existingSet = new Set(
      (existingAssignments || []).map(a => `${a.auth_id}:${a.item_id}:${a.item_type}`)
    );

    console.log(`✅ Found ${existingAssignments?.length || 0} existing user assignments\n`);

    // 7. Process each user
    let totalCreated = 0;
    let totalSkipped = 0;
    const newAssignments: Array<{
      auth_id: string;
      item_id: string;
      item_type: 'module' | 'document';
      assigned_at: string;
    }> = [];

    console.log('🔄 Processing users...\n');

    for (const user of users || []) {
      const expectedAssignments = new Set<string>();

      // Add role assignments
      if (user.role_id) {
        const roleAssigns = assignmentsByRole.get(user.role_id) || [];
        for (const ra of roleAssigns) {
          expectedAssignments.add(`${ra.item_id}:${ra.type}`);
        }
      }

      // Add department assignments (from role's department)
      if (user.role_id) {
        const deptId = roleToDept.get(user.role_id);
        if (deptId) {
          const deptAssigns = assignmentsByDept.get(deptId) || [];
          for (const da of deptAssigns) {
            expectedAssignments.add(`${da.item_id}:${da.type}`);
          }
        }
      }

      // Also check direct department_id if it exists and differs
      if (user.department_id) {
        const deptAssigns = assignmentsByDept.get(user.department_id) || [];
        for (const da of deptAssigns) {
          expectedAssignments.add(`${da.item_id}:${da.type}`);
        }
      }

      if (expectedAssignments.size === 0) {
        console.log(`⚪ ${user.first_name} ${user.last_name} - No training for role/department`);
        continue;
      }

      // Check what user is missing
      let userCreated = 0;
      let userSkipped = 0;

      for (const assignment of expectedAssignments) {
        const [item_id, type] = assignment.split(':');
        const key = `${user.auth_id}:${item_id}:${type}`;

        if (existingSet.has(key)) {
          userSkipped++;
          totalSkipped++;
        } else {
          newAssignments.push({
            auth_id: user.auth_id,
            item_id,
            item_type: type as 'module' | 'document',
            assigned_at: new Date().toISOString(),
          });
          userCreated++;
          totalCreated++;
        }
      }

      if (userCreated > 0) {
        console.log(`✅ ${user.first_name} ${user.last_name} - ${userCreated} new, ${userSkipped} existing`);
      } else if (userSkipped > 0) {
        console.log(`⚪ ${user.first_name} ${user.last_name} - 0 new, ${userSkipped} existing`);
      }
    }

    // 8. Insert new assignments
    if (newAssignments.length > 0) {
      console.log(`\n📝 Inserting ${newAssignments.length} new assignments...`);

      const batchSize = 100;
      let totalProcessed = 0;

      for (let i = 0; i < newAssignments.length; i += batchSize) {
        const batch = newAssignments.slice(i, i + batchSize);

        const { data, error: insertError } = await supabase
          .from('user_assignments')
          .upsert(batch, {
            onConflict: 'auth_id,item_id,item_type',
            ignoreDuplicates: true
          })
          .select();

        if (insertError) {
          console.error(`❌ Error in batch ${i / batchSize + 1}:`, insertError.message);
        } else {
          const inserted = data?.length || 0;
          totalProcessed += batch.length;
          console.log(`  ✓ Batch ${i / batchSize + 1} of ${Math.ceil(newAssignments.length / batchSize)} - Processed ${batch.length} (${inserted} inserted, ${batch.length - inserted} existed)`);
        }
      }

      console.log(`\n✅ Successfully processed ${totalProcessed} assignments`);
    } else {
      console.log('\n⚪ No new assignments needed - all users have their training!');
    }

    // 9. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${users?.length || 0}`);
    console.log(`New assignments created: ${totalCreated}`);
    console.log(`Existing assignments skipped: ${totalSkipped}`);
    console.log(`Role assignments available: ${roleAssignments?.length || 0}`);
    console.log(`Department assignments available: ${deptAssignments?.length || 0}`);
    console.log('='.repeat(60));
    console.log('\n✅ Backfill completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

backfillAllTraining();
