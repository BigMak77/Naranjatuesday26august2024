const { createClient } = require('@supabase/supabase-js');

async function debugSyncAPI() {
  console.log('🔍 Debugging sync-training-from-profile API...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test roles
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';
  const testUserId = 'db319889-be93-49c5-a6f3-bcbbe533aaef';

  try {
    // 1. Check if user exists and has the role
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    console.log(`👤 User: ${user.first_name} ${user.last_name}`);
    console.log(`   Current role: ${user.role_id}`);
    console.log(`   Auth ID: ${user.auth_id}`);

    // 2. Check role assignments for both roles
    console.log(`\n📋 Role assignments:`);
    
    const { data: role1Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    const { data: role2Assignments } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`   Role 1 (${role1.substring(0, 8)}...): ${role1Assignments?.length || 0} assignments`);
    if (role1Assignments && role1Assignments.length > 0) {
      role1Assignments.forEach((ra, i) => {
        const itemId = ra.document_id || ra.module_id;
        console.log(`     ${i + 1}. ${ra.type}: ${itemId}`);
      });
    }

    console.log(`   Role 2 (${role2.substring(0, 8)}...): ${role2Assignments?.length || 0} assignments`);
    if (role2Assignments && role2Assignments.length > 0) {
      role2Assignments.forEach((ra, i) => {
        const itemId = ra.document_id || ra.module_id;
        console.log(`     ${i + 1}. ${ra.type}: ${itemId}`);
      });
    }

    // 3. Test sync API directly for role 2
    console.log(`\n🚀 Testing sync API for Role 2...`);
    
    const syncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (syncResponse.ok) {
      const syncResult = await syncResponse.json();
      console.log(`   ✅ Sync API Response:`);
      console.log(`     - Inserted: ${syncResult.inserted || 0}`);
      
      if ((syncResult.inserted || 0) === 0) {
        console.log(`   🔍 Zero insertions - checking why...`);
        
        // Check if user assignments already exist
        const { data: existingAssignments } = await supabase
          .from('user_assignments')
          .select('*')
          .eq('auth_id', user.auth_id);

        console.log(`     User currently has ${existingAssignments?.length || 0} assignments:`);
        if (existingAssignments && existingAssignments.length > 0) {
          existingAssignments.slice(0, 5).forEach((ua, i) => {
            console.log(`       ${i + 1}. ${ua.item_type}: ${ua.item_id}`);
          });
        }

        // Check what sync would try to add
        if (role2Assignments && role2Assignments.length > 0) {
          console.log(`     Sync would try to add:`);
          for (const ra of role2Assignments) {
            const itemId = ra.document_id || ra.module_id;
            console.log(`       - ${ra.type}: ${itemId}`);
            
            // Check if this assignment already exists
            const existing = existingAssignments?.find(ua => 
              ua.auth_id === user.auth_id && 
              ua.item_id === itemId && 
              ua.item_type === ra.type
            );
            
            if (existing) {
              console.log(`         (Already exists - would skip)`);
            } else {
              console.log(`         (New - would add)`);
            }
          }
        }
      }
    } else {
      const syncError = await syncResponse.json();
      console.log(`   ❌ Sync API failed:`, syncError);
    }

    // 4. Manual test - clear user assignments and try sync
    console.log(`\n🧹 Manual test: Clear and sync...`);
    
    const { count: clearedCount } = await supabase
      .from('user_assignments')
      .delete()
      .eq('auth_id', user.auth_id)
      .select('*', { count: 'exact' });

    console.log(`   Cleared ${clearedCount || 0} existing assignments`);

    // Now try sync again
    const cleanSyncResponse = await fetch('http://localhost:3000/api/sync-training-from-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_id: role2 })
    });

    if (cleanSyncResponse.ok) {
      const cleanSyncResult = await cleanSyncResponse.json();
      console.log(`   ✅ Clean sync result: ${cleanSyncResult.inserted || 0} inserted`);
      
      if ((cleanSyncResult.inserted || 0) > 0) {
        console.log(`   🎉 SUCCESS! Sync works when user has no conflicting assignments`);
      } else {
        console.log(`   ❌ Still no insertions - deeper issue`);
      }
    }

    // 5. Final verification
    const { count: finalCount } = await supabase
      .from('user_assignments')
      .select('*', { count: 'exact' })
      .eq('auth_id', user.auth_id);

    console.log(`   Final assignment count: ${finalCount || 0}`);

  } catch (error) {
    console.error('💥 Debug failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
debugSyncAPI();
