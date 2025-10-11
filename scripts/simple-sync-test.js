const { createClient } = require('@supabase/supabase-js');

async function simpleSyncTest() {
  console.log('🔬 Simple Sync API Test...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    const { data: user } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', testUserId)
      .single();

    // 1. Clean setup
    console.log('🧹 Clean setup...');
    await supabase.from('user_assignments').delete().eq('auth_id', user.auth_id);
    await supabase.from('users').update({ role_id: role2 }).eq('id', testUserId);
    console.log('   User cleaned and set to Role 2');

    // 2. Check role assignments exist
    const { data: roleAssignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`📋 Role 2 has ${roleAssignments?.length || 0} assignments configured`);

    // 3. Test sync API
    console.log('\n🚀 Testing sync API...');
    const response = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Sync result: ${result.inserted || 0} inserted`);
      
      if ((result.inserted || 0) > 0) {
        console.log('🎉 Sync API is working!');
      } else {
        console.log('❌ Sync API returned 0 insertions');
        
        // Check if user was found by sync
        const { data: usersWithRole } = await supabase
          .from('users')
          .select('id, auth_id')
          .eq('role_id', role2);
        
        console.log(`🔍 Users with Role 2: ${usersWithRole?.length || 0}`);
        const userFound = usersWithRole?.find(u => u.id === testUserId);
        console.log(`   Test user found: ${userFound ? 'YES' : 'NO'}`);
      }
    } else {
      const error = await response.json();
      console.log('❌ Sync API failed:', error);
    }

    // 4. Check final state
    const { count: finalCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', user.auth_id);

    console.log(`📊 Final assignments: ${finalCount || 0}`);

    // 5. Now test the main API
    console.log('\n🧪 Testing main role change API...');
    
    // Set up initial state with role 1 assignments
    const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
    await supabase.from('user_assignments').delete().eq('auth_id', user.auth_id);
    await supabase.from('users').update({ role_id: role1 }).eq('id', testUserId);
    
    const role1Sync = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role1 })
    });
    
    if (role1Sync.ok) {
      const role1Result = await role1Sync.json();
      console.log(`   Setup: Added ${role1Result.inserted || 0} Role 1 assignments`);
    }

    // Now test role change
    const changeResponse = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        old_role_id: role1,
        new_role_id: role2
      })
    });

    if (changeResponse.ok) {
      const changeResult = await changeResponse.json();
      console.log(`🔄 Role change result:`);
      console.log(`   - Removed: ${changeResult.removed_assignments || 0}`);
      console.log(`   - Added: ${changeResult.added_assignments || 0}`);
      
      if ((changeResult.removed_assignments || 0) > 0 && (changeResult.added_assignments || 0) > 0) {
        console.log('🎉 PERFECT! Both removal and addition working!');
      } else if ((changeResult.removed_assignments || 0) > 0) {
        console.log('⚠️  Removal works, but addition still 0');
      }
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
simpleSyncTest();
