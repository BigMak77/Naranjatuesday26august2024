const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findUsersWithLegacyAssignments() {
  console.log('🔍 Scanning for users with legacy assignments...');
  
  try {
    // Get all users with their role info
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, auth_id, role_id')
      .not('role_id', 'is', null);
      
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    console.log(`📊 Checking ${users.length} users for assignment mismatches...`);
    
    const problemUsers = [];
    
    for (const user of users) {
      // Count current assignments
      const { count: currentCount } = await supabase
        .from('user_assignments')
        .select('*', { count: 'exact' })
        .eq('auth_id', user.auth_id);
        
      // Count expected assignments for their role
      const { count: expectedCount } = await supabase
        .from('role_assignments')
        .select('*', { count: 'exact' })
        .eq('role_id', user.role_id);
        
      if (currentCount !== expectedCount) {
        problemUsers.push({
          user_id: user.id,
          role_id: user.role_id,
          auth_id: user.auth_id,
          current_assignments: currentCount,
          expected_assignments: expectedCount,
          mismatch: currentCount - expectedCount
        });
      }
    }
    
    console.log('\\n📋 RESULTS:');
    console.log('============');
    
    if (problemUsers.length === 0) {
      console.log('✅ No users found with assignment mismatches!');
      console.log('🎉 All users have correct assignments for their roles');
    } else {
      console.log(`🚨 Found ${problemUsers.length} users with assignment mismatches:`);
      console.log('');
      
      problemUsers.forEach((user, index) => {
        console.log(`${index + 1}. User: ${user.user_id}`);
        console.log(`   Role: ${user.role_id}`);
        console.log(`   Current: ${user.current_assignments} assignments`);
        console.log(`   Expected: ${user.expected_assignments} assignments`);
        console.log(`   Mismatch: ${user.mismatch > 0 ? '+' : ''}${user.mismatch}`);
        console.log('   Status: 🚨 NEEDS FIXING');
        console.log('');
      });
      
      console.log('💡 These users likely moved roles but kept old assignments');
      console.log('🔧 Run the bulk fix script to resolve all at once');
    }
    
    return problemUsers;
    
  } catch (error) {
    console.error('💥 Scan failed:', error);
  }
}

// Execute the scan
findUsersWithLegacyAssignments();
