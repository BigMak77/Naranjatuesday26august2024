#!/usr/bin/env node

/**
 * Test the fixed API with clean item_id structure
 */

const { createClient } = require('@supabase/supabase-js');

async function testFixedAPI() {
  console.log('🧪 Testing API with clean item_id structure...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test user and roles from your data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c'; // 4 assignments
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692'; // 4 assignments

  try {
    // 1. Get test user info
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    console.log(`👤 Test User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`🔑 Auth ID: ${testUser.auth_id}`);
    console.log(`📋 Current Role: ${testUser.role_id}`);
    console.log();

    // 2. Check current user assignments
    const { data: beforeAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    console.log(`📊 Current User Assignments: ${beforeAssignments?.length || 0}`);
    if (beforeAssignments?.length > 0) {
      console.log('   Sample assignments:');
      beforeAssignments.slice(0, 3).forEach(a => {
        console.log(`   - ${a.item_type}: ${a.item_id}`);
      });
    }
    console.log();

    // 3. Show role assignments for both roles
    console.log('🎯 Role Assignments:');
    console.log(`   Role 1 (${role1}): 4 assignments`);
    console.log(`   Role 2 (${role2}): 4 assignments`);
    console.log();

    // 4. Test the API call
    console.log('🚀 Testing role change API...');
    console.log(`   Changing from: ${testUser.role_id || 'None'}`);
    console.log(`   Changing to: ${role2}`);
    console.log();

    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        old_role_id: testUser.role_id,
        new_role_id: role2
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:');
      console.log(`   - Removed: ${result.removed_assignments || 0} assignments`);
      console.log(`   - Added: ${result.added_assignments || 0} assignments`);
      console.log(`   - User ID: ${result.user_id}`);
      console.log(`   - Old Role: ${result.old_role_id || 'None'}`);
      console.log(`   - New Role: ${result.new_role_id}`);
      console.log();

      // 5. Check final assignments
      const { data: afterAssignments } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', testUser.auth_id);

      console.log(`📊 Final User Assignments: ${afterAssignments?.length || 0}`);
      
      // 6. Verify user's role was updated
      const { data: updatedUser } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', testUserId)
        .single();

      console.log(`👤 User's Role Updated: ${updatedUser?.role_id === role2 ? 'Yes' : 'No'}`);

      // 7. Check audit log
      const { data: auditLog } = await supabase
        .from('user_role_change_log')
        .select('*')
        .eq('user_id', testUserId)
        .order('changed_at', { ascending: false })
        .limit(1);

      if (auditLog?.length > 0) {
        const log = auditLog[0];
        console.log('📝 Audit Log Created:');
        console.log(`   - ${log.old_role_id || 'None'} → ${log.new_role_id}`);
        console.log(`   - Removed: ${log.assignments_removed}, Added: ${log.assignments_added}`);
        console.log(`   - At: ${log.changed_at}`);
      }

      console.log();
      if ((result.removed_assignments || 0) > 0 || (result.added_assignments || 0) > 0) {
        console.log('🎉 SUCCESS! API is now working correctly!');
      } else {
        console.log('⚠️  Still showing 0 - need to investigate further');
      }

    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
    console.log('Make sure your dev server is running: npm run dev');
  }
}

require('dotenv').config({ path: '.env.local' });
testFixedAPI();
