import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillMissingAuthIds() {
  console.log('🔧 BACKFILLING MISSING auth_id VALUES\n');
  console.log('=' .repeat(80));

  // 1. Get users without auth_id
  const { data: usersWithoutAuth } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role_id, department_id')
    .is('auth_id', null);

  if (!usersWithoutAuth || usersWithoutAuth.length === 0) {
    console.log('✅ No users missing auth_id!');
    return;
  }

  console.log(`Found ${usersWithoutAuth.length} users without auth_id:\n`);

  usersWithoutAuth.forEach(u => {
    console.log(`  • ${u.first_name} ${u.last_name} (${u.email || 'no email'})`);
  });

  console.log('\n' + '=' .repeat(80));
  console.log('CHECKING FOR MATCHING AUTH USERS');
  console.log('=' .repeat(80));

  // 2. Get all Supabase Auth users
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('\n❌ Cannot access Supabase Auth users:', authError.message);
    console.log('\nYou have two options:');
    console.log('1. Match by email manually (see below)');
    console.log('2. Create new auth accounts for these users');
    return;
  }

  const authUsers = authData.users;
  console.log(`\n✅ Found ${authUsers.length} auth users in Supabase Auth`);

  // 3. Try to match by email
  console.log('\n' + '=' .repeat(80));
  console.log('MATCHING BY EMAIL');
  console.log('=' .repeat(80));

  const matches: Array<{ userId: string; authId: string; email: string; firstName: string; lastName: string }> = [];
  const unmatched: typeof usersWithoutAuth = [];

  for (const user of usersWithoutAuth) {
    if (!user.email) {
      console.log(`\n⚠️  ${user.first_name} ${user.last_name}: No email - cannot match`);
      unmatched.push(user);
      continue;
    }

    const authUser = authUsers.find(au => au.email?.toLowerCase() === user.email?.toLowerCase());

    if (authUser) {
      console.log(`\n✅ MATCH: ${user.first_name} ${user.last_name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Auth ID: ${authUser.id}`);
      matches.push({
        userId: user.id,
        authId: authUser.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      });
    } else {
      console.log(`\n❌ NO MATCH: ${user.first_name} ${user.last_name} (${user.email})`);
      unmatched.push(user);
    }
  }

  // 4. Update matched users
  if (matches.length > 0) {
    console.log('\n\n' + '=' .repeat(80));
    console.log('UPDATING MATCHED USERS');
    console.log('=' .repeat(80));

    for (const match of matches) {
      console.log(`\nUpdating ${match.firstName} ${match.lastName}...`);

      const { error: updateError } = await supabase
        .from('users')
        .update({ auth_id: match.authId })
        .eq('id', match.userId);

      if (updateError) {
        console.log(`  ❌ Error: ${updateError.message}`);
      } else {
        console.log(`  ✅ auth_id set to: ${match.authId}`);

        // Now trigger training sync for this user
        console.log(`  🔄 Syncing training assignments...`);

        const { data: userData } = await supabase
          .from('users')
          .select('role_id, department_id')
          .eq('id', match.userId)
          .single();

        if (userData?.role_id || userData?.department_id) {
          // Manually insert training assignments since triggers already fired (without auth_id)
          let assignmentsAdded = 0;

          // Get role assignments
          if (userData.role_id) {
            const { data: roleAssignments } = await supabase
              .from('role_assignments')
              .select('item_id, type')
              .eq('role_id', userData.role_id);

            for (const ra of roleAssignments || []) {
              const { error: insertError } = await supabase
                .from('user_assignments')
                .insert({
                  auth_id: match.authId,
                  item_id: ra.item_id,
                  item_type: ra.type,
                  assigned_at: new Date().toISOString()
                })
                .select();

              if (!insertError) {
                assignmentsAdded++;
              } else if (insertError.code !== '23505') { // Ignore duplicate key errors
                console.log(`    ⚠️  Error adding assignment: ${insertError.message}`);
              }
            }
          }

          // Get department assignments
          if (userData.department_id) {
            const { data: deptAssignments } = await supabase
              .from('department_assignments')
              .select('item_id, type')
              .eq('department_id', userData.department_id);

            for (const da of deptAssignments || []) {
              const { error: insertError } = await supabase
                .from('user_assignments')
                .insert({
                  auth_id: match.authId,
                  item_id: da.item_id,
                  item_type: da.type,
                  assigned_at: new Date().toISOString()
                })
                .select();

              if (!insertError) {
                assignmentsAdded++;
              } else if (insertError.code !== '23505') {
                console.log(`    ⚠️  Error adding assignment: ${insertError.message}`);
              }
            }
          }

          console.log(`  ✅ Added ${assignmentsAdded} training assignments`);
        } else {
          console.log(`  ℹ️  User has no role or department - no training to assign`);
        }
      }
    }
  }

  // 5. Report on unmatched users
  if (unmatched.length > 0) {
    console.log('\n\n' + '=' .repeat(80));
    console.log('UNMATCHED USERS');
    console.log('=' .repeat(80));

    console.log(`\n${unmatched.length} users could not be matched to auth users:\n`);

    for (const user of unmatched) {
      console.log(`  ❌ ${user.first_name} ${user.last_name} (${user.email || 'no email'})`);
    }

    console.log('\nOptions for these users:');
    console.log('1. Create auth accounts for them via the UI');
    console.log('2. If they should not have login access, leave them as-is');
    console.log('3. Manually create auth users and run this script again');
  }

  // 6. Summary
  console.log('\n\n' + '=' .repeat(80));
  console.log('SUMMARY');
  console.log('=' .repeat(80));

  console.log(`
✅ Matched and updated: ${matches.length} users
❌ Unmatched: ${unmatched.length} users
📊 Total processed: ${usersWithoutAuth.length} users

${matches.length > 0 ? `
✅ SUCCESS! The following users now have auth_id and training assignments:
${matches.map(m => `   • ${m.firstName} ${m.lastName} (${m.email})`).join('\n')}

These users can now:
  ✅ Log in to the system
  ✅ Receive automatic training assignments
  ✅ Benefit from module inheritance triggers
` : ''}

${unmatched.length > 0 ? `
⚠️  ATTENTION NEEDED: ${unmatched.length} users still missing auth_id
   See recommendations above for next steps
` : ''}
`);

  console.log('=' .repeat(80));
}

backfillMissingAuthIds()
  .then(() => {
    console.log('\n✅ Backfill complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
