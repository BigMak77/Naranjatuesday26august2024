const { createClient } = require('@supabase/supabase-js');

async function debugRoleAssignments() {
  console.log('🔍 Debugging Role Assignment System...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check roles table structure
    console.log('\n📋 Checking roles table...');
    const { data: roles, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .limit(10);

    if (rolesError) {
      console.log('❌ Error fetching roles:', rolesError);
    } else if (roles && roles.length > 0) {
      console.log(`✅ Found ${roles.length} roles:`);
      roles.forEach(role => {
        console.log(`   - ${role.id}: ${role.name || role.title || 'No name'}`);
      });
    } else {
      console.log('⚠️  No roles found in roles table');
    }

    // 2. Check role_assignments table
    console.log('\n📋 Checking role_assignments table...');
    const { data: roleAssignments, error: raError } = await supabase
      .from('role_assignments')
      .select('*')
      .limit(5);

    if (raError) {
      console.log('❌ Error fetching role assignments:', raError);
    } else if (roleAssignments && roleAssignments.length > 0) {
      console.log(`✅ Found ${roleAssignments.length} role assignments (showing first 5):`);
      roleAssignments.forEach(ra => {
        console.log(`   - Role: ${ra.role_id}, Item: ${ra.document_id || ra.module_id}, Type: ${ra.type}`);
      });
    } else {
      console.log('⚠️  No role assignments found');
    }

    // 3. Check user_assignments for test user
    const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
    const { data: testUser } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', testUserId)
      .single();

    if (testUser) {
      console.log(`\n📋 Checking assignments for test user (auth_id: ${testUser.auth_id})...`);
      const { data: userAssignments, error: uaError } = await supabase
        .from('user_assignments')
        .select('*')
        .eq('auth_id', testUser.auth_id)
        .limit(5);

      if (uaError) {
        console.log('❌ Error fetching user assignments:', uaError);
      } else {
        console.log(`✅ User has ${userAssignments?.length || 0} assignments (showing first 5):`);
        userAssignments?.forEach(ua => {
          console.log(`   - Item: ${ua.item_id}, Type: ${ua.item_type}, Status: ${ua.completion_status}`);
        });
      }
    }

    // 4. Check role assignment overlap for the two test roles
    const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
    const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

    console.log(`\n📋 Checking assignments for role 1 (${role1})...`);
    const { data: role1Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    console.log(`✅ Role 1 has ${role1Assignments?.length || 0} assignments`);

    console.log(`\n📋 Checking assignments for role 2 (${role2})...`);
    const { data: role2Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`✅ Role 2 has ${role2Assignments?.length || 0} assignments`);

    // 5. Check if user_role_change_log table exists
    console.log('\n📋 Checking user_role_change_log table...');
    const { data: logEntries, error: logError } = await supabase
      .from('user_role_change_log')
      .select('*')
      .limit(1);

    if (logError) {
      console.log('❌ user_role_change_log table error:', logError.message);
      if (logError.message.includes('does not exist')) {
        console.log('💡 The audit log table may not be created yet');
      }
    } else {
      console.log('✅ user_role_change_log table exists');
    }

    // 6. Test the sync-training-from-profile API
    console.log(`\n🚀 Testing sync-training-from-profile API for role 2...`);
    const syncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log('✅ Sync API responded successfully:');
      console.log(`   - Inserted: ${syncResult.inserted || 0}`);
      console.log(`   - Skipped: ${syncResult.skipped || 0}`);
    } else {
      const syncError = await syncResponse.json();
      console.log('❌ Sync API failed:', syncError);
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

// Load environment variables and run debug
require('dotenv').config({ path: '.env.local' });
debugRoleAssignments();
