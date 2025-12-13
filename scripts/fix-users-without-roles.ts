/**
 * Fix users without roles in Mixing & Material Prep department
 * These users should be assigned the "Mixer" role
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

async function fixUsersWithoutRoles() {
  console.log('🔧 FIXING USERS WITHOUT ROLES\n');

  try {
    // 1. Get the Mixer role ID for Mixing & Material Prep department
    console.log('📋 Finding Mixer role...');
    const { data: mixerRole, error: roleError } = await supabase
      .from('roles')
      .select('id, title, departments:department_id (name)')
      .eq('title', 'Mixer')
      .single();

    if (roleError || !mixerRole) {
      throw new Error('Could not find Mixer role');
    }

    console.log(`✅ Found role: ${mixerRole.title} (ID: ${mixerRole.id})\n`);

    // 2. Get users without roles in Mixing & Material Prep
    console.log('📋 Finding users without roles...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name, employee_number, departments:department_id (name)')
      .is('role_id', null)
      .not('employee_number', 'is', null)
      .order('first_name');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    const mixingUsers = users?.filter(user => 
      user.departments?.name === 'Mixing & Material Prep'
    ) || [];

    console.log(`✅ Found ${mixingUsers.length} users in Mixing & Material Prep without roles\n`);

    if (mixingUsers.length === 0) {
      console.log('✅ No users need role assignment');
      return;
    }

    // 3. Update users with Mixer role
    console.log('🔄 Assigning Mixer role...\n');

    let updated = 0;
    let failed = 0;

    for (const user of mixingUsers) {
      console.log(`  Processing: ${user.first_name} ${user.last_name} (${user.employee_number})`);

      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          role_id: mixerRole.id,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.log(`    ❌ Failed: ${updateError.message}`);
        failed++;
      } else {
        console.log(`    ✅ Updated to Mixer`);
        updated++;

        // Log the role change in history
        const { error: historyError } = await supabase
          .from('user_role_history')
          .insert({
            user_id: user.id,
            old_role_id: null,
            new_role_id: mixerRole.id,
            old_department_id: null,
            new_department_id: null,
            change_reason: 'Automatic assignment - missing role',
            changed_by: 'system',
            changed_at: new Date().toISOString()
          });

        if (historyError) {
          console.log(`    ⚠️  History log failed: ${historyError.message}`);
        }
      }
    }

    // 4. Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 ROLE ASSIGNMENT SUMMARY');
    console.log('='.repeat(60));
    console.log(`Users processed: ${mixingUsers.length}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✅ Role assignment completed!');
      console.log('💡 These users will now automatically receive Mixer training assignments');
      console.log('💡 Run the training backfill script to assign their training');
    }

  } catch (error: any) {
    console.error('\n❌ Failed to fix users without roles:', error.message);
    process.exit(1);
  }
}

fixUsersWithoutRoles();
