/**
 * Backfill script to assign role-based training to all existing users
 * Run this after applying the role training sync migration
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface User {
  auth_id: string;
  role_id: string;
  first_name: string;
  last_name: string;
}

interface RoleAssignment {
  role_id: string;
  item_id: string;
  type: 'module' | 'document';
}

interface UserAssignment {
  auth_id: string;
  item_id: string;
  item_type: 'module' | 'document';
}

async function backfillRoleTraining() {
  console.log('🚀 Starting role training backfill...\n');

  try {
    // 1. Fetch all users with valid auth_id and role_id
    console.log('📋 Fetching users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('auth_id, role_id, first_name, last_name')
      .not('auth_id', 'is', null)
      .not('role_id', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`✅ Found ${users?.length || 0} users with roles\n`);

    if (!users || users.length === 0) {
      console.log('⚠️  No users to process');
      return;
    }

    // 2. Fetch all role assignments
    console.log('📋 Fetching role assignments...');
    const { data: roleAssignments, error: roleAssignmentsError } = await supabase
      .from('role_assignments')
      .select('role_id, item_id, type');

    if (roleAssignmentsError) {
      throw new Error(`Failed to fetch role assignments: ${roleAssignmentsError.message}`);
    }

    console.log(`✅ Found ${roleAssignments?.length || 0} role assignments\n`);

    if (!roleAssignments || roleAssignments.length === 0) {
      console.log('⚠️  No role assignments to process');
      return;
    }

    // 3. Group role assignments by role_id
    const assignmentsByRole = new Map<string, RoleAssignment[]>();
    for (const assignment of roleAssignments) {
      if (!assignmentsByRole.has(assignment.role_id)) {
        assignmentsByRole.set(assignment.role_id, []);
      }
      assignmentsByRole.get(assignment.role_id)!.push(assignment);
    }

    // 4. Fetch existing user assignments to avoid duplicates
    console.log('📋 Fetching existing user assignments...');
    const { data: existingAssignments, error: existingError } = await supabase
      .from('user_assignments')
      .select('auth_id, item_id, item_type');

    if (existingError) {
      throw new Error(`Failed to fetch existing assignments: ${existingError.message}`);
    }

    // Create a Set for quick lookup of existing assignments
    const existingSet = new Set(
      (existingAssignments || []).map(
        (a: UserAssignment) => `${a.auth_id}:${a.item_id}:${a.item_type}`
      )
    );

    console.log(`✅ Found ${existingAssignments?.length || 0} existing user assignments\n`);

    // 5. Process each user and create missing assignments
    let totalCreated = 0;
    let totalSkipped = 0;
    const newAssignments: Array<{
      auth_id: string;
      item_id: string;
      item_type: 'module' | 'document';
      assigned_at: string;
    }> = [];

    console.log('🔄 Processing users...\n');

    for (const user of users as User[]) {
      const roleAssignmentsForUser = assignmentsByRole.get(user.role_id) || [];

      if (roleAssignmentsForUser.length === 0) {
        console.log(`⚠️  ${user.first_name} ${user.last_name} - No training for role`);
        continue;
      }

      let userCreated = 0;
      let userSkipped = 0;

      for (const assignment of roleAssignmentsForUser) {
        const key = `${user.auth_id}:${assignment.item_id}:${assignment.type}`;

        if (existingSet.has(key)) {
          userSkipped++;
          totalSkipped++;
        } else {
          newAssignments.push({
            auth_id: user.auth_id,
            item_id: assignment.item_id,
            item_type: assignment.type,
            assigned_at: new Date().toISOString(),
          });
          userCreated++;
          totalCreated++;
        }
      }

      console.log(
        `${userCreated > 0 ? '✅' : '⚪'} ${user.first_name} ${user.last_name} - ` +
        `${userCreated} new, ${userSkipped} existing`
      );
    }

    // 6. Insert new assignments in batches
    if (newAssignments.length > 0) {
      console.log(`\n📝 Inserting ${newAssignments.length} new assignments...`);

      const batchSize = 100;
      let totalProcessed = 0;

      for (let i = 0; i < newAssignments.length; i += batchSize) {
        const batch = newAssignments.slice(i, i + batchSize);

        // Use upsert with onConflict to handle duplicates gracefully
        const { data, error: insertError } = await supabase
          .from('user_assignments')
          .upsert(batch, {
            onConflict: 'auth_id,item_id,item_type',
            ignoreDuplicates: true
          })
          .select();

        if (insertError) {
          console.error(`❌ Error in batch ${i / batchSize + 1}:`, insertError.message);
          // Continue with next batch instead of failing completely
        } else {
          const inserted = data?.length || 0;
          totalProcessed += batch.length;
          console.log(`  ✓ Batch ${i / batchSize + 1} of ${Math.ceil(newAssignments.length / batchSize)} - Processed ${batch.length} (${inserted} inserted, ${batch.length - inserted} existed)`);
        }
      }

      console.log(`\n✅ Successfully processed ${totalProcessed} assignments`);
    } else {
      console.log('\n⚪ No new assignments needed - all users already have their role training!');
    }

    // 7. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BACKFILL SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total users processed: ${users.length}`);
    console.log(`New assignments created: ${totalCreated}`);
    console.log(`Existing assignments skipped: ${totalSkipped}`);
    console.log('='.repeat(60));
    console.log('\n✅ Backfill completed successfully!\n');

  } catch (error: any) {
    console.error('\n❌ Backfill failed:', error.message);
    process.exit(1);
  }
}

// Run the backfill
backfillRoleTraining();
