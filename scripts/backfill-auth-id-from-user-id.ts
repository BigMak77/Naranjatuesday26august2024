import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillAuthIdFromUserId() {
  console.log('🔧 BACKFILLING auth_id FROM user id\n');
  console.log('=' .repeat(80));
  console.log('\nStrategy: Set auth_id = id for users missing auth_id');
  console.log('This allows module inheritance triggers to work immediately\n');

  // 1. Get users without auth_id
  const { data: usersWithoutAuth, error: fetchError } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role_id, department_id')
    .is('auth_id', null);

  if (fetchError) {
    console.error('❌ Error fetching users:', fetchError.message);
    return;
  }

  if (!usersWithoutAuth || usersWithoutAuth.length === 0) {
    console.log('✅ No users missing auth_id!');
    return;
  }

  console.log(`Found ${usersWithoutAuth.length} users without auth_id:\n`);

  usersWithoutAuth.forEach(u => {
    console.log(`  • ${u.first_name} ${u.last_name} (${u.email || 'no email'})`);
    console.log(`    User ID: ${u.id}`);
    console.log(`    Role: ${u.role_id ? 'Yes' : 'No'}`);
    console.log(`    Department: ${u.department_id ? 'Yes' : 'No'}\n`);
  });

  console.log('=' .repeat(80));
  console.log('UPDATING USERS');
  console.log('=' .repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const user of usersWithoutAuth) {
    console.log(`\n👤 ${user.first_name} ${user.last_name}`);
    console.log(`   Setting auth_id = ${user.id}...`);

    // Update user to set auth_id = id
    const { error: updateError } = await supabase
      .from('users')
      .update({ auth_id: user.id })
      .eq('id', user.id);

    if (updateError) {
      console.log(`   ❌ Error: ${updateError.message}`);
      errorCount++;
      continue;
    }

    console.log(`   ✅ auth_id updated`);
    successCount++;

    // Now manually trigger training assignments since the INSERT trigger already fired
    console.log(`   🔄 Assigning inherited training modules...`);

    let assignmentsAdded = 0;

    // Get role-based assignments
    if (user.role_id) {
      const { data: roleAssignments } = await supabase
        .from('role_assignments')
        .select('item_id, type')
        .eq('role_id', user.role_id);

      for (const ra of roleAssignments || []) {
        const { error: insertError } = await supabase
          .from('user_assignments')
          .insert({
            auth_id: user.id, // Use user.id as auth_id
            item_id: ra.item_id,
            item_type: ra.type,
            assigned_at: new Date().toISOString()
          });

        if (!insertError) {
          assignmentsAdded++;
        } else if (insertError.code !== '23505') { // Ignore duplicate key errors
          console.log(`      ⚠️  Error: ${insertError.message}`);
        }
      }
    }

    // Get department-based assignments
    if (user.department_id) {
      const { data: deptAssignments } = await supabase
        .from('department_assignments')
        .select('item_id, type')
        .eq('department_id', user.department_id);

      for (const da of deptAssignments || []) {
        const { error: insertError } = await supabase
          .from('user_assignments')
          .insert({
            auth_id: user.id, // Use user.id as auth_id
            item_id: da.item_id,
            item_type: da.type,
            assigned_at: new Date().toISOString()
          });

        if (!insertError) {
          assignmentsAdded++;
        } else if (insertError.code !== '23505') {
          console.log(`      ⚠️  Error: ${insertError.message}`);
        }
      }
    }

    if (assignmentsAdded > 0) {
      console.log(`   ✅ Added ${assignmentsAdded} training assignments`);
    } else {
      console.log(`   ℹ️  No training assignments to add`);
    }
  }

  // Summary
  console.log('\n\n' + '=' .repeat(80));
  console.log('SUMMARY');
  console.log('=' .repeat(80));

  console.log(`
✅ Successfully updated: ${successCount} users
❌ Errors: ${errorCount} users
📊 Total processed: ${usersWithoutAuth.length} users
`);

  if (successCount > 0) {
    console.log(`
✅ SUCCESS! The following users now have auth_id and training assignments:

${usersWithoutAuth.slice(0, successCount).map(u =>
  `   • ${u.first_name} ${u.last_name} (auth_id = ${u.id})`
).join('\n')}

These users can now:
  ✅ Receive automatic training assignments
  ✅ Benefit from module inheritance triggers
  ✅ Be tracked in the training system
`);
  }

  // Verify
  console.log('=' .repeat(80));
  console.log('VERIFICATION');
  console.log('=' .repeat(80));

  const { data: remainingUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name')
    .is('auth_id', null);

  if (!remainingUsers || remainingUsers.length === 0) {
    console.log('\n✅ All users now have auth_id!');
  } else {
    console.log(`\n⚠️  ${remainingUsers.length} users still missing auth_id`);
  }

  console.log('\n' + '=' .repeat(80));
}

backfillAuthIdFromUserId()
  .then(() => {
    console.log('\n✅ Backfill complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
