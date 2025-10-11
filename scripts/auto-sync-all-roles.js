const { createClient } = require('@supabase/supabase-js');

async function syncAllUserRoleAssignments() {
  console.log('🔄 Starting automatic sync for all user role changes...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all distinct role_ids from users table
    const { data: distinctRoles, error: rolesError } = await supabase
      .from('users')
      .select('role_id')
      .not('role_id', 'is', null);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      return;
    }

    // Get unique role IDs
    const uniqueRoleIds = [...new Set(distinctRoles.map(u => u.role_id))];
    console.log(`📋 Found ${uniqueRoleIds.length} unique roles to sync`);

    let totalInserted = 0;
    let processedRoles = 0;

    // Process each role
    for (const roleId of uniqueRoleIds) {
      try {
        console.log(`\n🔄 Processing role: ${roleId}`);
        
        // Call the sync API for this role
        const response = await fetch('http://localhost:3000/api/sync-training-from-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role_id: roleId })
        });

        const result = await response.json();
        
        if (response.ok) {
          console.log(`   ✅ Synced ${result.inserted || 0} new assignments`);
          totalInserted += result.inserted || 0;
          processedRoles++;
        } else {
          console.log(`   ❌ Error: ${result.error}`);
        }
      } catch (error) {
        console.log(`   ❌ Failed to sync role ${roleId}:`, error.message);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 SYNC SUMMARY:');
    console.log(`- Roles processed: ${processedRoles}/${uniqueRoleIds.length}`);
    console.log(`- Total new assignments created: ${totalInserted}`);
    console.log('✅ Automatic sync completed');

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });
syncAllUserRoleAssignments();
