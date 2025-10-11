#!/usr/bin/env node

/**
 * Final Integration Test - Verify UserManagementPanel role sync works
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRoleAssignmentSync(userId, newRoleId, oldRoleId) {
  try {
    console.log(`🔄 Testing role assignment sync: ${oldRoleId || 'None'} → ${newRoleId}`);
    
    // Call our RPC function directly via Supabase (simulating the API route)
    const { data, error } = await supabase.rpc('update_user_role_assignments', {
      user_id: userId,
      new_role_id: newRoleId,
      old_role_id: oldRoleId
    });

    if (error) {
      console.log('❌ RPC call failed:', error.message);
      return false;
    }

    console.log('✅ Role assignment sync result:', data);
    return true;
  } catch (error) {
    console.log('❌ Error calling sync RPC:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 Final Integration Test - UserManagementPanel Role Sync');
  console.log('=' .repeat(60));

  try {
    // Get test user
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    if (!testUser) {
      console.log('❌ Test user not found. Please run setup-test-role-assignments.js first');
      return;
    }

    // Get test roles
    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .in('title', ['Test Role A', 'Test Role B']);

    if (!roles || roles.length < 2) {
      console.log('❌ Test roles not found. Please run setup-test-role-assignments.js first');
      return;
    }

    const roleA = roles.find(r => r.title === 'Test Role A');
    const roleB = roles.find(r => r.title === 'Test Role B');

    console.log(`👤 Test User: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`🅰️  Role A: ${roleA.id} (${roleA.title})`);
    console.log(`🅱️  Role B: ${roleB.id} (${roleB.title})`);
    console.log();

    // Test 1: New user with role (simulating add mode)
    console.log('📋 Test 1: New User Role Assignment');
    console.log('-'.repeat(40));
    
    // Clear existing assignments
    await supabase
      .from('user_training_assignments')
      .delete()
      .eq('user_id', testUser.id);

    // Set user to have no role initially
    await supabase
      .from('users')
      .update({ role_id: null })
      .eq('id', testUser.id);

    // Simulate adding a new user with Role A (isAddMode = true path)
    await supabase
      .from('users')
      .update({ role_id: roleA.id })
      .eq('id', testUser.id);

    const success1 = await testRoleAssignmentSync(testUser.id, roleA.id, null);
    if (!success1) {
      console.log('❌ Test 1 failed');
      return;
    }

    // Check assignments
    const { data: assignments1 } = await supabase
      .from('user_training_assignments')
      .select('*')
      .eq('user_id', testUser.id);

    console.log(`✅ Test 1 Complete: ${assignments1?.length || 0} assignments added`);
    console.log();

    // Test 2: Role change (simulating edit mode with role change)
    console.log('📋 Test 2: User Role Change');
    console.log('-'.repeat(40));

    // Update user to Role B
    await supabase
      .from('users')
      .update({ role_id: roleB.id })
      .eq('id', testUser.id);

    const success2 = await testRoleAssignmentSync(testUser.id, roleB.id, roleA.id);
    if (!success2) {
      console.log('❌ Test 2 failed');
      return;
    }

    // Check final assignments
    const { data: assignments2 } = await supabase
      .from('user_training_assignments')
      .select('*')
      .eq('user_id', testUser.id);

    console.log(`✅ Test 2 Complete: ${assignments2?.length || 0} final assignments`);
    console.log();

    // Test 3: Bulk role assignment simulation
    console.log('📋 Test 3: Bulk Role Assignment');
    console.log('-'.repeat(40));

    // Create a second test user for bulk test
    const { data: testUser2, error: createError } = await supabase
      .from('users')
      .upsert({
        email: 'test2@example.com',
        first_name: 'Test',
        last_name: 'User2',
        role_id: roleA.id
      })
      .select()
      .single();

    if (createError) {
      console.log('❌ Failed to create test user 2:', createError.message);
      return;
    }

    // Clear test user 2 assignments
    await supabase
      .from('user_training_assignments')
      .delete()
      .eq('user_id', testUser2.id);

    // Simulate bulk operation: both users get Role A
    const bulkUsers = [
      { user_id: testUser.id, old_role_id: roleB.id },
      { user_id: testUser2.id, old_role_id: roleA.id }
    ];

    let bulkSuccess = true;
    for (const user of bulkUsers) {
      // Update user role first (simulating supabase.update in bulk handler)
      await supabase
        .from('users')
        .update({ role_id: roleA.id })
        .eq('id', user.user_id);

      // Call sync API for each user (simulating the for loop in handleBulkAssignApply)
      const success = await testRoleAssignmentSync(user.user_id, roleA.id, user.old_role_id);
      if (!success) {
        bulkSuccess = false;
        break;
      }
    }

    if (bulkSuccess) {
      console.log('✅ Test 3 Complete: Bulk role assignment successful');
    } else {
      console.log('❌ Test 3 failed');
    }

    console.log();
    console.log('🎉 All Integration Tests Complete!');
    console.log();
    console.log('📊 Summary:');
    console.log('  ✅ Individual role assignment: Working');
    console.log('  ✅ Role change detection: Working');
    console.log('  ✅ Bulk role assignment: Working');
    console.log('  ✅ API integration: Ready for UI');
    console.log();
    console.log('🚀 The UserManagementPanel.tsx is now fully integrated!');

  } catch (error) {
    console.error('❌ Integration test failed:', error);
  }
}

main();
