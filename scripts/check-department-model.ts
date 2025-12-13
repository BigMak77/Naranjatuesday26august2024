import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDepartmentModel() {
  console.log('🔍 CHECKING DEPARTMENT MODEL\n');
  console.log('=' .repeat(80));

  // 1. Check a sample of users to understand the data model
  const { data: sampleUsers } = await supabase
    .from('users')
    .select('auth_id, first_name, last_name, department_id, role_id')
    .not('auth_id', 'is', null)
    .limit(10);

  console.log('\n📊 Sample Users:');
  console.log('─'.repeat(80));

  for (const user of sampleUsers || []) {
    console.log(`\n👤 ${user.first_name} ${user.last_name}`);
    console.log(`   Direct department_id: ${user.department_id || 'NULL'}`);
    console.log(`   Role ID: ${user.role_id || 'NULL'}`);

    if (user.role_id) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, title, department_id')
        .eq('id', user.role_id)
        .single();

      if (role) {
        console.log(`   Role: ${role.title}`);
        console.log(`   Role's department_id: ${role.department_id || 'NULL'}`);

        if (user.department_id && role.department_id && user.department_id !== role.department_id) {
          console.log(`   ⚠️  MISMATCH: User dept != Role dept`);
        }
      }
    }
  }

  // 2. Check if users.department_id exists and is used
  console.log('\n\n' + '='.repeat(80));
  console.log('DEPARTMENT ASSIGNMENT MODEL');
  console.log('='.repeat(80));

  const { count: usersWithDirectDept } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .not('department_id', 'is', null);

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`\nUsers with direct department_id: ${usersWithDirectDept || 0} / ${totalUsers || 0}`);

  // 3. Check the department trigger logic
  console.log('\n\n' + '='.repeat(80));
  console.log('CURRENT TRIGGER BEHAVIOR');
  console.log('='.repeat(80));

  console.log(`
Current department sync trigger:
  - Looks at user's ROLE
  - Gets department_id FROM the role
  - Assigns department training based on role's department

Potential Issue:
  - If users have a DIRECT department_id field, it's being IGNORED
  - Department assignments should check BOTH:
    1. User's direct department_id (if set)
    2. User's role's department_id (as fallback)
`);

  // 4. Find users where department_id doesn't match role's department
  console.log('='.repeat(80));
  console.log('CHECKING FOR DEPARTMENT MISMATCHES');
  console.log('='.repeat(80));

  const { data: allUsers } = await supabase
    .from('users')
    .select('auth_id, first_name, last_name, department_id, role_id')
    .not('auth_id', 'is', null);

  let mismatches = 0;
  let usersWithNoDept = 0;

  for (const user of allUsers || []) {
    if (!user.department_id && !user.role_id) {
      usersWithNoDept++;
      continue;
    }

    if (user.role_id) {
      const { data: role } = await supabase
        .from('roles')
        .select('department_id')
        .eq('id', user.role_id)
        .single();

      if (user.department_id && role?.department_id && user.department_id !== role.department_id) {
        if (mismatches < 5) { // Only show first 5
          console.log(`\n⚠️  ${user.first_name} ${user.last_name}`);
          console.log(`   User dept: ${user.department_id}`);
          console.log(`   Role dept: ${role.department_id}`);
        }
        mismatches++;
      }
    }
  }

  console.log(`\n📊 Total mismatches: ${mismatches}`);
  console.log(`📊 Users with no department: ${usersWithNoDept}`);

  // 5. Recommendation
  console.log('\n\n' + '='.repeat(80));
  console.log('RECOMMENDATION');
  console.log('='.repeat(80));

  if (usersWithDirectDept && usersWithDirectDept > 0) {
    console.log(`
✅ Users table HAS a direct department_id column
✅ ${usersWithDirectDept} users have department_id set

⚠️  PROBLEM: The department trigger only looks at role's department
   It should ALSO look at user's direct department_id

💡 SOLUTION: Update the trigger to check user's department_id FIRST
   Then fall back to role's department if not set

This would fix automatic assignment when users:
  1. Move directly between departments (department_id changes)
  2. Move to roles with different departments (role_id changes)
`);
  } else {
    console.log(`
✅ Department is only tracked via roles
   Current trigger logic is correct
`);
  }

  console.log('\n' + '='.repeat(80));
}

checkDepartmentModel()
  .then(() => {
    console.log('\n✅ Check complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
