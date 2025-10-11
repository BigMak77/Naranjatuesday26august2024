const { createClient } = require('@supabase/supabase-js');

async function testUpdateRoleAssignmentsAPI() {
  console.log('🧪 Testing /api/update-user-role-assignments endpoint...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Please check your .env.local file has:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL');
    console.log('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Find test users with different roles
    console.log('\n📋 Finding test users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id, first_name, last_name')
      .not('role_id', 'is', null)
      .limit(10);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found:', usersError);
      return;
    }

    // Get unique roles
    const roles = [...new Set(users.map(u => u.role_id))];
    console.log(`Found ${users.length} users with ${roles.length} different roles:`);
    roles.forEach((role, i) => console.log(`   ${i + 1}. ${role}`));

    if (roles.length < 2) {
      console.error('❌ Need at least 2 different roles for testing');
      return;
    }

    // 2. Select test user and roles
    const testUser = users[0];
    const oldRoleId = testUser.role_id;
    const newRoleId = roles.find(r => r !== oldRoleId);

    console.log(`\n👤 Test User: ${testUser.first_name} ${testUser.last_name} (ID: ${testUser.id})`);
    console.log(`🔄 Role Change: ${oldRoleId} → ${newRoleId}`);

    // 3. Check initial assignments
    const { count: initialAssignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`📊 Initial assignments: ${initialAssignments || 0}`);

    // 4. Test the API endpoint
    console.log('\n🚀 Testing API endpoint...');
    
    const startTime = Date.now();
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUser.id,
        old_role_id: oldRoleId,
        new_role_id: newRoleId
      })
    });

    const responseTime = Date.now() - startTime;
    const result = await response.json();

    // 5. Display results
    console.log(`⏱️  Response time: ${responseTime}ms`);
    console.log(`📡 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log('✅ API call successful!');
      console.log(`📊 Results:`);
      console.log(`   - Removed assignments: ${result.removed_assignments || 0}`);
      console.log(`   - Added assignments: ${result.added_assignments || 0}`);
      console.log(`   - User ID: ${result.user_id}`);
      console.log(`   - Old role: ${result.old_role_id}`);
      console.log(`   - New role: ${result.new_role_id}`);
    } else {
      console.error('❌ API call failed!');
      console.error(`Error: ${result.error}`);
      if (result.details) console.error(`Details: ${result.details}`);
      return;
    }

    // 6. Verify the changes in database
    console.log('\n🔍 Verifying database changes...');
    
    const { count: finalAssignments } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', testUser.auth_id);

    console.log(`📊 Final assignments: ${finalAssignments || 0}`);

    // Check if the assignment count matches what the API reported
    const expectedFinal = result.added_assignments || 0;
    if (finalAssignments === expectedFinal) {
      console.log('✅ Assignment count matches API response');
    } else {
      console.log(`⚠️  Assignment count mismatch: Expected ${expectedFinal}, got ${finalAssignments}`);
    }

    // 7. Check role change log
    const { data: logEntry } = await supabase
      .from('user_role_change_log')
      .select('*')
      .eq('user_id', testUser.id)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (logEntry) {
      console.log('✅ Role change logged successfully');
      console.log(`   Log entry: ${logEntry.old_role_id} → ${logEntry.new_role_id}`);
    } else {
      console.log('⚠️  No role change log entry found');
    }

    // 8. Test reverting back
    console.log('\n🔄 Testing revert to original role...');
    
    const revertResponse = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUser.id,
        old_role_id: newRoleId,
        new_role_id: oldRoleId
      })
    });

    const revertResult = await revertResponse.json();
    
    if (revertResponse.ok) {
      console.log('✅ Revert successful');
      console.log(`   Back to ${revertResult.new_role_id} with ${revertResult.added_assignments} assignments`);
    } else {
      console.log('❌ Revert failed:', revertResult.error);
    }

    console.log('\n🎯 Test Summary:');
    console.log('================');
    console.log(`✅ API endpoint responding: ${response.ok ? 'YES' : 'NO'}`);
    console.log(`✅ Assignments removed: ${result.removed_assignments || 0}`);
    console.log(`✅ Assignments added: ${result.added_assignments || 0}`);
    console.log(`✅ Changes logged: ${logEntry ? 'YES' : 'NO'}`);
    console.log(`✅ Database consistent: ${finalAssignments === expectedFinal ? 'YES' : 'NO'}`);
    console.log('\n🎉 Role assignment sync test completed!');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure your development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Load environment variables and run test
require('dotenv').config({ path: '.env.local' });
testUpdateRoleAssignmentsAPI();
