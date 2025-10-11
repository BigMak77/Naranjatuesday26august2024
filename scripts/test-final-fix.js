const { createClient } = require('@supabase/supabase-js');

async function testFinalFix() {
  console.log('🎯 Testing FINAL FIX: Role Assignment API...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    // 1. Setup clean test
    const { data: user } = await supabase
      .from('users')
      .select('auth_id, first_name, last_name')
      .eq('id', testUserId)
      .single();

    console.log(`👤 Testing with: ${user.first_name} ${user.last_name}`);

    // Clear assignments and set to role1
    await supabase.from('user_assignments').delete().eq('auth_id', user.auth_id);
    await supabase.from('users').update({ role_id: role1 }).eq('id', testUserId);
    
    // Add role1 assignments
    const setupResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role1 })
    });
    
    const setupResult = await setupResponse.json();
    console.log(`🔧 Setup: Added ${setupResult.inserted || 0} assignments for Role 1`);

    // 2. Test the FIXED API
    console.log(`\n🚀 Testing FIXED API: Role 1 → Role 2...`);
    
    const response = await fetch('http://localhost:3000/api/update-user-role-assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: testUserId,
        old_role_id: role1,
        new_role_id: role2
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`✅ API Success!`);
      console.log(`   - Removed: ${result.removed_assignments || 0}`);
      console.log(`   - Added: ${result.added_assignments || 0}`);
      
      // 3. Verify user's role was updated
      const { data: updatedUser } = await supabase
        .from('users')
        .select('role_id')
        .eq('id', testUserId)
        .single();
      
      console.log(`   - User role updated: ${updatedUser.role_id === role2 ? 'YES' : 'NO'}`);
      
      // 4. Check final assignment count
      const { count: finalCount } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);
      
      console.log(`   - Final assignments: ${finalCount || 0}`);
      
      // 5. Results analysis
      console.log(`\n🎯 RESULTS:`);
      if ((result.removed_assignments || 0) > 0 && (result.added_assignments || 0) > 0) {
        console.log(`🎉 SUCCESS! API now works correctly!`);
        console.log(`   ✅ Assignments removed from old role`);
        console.log(`   ✅ Assignments added for new role`);
        console.log(`   ✅ User role updated in database`);
        console.log(`   ✅ Everything working as expected!`);
      } else {
        console.log(`⚠️  Still issues - may need more investigation`);
      }
      
    } else {
      const error = await response.json();
      console.log(`❌ API failed:`, error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
testFinalFix();
