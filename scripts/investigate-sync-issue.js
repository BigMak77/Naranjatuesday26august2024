const { createClient } = require('@supabase/supabase-js');

async function deepDiveRoleSync() {
  console.log('🔍 Deep Investigation: Why Role Sync Shows 0 Removed/Added...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data from your latest run
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    // 1. Get user details
    const { data: testUser } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name, role_id')
      .eq('id', testUserId)
      .single();

    console.log(`\n👤 User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   Auth ID: ${testUser.auth_id}`);
    console.log(`   Current Role: ${testUser.role_id}`);

    // 2. Check current role assignments in detail
    console.log(`\n📋 Role assignments for both test roles:`);
    
    const { data: role1Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    const { data: role2Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`   Role 1 (${role1.substring(0, 8)}...): ${role1Assignments?.length || 0} assignments`);
    if (role1Assignments && role1Assignments.length > 0) {
      role1Assignments.forEach((ra, i) => {
        const itemId = ra.document_id || ra.module_id;
        console.log(`     ${i + 1}. ${ra.type}: ${itemId}`);
      });
    }

    console.log(`   Role 2 (${role2.substring(0, 8)}...): ${role2Assignments?.length || 0} assignments`);
    if (role2Assignments && role2Assignments.length > 0) {
      role2Assignments.forEach((ra, i) => {
        const itemId = ra.document_id || ra.module_id;
        console.log(`     ${i + 1}. ${ra.type}: ${itemId}`);
      });
    }

    // 3. Check what the API removal logic would find
    console.log(`\n🔍 Simulating API removal logic for Role 1:`);
    let simulatedRemovals = 0;
    
    if (role1Assignments && role1Assignments.length > 0) {
      for (const assignment of role1Assignments) {
        const item_id = assignment.document_id || assignment.module_id;
        console.log(`   Looking for: auth_id=${testUser.auth_id}, item_id=${item_id}, type=${assignment.type}`);
        
        const { data: matchingAssignments, count } = await supabase
          .from('user_assignments')
          .select('*', { count: 'exact' })
          .eq('auth_id', testUser.auth_id)
          .eq('item_id', item_id)
          .eq('item_type', assignment.type);

        if (count && count > 0) {
          console.log(`     ✅ Found ${count} matching user assignment(s) - would remove`);
          simulatedRemovals += count;
        } else {
          console.log(`     ❌ No matching user assignment found`);
        }
      }
    }

    console.log(`   Total simulated removals: ${simulatedRemovals}`);

    // 4. Check what sync-training-from-profile would add
    console.log(`\n🚀 Testing sync-training-from-profile API for Role 2:`);
    
    const syncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    let syncResult = {};
    if (syncResponse.ok) {
      syncResult = await syncResponse.json();
      console.log(`   ✅ Sync API Response:`);
      console.log(`     - Inserted: ${syncResult.inserted || 0}`);
      console.log(`     - Skipped: ${syncResult.skipped || 0}`);
      console.log(`     - Total processed: ${syncResult.total || 0}`);
    } else {
      const syncError = await syncResponse.json();
      console.log(`   ❌ Sync API failed:`, syncError);
    }

    // 5. Check current user assignments
    console.log(`\n📊 Current user assignments (first 10):`);
    const { data: userAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id)
      .limit(10);

    if (userAssignments && userAssignments.length > 0) {
      userAssignments.forEach((ua, i) => {
        console.log(`   ${i + 1}. ${ua.item_type}: ${ua.item_id} (${ua.completion_status || 'pending'})`);
      });
    }

    // 6. Check the actual API endpoint behavior by examining its components
    console.log(`\n🔧 Testing individual API components:`);

    // Test if the user exists check works
    const { data: apiUser, error: apiUserError } = await supabase
      .from("users")
      .select("auth_id")
      .eq("id", testUserId)
      .single();

    if (apiUserError || !apiUser) {
      console.log(`   ❌ API user lookup would fail: ${apiUserError?.message}`);
    } else {
      console.log(`   ✅ API user lookup works: auth_id = ${apiUser.auth_id}`);
    }

    // 7. Check if there's a mismatch in the user's auth_id vs what's stored
    const { count: totalUserAssignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`\n📈 Assignment counts:`);
    console.log(`   User has ${totalUserAssignments || 0} total assignments`);
    console.log(`   From test: Started with 51, ended with 47, reverted to 4`);
    console.log(`   Role 1 should add: ${role1Assignments?.length || 0} assignments`);
    console.log(`   Role 2 should add: ${role2Assignments?.length || 0} assignments`);

    // 8. Final diagnosis
    console.log(`\n🎯 DIAGNOSIS:`);
    console.log(`================`);
    
    if (simulatedRemovals === 0) {
      console.log(`🚨 ISSUE: No matching assignments found for removal`);
      console.log(`💡 This means the role assignments don't match the user's current assignments`);
      console.log(`   - User has assignments but they don't match role_assignments table`);
      console.log(`   - Possible data inconsistency or different assignment structure`);
    } else {
      console.log(`✅ Removal logic should work (${simulatedRemovals} would be removed)`);
    }

    if ((syncResult.inserted || 0) === 0) {
      console.log(`🚨 ISSUE: Sync API isn't adding new assignments`);
      console.log(`💡 Check sync-training-from-profile API logic`);
    } else {
      console.log(`✅ Addition logic should work (${syncResult.inserted || 0} would be added)`);
    }

    console.log(`\n🛠️  RECOMMENDED FIXES:`);
    console.log(`1. Check user assignment structure vs role assignment structure`);
    console.log(`2. Verify sync-training-from-profile API is working correctly`);
    console.log(`3. Consider cleaning up inconsistent user assignments`);
    console.log(`4. Test with a fresh user who has only role-based assignments`);

  } catch (error) {
    console.error('💥 Investigation failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
deepDiveRoleSync();
