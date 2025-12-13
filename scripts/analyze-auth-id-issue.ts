import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function analyzeAuthIdIssue() {
  console.log('🔍 ANALYZING auth_id ISSUE\n');
  console.log('=' .repeat(80));

  // 1. Count users with and without auth_id
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, auth_id, created_at');

  const usersWithAuth = allUsers?.filter(u => u.auth_id !== null) || [];
  const usersWithoutAuth = allUsers?.filter(u => u.auth_id === null) || [];

  console.log('\n📊 USER STATISTICS');
  console.log('─'.repeat(80));
  console.log(`Total users: ${allUsers?.length || 0}`);
  console.log(`Users WITH auth_id: ${usersWithAuth.length} (${((usersWithAuth.length / (allUsers?.length || 1)) * 100).toFixed(1)}%)`);
  console.log(`Users WITHOUT auth_id: ${usersWithoutAuth.length} (${((usersWithoutAuth.length / (allUsers?.length || 1)) * 100).toFixed(1)}%)`);

  // 2. Show sample users without auth_id
  if (usersWithoutAuth.length > 0) {
    console.log('\n⚠️  USERS WITHOUT auth_id (first 10):');
    console.log('─'.repeat(80));
    usersWithoutAuth.slice(0, 10).forEach(u => {
      console.log(`  • ${u.first_name} ${u.last_name} (${u.email || 'no email'})`);
      console.log(`    ID: ${u.id}`);
      console.log(`    Created: ${u.created_at || 'unknown'}`);
    });
  }

  // 3. Check auth users
  console.log('\n\n' + '=' .repeat(80));
  console.log('SUPABASE AUTH USERS');
  console.log('=' .repeat(80));

  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

  if (authError) {
    console.log('❌ Cannot list auth users:', authError.message);
    console.log('   (This is expected - requires admin privileges)');
  } else {
    console.log(`\n✅ Found ${authUsers.users.length} auth users in Supabase Auth`);

    // Try to match auth users to users table
    const unmatchedAuthUsers = [];
    const matchedCount = authUsers.users.filter(authUser => {
      return usersWithAuth.some(u => u.auth_id === authUser.id);
    }).length;

    console.log(`   Matched to users table: ${matchedCount}`);
    console.log(`   Unmatched: ${authUsers.users.length - matchedCount}`);
  }

  // 4. Impact analysis
  console.log('\n\n' + '=' .repeat(80));
  console.log('IMPACT ANALYSIS');
  console.log('=' .repeat(80));

  if (usersWithoutAuth.length > 0) {
    console.log(`
⚠️  CRITICAL ISSUE: ${usersWithoutAuth.length} users have NO auth_id

This means:
  ❌ These users CANNOT log in
  ❌ Module inheritance triggers SKIP these users
  ❌ They don't get automatic training assignments
  ❌ They are invisible to the authentication system

Why this happens:
  • UserManagementPanel creates users without auth_id (line 589-611)
  • HrAdminView creates users without auth_id (line 354)
  • CSV Import doesn't include auth_id field
  • create-auth-user API creates auth account but doesn't link it to users table
`);

    // Check if any of these users have role or department assignments
    const usersWithRoleOrDept = usersWithoutAuth.filter(u => {
      const fullUser = allUsers?.find(fu => fu.id === u.id);
      return fullUser; // We need to query for role_id and department_id
    });

    console.log(`Users without auth_id that have roles/departments: checking...`);

    // Get full details for users without auth
    const { data: detailedUsers } = await supabase
      .from('users')
      .select('id, first_name, last_name, role_id, department_id, auth_id')
      .is('auth_id', null)
      .limit(10);

    const usersWithAssignments = detailedUsers?.filter(u => u.role_id || u.department_id) || [];

    if (usersWithAssignments.length > 0) {
      console.log(`\n❌ ${usersWithAssignments.length} users without auth_id have role/department assignments`);
      console.log('   These users are MISSING automatic training assignments!');
      console.log('\nExamples:');
      usersWithAssignments.slice(0, 5).forEach(u => {
        console.log(`  • ${u.first_name} ${u.last_name}`);
        console.log(`    Role: ${u.role_id ? 'Yes' : 'No'}`);
        console.log(`    Department: ${u.department_id ? 'Yes' : 'No'}`);
      });
    }
  }

  // 5. Root cause
  console.log('\n\n' + '=' .repeat(80));
  console.log('ROOT CAUSE');
  console.log('=' .repeat(80));

  console.log(`
The user creation flow is BROKEN:

Current Flow (Broken):
  1. Admin creates user via UserManagementPanel
     → INSERT into users table WITHOUT auth_id
  2. Separately, admin may call create-auth-user API
     → Creates auth user in Supabase Auth
     → Returns auth user ID
     → BUT doesn't update users table with auth_id
  3. Result: Disconnected records

Expected Flow (Should Be):
  1. Admin creates user via UserManagementPanel
     → Calls create-auth-user API FIRST (if email/password provided)
     → Gets auth_id from response
     → INSERT into users table WITH auth_id
  OR
  1. Admin creates user without auth (intentional - non-login user)
     → Clearly marked as "No Login Account"
  2. Later, admin can "Add Login" button
     → Creates auth user
     → Updates users table with auth_id
`);

  // 6. Recommendations
  console.log('\n\n' + '=' .repeat(80));
  console.log('SOLUTIONS');
  console.log('=' .repeat(80));

  console.log(`
Solution 1: Fix User Creation Flow (RECOMMENDED)
  • Modify UserManagementPanel to:
    1. Ask admin: "Create login account?" (checkbox)
    2. If yes, collect email/password
    3. Call create-auth-user API FIRST
    4. Use returned auth_id when inserting into users table
  • Update create-auth-user API to:
    - Accept additional user details
    - Create both auth user AND users table record
    - Return complete user record

Solution 2: Add "Create Login" Button (SHORT-TERM FIX)
  • Add button to user edit modal
  • When clicked:
    1. Prompt for email/password
    2. Call create-auth-user API
    3. UPDATE users table SET auth_id = returned_auth_id
    4. Manually trigger training sync for this user

Solution 3: Backfill Existing Users (IMMEDIATE FIX)
  • For users with email matching auth users:
    - Match by email
    - UPDATE users SET auth_id = matching_auth_user_id
  • For users without matching auth users:
    - Mark as "No Login" or create auth accounts

Solution 4: Database Trigger (ALTERNATIVE)
  • Create trigger on users table INSERT
  • If email provided but no auth_id:
    - Automatically create auth user
    - Set auth_id
  • Risky: May create unwanted auth accounts
`);

  console.log('\n' + '=' .repeat(80));
}

analyzeAuthIdIssue()
  .then(() => {
    console.log('\n✅ Analysis complete\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
