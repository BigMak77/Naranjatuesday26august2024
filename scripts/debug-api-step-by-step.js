#!/usr/bin/env node

/**
 * Debug API Test - Step by step to see what's happening
 */

const { createClient } = require('@supabase/supabase-js');

async function debugAPITest() {
  console.log('🔍 Debug API Test - Step by Step Analysis');
  console.log('=' .repeat(50));
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const oldRoleId = '534b9124-d4c5-4569-ab9b-46d3f37b986c'; // Role with assignments
  const newRoleId = '040cfbe5-26e1-48c0-8bbc-b8653a79a692'; // Different role with assignments

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

    // 2. Check what assignments the old role should have
    const { data: oldRoleAssignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', oldRoleId);

    console.log(`🎯 Old Role (${oldRoleId}) Assignments: ${oldRoleAssignments?.length || 0}`);
    if (oldRoleAssignments?.length > 0) {
      oldRoleAssignments.forEach(ra => {
        const item_id = ra.document_id || ra.module_id;
        console.log(`  - ${ra.type}: ${item_id}`);
      });
    }
    console.log();

    // 3. Check what assignments the new role should have
    const { data: newRoleAssignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', newRoleId);

    console.log(`🎯 New Role (${newRoleId}) Assignments: ${newRoleAssignments?.length || 0}`);
    if (newRoleAssignments?.length > 0) {
      newRoleAssignments.forEach(ra => {
        const item_id = ra.document_id || ra.module_id;
        console.log(`  - ${ra.type}: ${item_id}`);
      });
    }
    console.log();

    // 4. Check current user assignments BEFORE API call
    const { data: currentAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    console.log(`📊 Current User Assignments: ${currentAssignments?.length || 0}`);
    if (currentAssignments?.length > 0) {
      console.log('   Current assignments:');
      currentAssignments.slice(0, 5).forEach(ua => {
        console.log(`     - ${ua.item_type}: ${ua.item_id}`);
      });
    }
    console.log();

    // 5. Set the user to have the old role first
    console.log('🔄 Setting user to old role first...');
    await supabase
      .from('users')
      .update({ role_id: oldRoleId })
      .eq('id', testUserId);

    // 6. Now test the API call
    console.log('🚀 Testing API call...');
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        old_role_id: oldRoleId,
        new_role_id: newRoleId
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ API Response:', result);
      
      // 7. Check assignments AFTER API call
      const { data: finalAssignments } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', testUser.auth_id);

      console.log(`📊 Final User Assignments: ${finalAssignments?.length || 0}`);
      if (finalAssignments?.length > 0) {
        console.log('   Final assignments:');
        finalAssignments.slice(0, 5).forEach(ua => {
          console.log(`     - ${ua.item_type}: ${ua.item_id}`);
        });
      }

      // 8. Manually check what should have been removed
      console.log('\n🔍 Manual Verification:');
      console.log('Should have REMOVED:');
      if (oldRoleAssignments?.length > 0) {
        for (const ra of oldRoleAssignments) {
          const item_id = ra.document_id || ra.module_id;
          const { count } = await supabase
            .from('user_assignments')
            .select('*', { count: 'exact' })
            .eq('auth_id', testUser.auth_id)
            .eq('item_id', item_id)
            .eq('item_type', ra.type);
          
          console.log(`  - ${ra.type} ${item_id}: ${count || 0} still exist (should be 0)`);
        }
      }

      console.log('Should have ADDED:');
      if (newRoleAssignments?.length > 0) {
        for (const ra of newRoleAssignments) {
          const item_id = ra.document_id || ra.module_id;
          const { count } = await supabase
            .from('user_assignments')
            .select('*', { count: 'exact' })
            .eq('auth_id', testUser.auth_id)
            .eq('item_id', item_id)
            .eq('item_type', ra.type);
          
          console.log(`  - ${ra.type} ${item_id}: ${count || 0} exist (should be 1)`);
        }
      }

    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
debugAPITest();
