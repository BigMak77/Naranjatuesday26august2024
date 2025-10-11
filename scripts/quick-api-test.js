const { createClient } = require('@supabase/supabase-js');

async function quickAPITest() {
  console.log('🧪 Quick API Fix Test...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    const { data: testUser } = await supabase
      .from('users')
      .select('auth_id')
      .eq('id', testUserId)
      .single();

    // 1. Clean slate
    await supabase.from('user_assignments').delete().eq('auth_id', testUser.auth_id);
    console.log('🧹 Cleaned user assignments');

    // 2. Add Role 1 assignments
    const addResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role1 })
    });

    if (addResponse.ok) {
      const addResult = await addResponse.json();
      console.log(`✅ Added ${addResult.inserted || 0} assignments for Role 1`);
    }

    // 3. Test role change with FIXED API
    console.log('\n🚀 Testing FIXED API...');
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
      const result = await changeResponse.json();
      console.log('📊 API Results:');
      console.log(`   - Removed: ${result.removed_assignments || 0}`);
      console.log(`   - Added: ${result.added_assignments || 0}`);
      
      if ((result.removed_assignments || 0) > 0 && (result.added_assignments || 0) > 0) {
        console.log('🎉 SUCCESS! API now shows correct counts!');
      } else {
        console.log('⚠️  Still showing 0 - may need more investigation');
      }
    } else {
      const error = await changeResponse.json();
      console.log('❌ API failed:', error);
    }

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
quickAPITest();
