const { createClient } = require('@supabase/supabase-js');

async function fixAndTestRoleSync() {
  console.log('🔧 Fixing and Testing Role Sync Issue...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    // 1. Get user details
    const { data: testUser } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name')
      .eq('id', testUserId)
      .single();

    console.log(`👤 User: ${testUser.first_name} ${testUser.last_name} (${testUser.auth_id})`);

    // 2. Clean slate - remove ALL current assignments for this user
    console.log('\n🧹 Cleaning user assignments...');
    const { count: removedAll } = await supabase
      .from('user_assignments')
      .delete()
      .eq('auth_id', testUser.auth_id)
      .select('*', { count: 'exact' });

    console.log(`   Removed ${removedAll || 0} existing assignments`);

    // 3. Add only Role 1 assignments using sync API
    console.log(`\n📝 Adding Role 1 assignments via sync API...`);
    const role1SyncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role1 })
    });

    if (role1SyncResponse.ok) {
      const role1Result = await role1SyncResponse.json();
      console.log(`   ✅ Added ${role1Result.inserted || 0} Role 1 assignments`);
    } else {
      const error = await role1SyncResponse.json();
      console.log(`   ❌ Role 1 sync failed:`, error);
      return;
    }

    // 4. Verify current state
    const { count: currentAssignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`   Current assignments: ${currentAssignments || 0}`);

    // 5. Now test the role change API
    console.log(`\n🚀 Testing role change API: Role 1 → Role 2...`);
    
    const changeResponse = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        old_role_id: role1,
        new_role_id: role2
      })
    });

    const changeResult = await changeResponse.json();

    if (changeResponse.ok) {
      console.log(`   ✅ Role change successful!`);
      console.log(`     - Removed: ${changeResult.removed_assignments || 0}`);
      console.log(`     - Added: ${changeResult.added_assignments || 0}`);
    } else {
      console.log(`   ❌ Role change failed:`, changeResult);
      return;
    }

    // 6. Verify final state
    const { count: finalAssignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`   Final assignments: ${finalAssignments || 0}`);

    // 7. Check what assignments actually exist for each role
    console.log(`\n📊 Role assignment configuration:`);
    
    const { data: role1Config } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    const { data: role2Config } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`   Role 1 has ${role1Config?.length || 0} configured assignments`);
    console.log(`   Role 2 has ${role2Config?.length || 0} configured assignments`);

    // 8. Analysis
    console.log(`\n🎯 ANALYSIS:`);
    console.log(`============`);
    
    const expectedRemoved = role1Config?.length || 0;
    const expectedAdded = role2Config?.length || 0;
    const actualRemoved = changeResult.removed_assignments || 0;
    const actualAdded = changeResult.added_assignments || 0;

    console.log(`Expected to remove: ${expectedRemoved}, Actually removed: ${actualRemoved}`);
    console.log(`Expected to add: ${expectedAdded}, Actually added: ${actualAdded}`);

    if (actualRemoved === expectedRemoved && actualAdded === expectedAdded) {
      console.log(`✅ SUCCESS: Role sync is working correctly!`);
    } else {
      console.log(`⚠️  ISSUE: Mismatch between expected and actual results`);
      
      if (actualRemoved !== expectedRemoved) {
        console.log(`🔍 Removal issue: Check if user assignments match role_assignments format`);
      }
      
      if (actualAdded !== expectedAdded) {
        console.log(`🔍 Addition issue: Check sync-training-from-profile API`);
      }
    }

    // 9. Show current user assignments
    console.log(`\n📋 Current user assignments:`);
    const { data: userAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    if (userAssignments && userAssignments.length > 0) {
      userAssignments.forEach((ua, i) => {
        console.log(`   ${i + 1}. ${ua.item_type}: ${ua.item_id}`);
      });
    } else {
      console.log(`   No assignments found`);
    }

  } catch (error) {
    console.error('💥 Fix attempt failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
fixAndTestRoleSync();
