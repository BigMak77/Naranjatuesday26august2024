const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function demonstrateIntelligentMigration() {
  console.log('🧠 Demonstrating Intelligent Role Migration');
  console.log('============================================');

  try {
    // Find a user with assignments to use as example
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null)
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.log('❌ No users found with roles');
      return;
    }

    const testUser = users[0];
    console.log(`\n👤 Using test user: ${testUser.id}`);
    console.log(`   Current role: ${testUser.role_id}`);

    // Get current assignments
    const { data: currentAssignments, error: currentError } = await supabase
      .from('user_assignments')
      .select('item_id, item_type, assigned_at')
      .eq('auth_id', testUser.auth_id);

    if (currentError) {
      console.error('❌ Error getting current assignments:', currentError);
      return;
    }

    console.log(`   Current assignments: ${currentAssignments.length}`);

    // Get available roles (find a different one)
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('id')
      .neq('id', testUser.role_id)
      .limit(1);

    if (rolesError || !roles || roles.length === 0) {
      console.log('❌ No alternative roles found');
      return;
    }

    const newRoleId = roles[0].id;
    console.log(`   Target role: ${newRoleId}`);

    // Get assignments for new role
    const { data: newRoleAssignments, error: newRoleError } = await supabase
      .from('role_assignments')
      .select('module_id, document_id, type')
      .eq('role_id', newRoleId);

    if (newRoleError) {
      console.error('❌ Error getting new role assignments:', newRoleError);
      return;
    }

    console.log(`   New role requires: ${newRoleAssignments.length} assignments`);

    // Analyze what would happen
    const newRoleItems = new Set(
      newRoleAssignments.map(ra => 
        `${ra.document_id || ra.module_id}:${ra.type}`
      )
    );

    const currentItems = new Set(
      currentAssignments.map(a => `${a.item_id}:${a.item_type}`)
    );

    const willKeep = currentAssignments.filter(a => 
      newRoleItems.has(`${a.item_id}:${a.item_type}`)
    );

    const willArchive = currentAssignments.filter(a => 
      !newRoleItems.has(`${a.item_id}:${a.item_type}`)
    );

    const willAdd = newRoleAssignments.filter(ra => {
      const key = `${ra.document_id || ra.module_id}:${ra.type}`;
      return !currentItems.has(key);
    });

    console.log('\n📊 Migration Analysis:');
    console.log(`   ✅ Will keep: ${willKeep.length} assignments (still applicable)`);
    console.log(`   📦 Will archive: ${willArchive.length} assignments (no longer relevant)`);
    console.log(`   ➕ Will add: ${willAdd.length} new assignments (required for new role)`);
    console.log(`   📈 Final total: ${willKeep.length + willAdd.length} assignments`);

    // Show some examples
    if (willKeep.length > 0) {
      console.log('\n✅ Examples of assignments being kept:');
      willKeep.slice(0, 3).forEach((assignment, i) => {
        console.log(`   ${i+1}. ${assignment.item_id} (${assignment.item_type})`);
      });
    }

    if (willArchive.length > 0) {
      console.log('\n📦 Examples of assignments being archived:');
      willArchive.slice(0, 3).forEach((assignment, i) => {
        console.log(`   ${i+1}. ${assignment.item_id} (${assignment.item_type})`);
      });
    }

    if (willAdd.length > 0) {
      console.log('\n➕ Examples of new assignments being added:');
      willAdd.slice(0, 3).forEach((assignment, i) => {
        const itemId = assignment.document_id || assignment.module_id;
        console.log(`   ${i+1}. ${itemId} (${assignment.type})`);
      });
    }

    console.log('\n🎯 Benefits of Intelligent Migration:');
    console.log('   • User keeps relevant training progress');
    console.log('   • Irrelevant assignments are properly archived (not lost)');
    console.log('   • New role requirements are automatically fulfilled');
    console.log('   • Full audit trail of what changed and why');
    console.log('   • No legacy assignments carried over inappropriately');

    console.log('\n💡 This is much better than:');
    console.log('   ❌ Deleting all assignments (loses progress)');
    console.log('   ❌ Keeping all assignments (legacy pollution)');
    console.log('   ❌ Manual cleanup (error prone)');

    console.log('\n🚀 To execute this migration:');
    console.log(`   curl -X POST http://localhost:3000/api/migrate-role-assignments \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"userId": "${testUser.id}", "newRoleId": "${newRoleId}"}'`);

  } catch (error) {
    console.error('💥 Demo failed:', error);
  }
}

// Run the demonstration
demonstrateIntelligentMigration();
