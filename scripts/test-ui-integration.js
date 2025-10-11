#!/usr/bin/env node

/**
 * Test UI Integration - Simulates what happens when role changes through UserManagementPanel
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ahqyzauvofqawtkjvjdo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXl6YXV2b2ZxYXd0a2p2amRvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA5MTEyNTIsImV4cCI6MjA0NjQ4NzI1Mn0.kBWYhwqz-Ew7mfgj8gVZAhvUJ7-dkuCzpQZXg5tPcX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('🧪 Testing UI Integration - Role Assignment Sync');
  console.log('=' .repeat(50));

  try {
    // Get test user and roles
    const { data: testUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'test@example.com')
      .single();

    if (!testUser) {
      console.log('❌ Test user not found');
      return;
    }

    const { data: roles } = await supabase
      .from('roles')
      .select('*')
      .in('title', ['Test Role A', 'Test Role B']);

    if (!roles || roles.length < 2) {
      console.log('❌ Test roles not found');
      return;
    }

    const roleA = roles.find(r => r.title === 'Test Role A');
    const roleB = roles.find(r => r.title === 'Test Role B');

    console.log(`👤 Test User: ${testUser.first_name} ${testUser.last_name} (${testUser.email})`);
    console.log(`📋 Current Role: ${testUser.role_id || 'None'}`);
    console.log(`🎯 Target Role: ${roleB.id} (${roleB.title})`);
    console.log();

    // Check current assignments
    const { data: currentAssignments } = await supabase
      .from('user_training_assignments')
      .select('*')
      .eq('user_id', testUser.id);

    console.log(`📊 Current Assignments: ${currentAssignments?.length || 0}`);
    if (currentAssignments?.length > 0) {
      currentAssignments.forEach(a => {
        console.log(`  - Training ${a.training_id} (${a.assignment_reason})`);
      });
    }
    console.log();

    // Simulate the UI flow: Update user role first, then call role assignment API
    console.log('🔄 Step 1: Updating user role in database...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ role_id: roleB.id })
      .eq('id', testUser.id);

    if (updateError) {
      console.log('❌ Failed to update user role:', updateError.message);
      return;
    }
    console.log('✅ User role updated successfully');

    // Simulate the UI calling our role assignment sync API
    console.log('🔄 Step 2: Calling role assignment sync API...');
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUser.id,
        new_role_id: roleB.id,
        old_role_id: testUser.role_id
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Role assignment sync failed:', errorText);
      return;
    }

    const result = await response.json();
    console.log('✅ Role assignment sync completed:');
    console.log(`  - Removed: ${result.removed_count} old assignments`);
    console.log(`  - Added: ${result.added_count} new assignments`);
    console.log(`  - Change logged: ${result.change_logged ? 'Yes' : 'No'}`);
    console.log();

    // Verify final state
    console.log('🔍 Verifying final state...');
    const { data: finalUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUser.id)
      .single();

    const { data: finalAssignments } = await supabase
      .from('user_training_assignments')
      .select('*')
      .eq('user_id', testUser.id);

    console.log(`👤 Final User Role: ${finalUser.role_id}`);
    console.log(`📊 Final Assignments: ${finalAssignments?.length || 0}`);
    if (finalAssignments?.length > 0) {
      finalAssignments.forEach(a => {
        console.log(`  - Training ${a.training_id} (${a.assignment_reason})`);
      });
    }

    // Check audit log
    const { data: auditLogs } = await supabase
      .from('user_role_change_log')
      .select('*')
      .eq('user_id', testUser.id)
      .order('changed_at', { ascending: false })
      .limit(1);

    if (auditLogs?.length > 0) {
      const log = auditLogs[0];
      console.log(`📝 Latest Audit Log: ${log.old_role_id} → ${log.new_role_id} at ${log.changed_at}`);
    }

    console.log();
    console.log('🎉 UI Integration Test Complete!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

main();
