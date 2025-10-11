const { createClient } = require('@supabase/supabase-js');

async function diagnoseRoleAssignmentIssue() {
  console.log('🔍 Deep Dive: Role Assignment Sync Issue Diagnosis...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test user details from your previous run
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    console.log('\n🧪 Test Data:');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Role 1: ${role1}`);
    console.log(`   Role 2: ${role2}`);

    // 1. Get user details
    const { data: testUser } = await supabase
      .from('users')
      .select('id, auth_id, first_name, last_name, role_id')
      .eq('id', testUserId)
      .single();

    console.log(`\n👤 User Details:`);
    console.log(`   Name: ${testUser.first_name} ${testUser.last_name}`);
    console.log(`   Auth ID: ${testUser.auth_id}`);
    console.log(`   Current Role: ${testUser.role_id}`);

    // 2. Check role_assignments table for both roles
    console.log('\n📋 Checking role_assignments table...');
    
    const { data: role1Assignments, error: r1Error } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    const { data: role2Assignments, error: r2Error } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`   Role 1 (${role1.substring(0, 8)}...): ${role1Assignments?.length || 0} assignments`);
    if (role1Assignments && role1Assignments.length > 0) {
      console.log('   Sample assignments:');
      role1Assignments.slice(0, 3).forEach(ra => {
        console.log(`     - ${ra.type}: ${ra.document_id || ra.module_id}`);
      });
    } else {
      console.log('   ⚠️  NO ASSIGNMENTS FOUND FOR ROLE 1!');
    }

    console.log(`   Role 2 (${role2.substring(0, 8)}...): ${role2Assignments?.length || 0} assignments`);
    if (role2Assignments && role2Assignments.length > 0) {
      console.log('   Sample assignments:');
      role2Assignments.slice(0, 3).forEach(ra => {
        console.log(`     - ${ra.type}: ${ra.document_id || ra.module_id}`);
      });
    } else {
      console.log('   ⚠️  NO ASSIGNMENTS FOUND FOR ROLE 2!');
    }

    // 3. Check what the API removal logic is actually looking for
    console.log('\n🔍 Testing removal logic...');
    
    if (role1Assignments && role1Assignments.length > 0) {
      console.log('   Simulating what API would try to remove:');
      
      for (const assignment of role1Assignments) {
        const item_id = assignment.document_id || assignment.module_id;
        console.log(`     Looking for user assignment: auth_id=${testUser.auth_id}, item_id=${item_id}, type=${assignment.type}`);
        
        const { data: existingAssignment } = await supabase
          .from('user_assignments')
          .select('*')
          .eq('auth_id', testUser.auth_id)
          .eq('item_id', item_id)
          .eq('item_type', assignment.type);

        if (existingAssignment && existingAssignment.length > 0) {
          console.log(`       ✅ Found matching user assignment to remove`);
        } else {
          console.log(`       ❌ No matching user assignment found`);
        }
      }
    }

    // 4. Check current user assignments
    console.log('\n📊 Current user assignments:');
    const { data: userAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', testUser.auth_id);

    console.log(`   Total: ${userAssignments?.length || 0}`);
    if (userAssignments && userAssignments.length > 0) {
      console.log('   Sample assignments:');
      userAssignments.slice(0, 5).forEach(ua => {
        console.log(`     - ${ua.item_type}: ${ua.item_id} (${ua.completion_status || 'pending'})`);
      });
    }

    // 5. Test the sync-training-from-profile API directly
    console.log('\n🚀 Testing sync-training-from-profile API...');
    
    const syncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('   ✅ Sync API Response:');
      console.log(`     - Inserted: ${syncResult.inserted || 0}`);
      console.log(`     - Skipped: ${syncResult.skipped || 0}`);
      console.log(`     - Total processed: ${syncResult.total || 0}`);
      
      if ((syncResult.inserted || 0) === 0 && (syncResult.total || 0) === 0) {
        console.log('   🚨 PROBLEM: Sync API found no assignments to process!');
      }
    } else {
      const syncError = await syncResponse.json();
      console.log('   ❌ Sync API failed:', syncError);
    }

    // 6. Check table structure
    console.log('\n🏗️  Checking table structures...');
    
    // Check if role_assignments table exists and has the right columns
    const { data: roleAssignmentsStructure, error: structError } = await supabase
      .from('role_assignments')
      .select('*')
      .limit(1);

    if (structError) {
      console.log('   ❌ role_assignments table error:', structError.message);
    } else {
      console.log('   ✅ role_assignments table accessible');
      if (roleAssignmentsStructure && roleAssignmentsStructure.length > 0) {
        console.log('   Columns:', Object.keys(roleAssignmentsStructure[0]));
      }
    }

    // 7. Final diagnosis
    console.log('\n🎯 DIAGNOSIS:');
    console.log('=============');
    
    const totalRoleAssignments = (role1Assignments?.length || 0) + (role2Assignments?.length || 0);
    
    if (totalRoleAssignments === 0) {
      console.log('🚨 ROOT CAUSE: No role assignments configured!');
      console.log('💡 SOLUTION: You need to configure training assignments for your roles');
      console.log('   1. Use admin panel to assign training to roles');
      console.log('   2. Or run: node scripts/setup-sample-role-assignments.js');
    } else {
      console.log('✅ Role assignments exist');
      console.log('🔍 Issue might be in the matching logic or data format');
    }

    console.log('\n🛠️  NEXT STEPS:');
    console.log('1. If no role assignments: Configure them in admin panel');
    console.log('2. If assignments exist: Check the matching logic in the API');
    console.log('3. Run this diagnostic again after making changes');

  } catch (error) {
    console.error('💥 Diagnosis failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
diagnoseRoleAssignmentIssue();
