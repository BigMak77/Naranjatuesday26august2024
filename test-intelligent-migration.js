const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testIntelligentMigration() {
  console.log('🧠 Testing Intelligent Role Migration API');
  console.log('=========================================');

  try {
    // Find users with assignments
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id, email')
      .not('role_id', 'is', null)
      .limit(5);

    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found with roles');
      return;
    }

    console.log(`\n👥 Found ${users.length} users with roles:`);
    users.forEach((user, i) => {
      console.log(`   ${i + 1}. ${user.email || user.id} (Role: ${user.role_id})`);
    });

    // Get available roles
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id, name')
      .limit(5);

    if (rolesError || !roles || roles.length === 0) {
      console.log('❌ No roles found');
      return;
    }

    console.log(`\n🎭 Available roles:`);
    roles.forEach((role, i) => {
      console.log(`   ${i + 1}. ${role.name || role.id}`);
    });

    // Pick first user and first available different role
    const testUser = users[0];
    const newRole = roles.find(r => r.id !== testUser.role_id);

    if (!newRole) {
      console.log('❌ Could not find a different role to migrate to');
      return;
    }

    console.log(`\n🔄 Ready for migration test:`);
    console.log(`   User: ${testUser.email || testUser.id}`);
    console.log(`   From role: ${testUser.role_id}`);
    console.log(`   To role: ${newRole.id} (${newRole.name || 'Unnamed'})`);

    // Get current assignment count
    const { data: currentAssignments, error: currentError } = await supabase
      .from('user_assignments')
      .select('item_id, item_type')
      .eq('auth_id', testUser.auth_id);

    console.log(`   Current assignments: ${currentAssignments?.length || 0}`);

    // Get role assignments for both roles
    const { data: oldRoleAssignments, error: oldRoleError } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', testUser.role_id);

    const { data: newRoleAssignments, error: newRoleError } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', newRole.id);

    console.log(`   Current role requires: ${oldRoleAssignments?.length || 0} assignments`);
    console.log(`   New role requires: ${newRoleAssignments?.length || 0} assignments`);

    console.log(`\n📞 API call format:`);
    console.log(`   POST /api/migrate-role-assignments`);
    console.log(`   Body: {`);
    console.log(`     "userId": "${testUser.id}",`);
    console.log(`     "newRoleId": "${newRole.id}"`);
    console.log(`   }`);

    console.log(`\n✅ Test analysis completed!`);
    console.log(`\n🚀 To perform actual migration:`);
    console.log(`   1. Go to http://localhost:3000/admin/assignments`);
    console.log(`   2. Use the "Intelligent Role Migration" component`);
    console.log(`   3. Enter User ID: ${testUser.id}`);
    console.log(`   4. Enter New Role ID: ${newRole.id}`);
    console.log(`   5. Click "Migrate Role"`);

    console.log(`\n📋 Expected behavior:`);
    console.log(`   - Assignments common to both roles will be kept`);
    console.log(`   - Assignments only in old role will be archived`);
    console.log(`   - Assignments only in new role will be added`);
    console.log(`   - User's role_id will be updated`);
    console.log(`   - All changes will be logged in audit_log`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testIntelligentMigration();
