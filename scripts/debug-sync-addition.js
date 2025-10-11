const { createClient } = require('@supabase/supabase-js');

async function debugSyncAddition() {
  console.log('🔍 Debugging why sync API adds 0 assignments...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test data from your latest run
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    // 1. Check user's current state
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    console.log(`👤 User: ${user.first_name} ${user.last_name}`);
    console.log(`   Current role_id: ${user.role_id}`);
    console.log(`   Auth ID: ${user.auth_id}`);

    // 2. Check role assignments for role2
    const { data: role2Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`\n📋 Role 2 assignments: ${role2Assignments?.length || 0}`);
    if (role2Assignments && role2Assignments.length > 0) {
      role2Assignments.forEach((ra, i) => {
        const itemId = ra.document_id || ra.module_id;
        console.log(`   ${i + 1}. ${ra.type}: ${itemId}`);
      });
    }

    // 3. Check current user assignments
    const { data: currentAssignments } = await supabase
      .from('user_assignments')
      .select('*')
      .eq('auth_id', user.auth_id);

    console.log(`\n📊 Current user assignments: ${currentAssignments?.length || 0}`);
    if (currentAssignments && currentAssignments.length > 0) {
      currentAssignments.forEach((ua, i) => {
        console.log(`   ${i + 1}. ${ua.item_type}: ${ua.item_id}`);
      });
    }

    // 4. Test sync API directly
    console.log(`\n🚀 Testing sync API directly for Role 2...`);
    
    const syncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log(`   API Response: ${syncResult.inserted || 0} inserted`);
      
      if ((syncResult.inserted || 0) === 0) {
        console.log(`\n🔍 Investigating why 0 insertions...`);
        
        // Check what sync API sees
        console.log(`   Checking what sync API logic sees:`);
        
        // Simulate sync API logic
        const { data: usersWithRole } = await supabase
          .from("users")
          .select("auth_id, id")
          .eq("role_id", role2);

        console.log(`   Users with Role 2: ${usersWithRole?.length || 0}`);
        if (usersWithRole && usersWithRole.length > 0) {
          usersWithRole.forEach((u, i) => {
            console.log(`     ${i + 1}. ID: ${u.id}, Auth: ${u.auth_id}`);
          });
        }

        // Check if our test user is in the list
        const testUserInList = usersWithRole?.find(u => u.id === testUserId);
        console.log(`   Test user in Role 2 list: ${testUserInList ? 'YES' : 'NO'}`);

        if (testUserInList && role2Assignments && role2Assignments.length > 0) {
          console.log(`\n   Simulating assignment creation:`);
          
          for (const ra of role2Assignments) {
            const itemId = ra.document_id || ra.module_id;
            console.log(`     Checking: ${ra.type}:${itemId} for auth_id:${user.auth_id}`);
            
            // Check if assignment already exists
            const existing = currentAssignments?.find(ua => 
              ua.auth_id === user.auth_id && 
              ua.item_id === itemId && 
              ua.item_type === ra.type
            );
            
            if (existing) {
              console.log(`       ❌ Already exists - would skip`);
            } else {
              console.log(`       ✅ New - would add`);
            }
          }
        }
      }
    } else {
      const syncError = await syncResponse.json();
      console.log(`   ❌ Sync API error:`, syncError);
    }

    // 5. Manual clean test
    console.log(`\n🧹 Manual test: Clear assignments and try sync...`);
    
    // Clear all assignments
    const { count: cleared } = await supabase
      .from('user_assignments')
      .delete()
      .eq('auth_id', user.auth_id)
      .select('*', { count: 'exact' });

    console.log(`   Cleared ${cleared || 0} assignments`);

    // Ensure user has role2
    await supabase
      .from('users')
      .update({ role_id: role2 })
      .eq('id', testUserId);

    console.log(`   Set user to Role 2`);

    // Try sync again
    const cleanSyncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (cleanSyncResponse.ok) {
      const cleanResult = await cleanSyncResponse.json();
      console.log(`   Clean sync result: ${cleanResult.inserted || 0} inserted`);
      
      if ((cleanResult.inserted || 0) > 0) {
        console.log(`   🎉 SUCCESS! Sync works with clean state`);
        
        // Verify assignments were added
        const { count: newCount } = await supabase
          .from('user_assignments')
          .select('*', { count: 'exact' })
          .eq('auth_id', user.auth_id);

        console.log(`   Final assignment count: ${newCount || 0}`);
      } else {
        console.log(`   ❌ Still 0 insertions - deeper issue in sync API`);
      }
    }

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
debugSyncAddition();
