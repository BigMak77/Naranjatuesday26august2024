/**
 * Test script for the new training completion preservation system
 * Tests role changes and completion preservation
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompletionPreservation() {
  console.log('\n🧪 Testing Training Completion Preservation System\n');

  try {
    // 1. Find a test user
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name, role_id')
      .limit(1);

    if (usersError || !users?.length) {
      console.log('❌ No test users found');
      return;
    }

    const testUser = users[0];
    console.log(`👤 Test user: ${testUser.first_name} ${testUser.last_name} (Role: ${testUser.role_id})`);

    // 2. Check current assignments
    const { data: currentAssignments } = await supabase
      .from('user_assignments')
      .select('item_id, item_type, completed_at')
      .eq('auth_id', testUser.auth_id);

    console.log(`📋 Current assignments: ${currentAssignments?.length || 0}`);
    const completedCount = currentAssignments?.filter(a => a.completed_at)?.length || 0;
    console.log(`✅ Completed assignments: ${completedCount}`);

    if (completedCount === 0) {
      console.log('⚠️  No completed assignments to test with. Creating a test completion...');
      
      // Create a test completion
      if (currentAssignments?.length > 0) {
        const testAssignment = currentAssignments[0];
        const { error: updateError } = await supabase
          .from('user_assignments')
          .update({ completed_at: new Date().toISOString() })
          .eq('auth_id', testUser.auth_id)
          .eq('item_id', testAssignment.item_id)
          .eq('item_type', testAssignment.item_type);

        if (!updateError) {
          console.log(`✅ Created test completion for ${testAssignment.item_type} ${testAssignment.item_id}`);
        }
      }
    }

    // 3. Get available roles for testing
    const { data: roles } = await supabase
      .from('roles')
      .select('id, title')
      .neq('id', testUser.role_id)
      .limit(2);

    if (!roles?.length) {
      console.log('❌ No alternative roles found for testing');
      return;
    }

    const newRole = roles[0];
    console.log(`🔄 Testing role change to: ${newRole.title}`);

    // 4. Test the role change API
    const response = await fetch('http://localhost:3000/api/change-user-role-assignments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: testUser.id,
        new_role_id: newRole.id
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('❌ Role change failed:', error);
      return;
    }

    const result = await response.json();
    console.log('\n📊 Role Change Results:');
    console.log(`  - Assignments removed: ${result.assignments_removed}`);
    console.log(`  - Assignments added: ${result.assignments_added}`);
    console.log(`  - Completions restored: ${result.completions_restored}`);

    // 5. Verify completion preservation
    const { data: newAssignments } = await supabase
      .from('user_assignments')
      .select('item_id, item_type, completed_at')
      .eq('auth_id', testUser.auth_id);

    const newCompletedCount = newAssignments?.filter(a => a.completed_at)?.length || 0;
    console.log(`\n✅ Verification:`);
    console.log(`  - New assignments: ${newAssignments?.length || 0}`);
    console.log(`  - Restored completions: ${newCompletedCount}`);

    // 6. Check permanent completions table
    const { data: permanentCompletions } = await supabase
      .from('user_training_completions')
      .select('item_id, item_type, completed_at, completed_by_role_id')
      .eq('auth_id', testUser.auth_id);

    console.log(`  - Permanent completion records: ${permanentCompletions?.length || 0}`);

    if (permanentCompletions?.length > 0) {
      console.log('\n📚 Permanent Completion Records:');
      permanentCompletions.forEach(completion => {
        const date = new Date(completion.completed_at).toLocaleDateString();
        console.log(`  - ${completion.item_type} ${completion.item_id}: ${date} (Role: ${completion.completed_by_role_id})`);
      });
    }

    // 7. Test another role change to verify completions persist
    if (roles.length > 1) {
      const secondRole = roles[1];
      console.log(`\n🔄 Testing second role change to: ${secondRole.title}`);

      const secondResponse = await fetch('http://localhost:3000/api/change-user-role-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: testUser.id,
          new_role_id: secondRole.id
        })
      });

      if (secondResponse.ok) {
        const secondResult = await secondResponse.json();
        console.log(`  - Second change completions restored: ${secondResult.completions_restored}`);
      }
    }

    console.log('\n🎉 Training completion preservation test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
if (require.main === module) {
  testCompletionPreservation();
}

module.exports = { testCompletionPreservation };
