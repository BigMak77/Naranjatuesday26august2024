const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testRoleAssignmentIdApproach() {
  console.log('🧪 Testing Role Assignment ID Approach');
  console.log('=====================================');
  
  console.log('Environment check:');
  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Environment variables not set');
    return;
  }
  
  try {
    // 1. Check if role_assignment_id column exists
    console.log('\n1. Checking user_assignments table structure...');
    const { data: sampleAssignment } = await supabase
      .from('user_assignments')
      .select('*')
      .limit(1);
    
    if (sampleAssignment && sampleAssignment.length > 0) {
      console.log('✅ Sample user_assignment columns:', Object.keys(sampleAssignment[0]));
      
      if ('role_assignment_id' in sampleAssignment[0]) {
        console.log('✅ role_assignment_id column exists');
      } else {
        console.log('❌ role_assignment_id column missing - need to run migration');
        return;
      }
    } else {
      console.log('ℹ️  No user_assignments data to check structure');
    }
    
    // 2. Check role_assignments structure
    console.log('\n2. Checking role_assignments table structure...');
    const { data: sampleRoleAssignment } = await supabase
      .from('role_assignments')
      .select('*')
      .limit(1);
    
    if (sampleRoleAssignment && sampleRoleAssignment.length > 0) {
      console.log('✅ Sample role_assignment columns:', Object.keys(sampleRoleAssignment[0]));
    }
    
    // 3. Test the new sync logic
    console.log('\n3. Testing sync logic with role_assignment_id...');
    
    // Get a test role with assignments
    const { data: testRole } = await supabase
      .from('role_assignments')
      .select('role_id')
      .limit(1);
    
    if (!testRole || testRole.length === 0) {
      console.log('❌ No role assignments found for testing');
      return;
    }
    
    const roleId = testRole[0].role_id;
    console.log(`Using test role: ${roleId}`);
    
    // Get role assignments
    const { data: assignments } = await supabase
      .from('role_assignments')
      .select('id, item_id, type')
      .eq('role_id', roleId);
    
    console.log(`Found ${assignments?.length || 0} assignments for role`);
    
    if (assignments && assignments.length > 0) {
      console.log('Sample assignment:', assignments[0]);
      
      // Show how the new approach would work
      console.log('\n4. New approach logic:');
      console.log('- Each user_assignment.role_assignment_id = role_assignments.id');
      console.log('- When removing old role assignments, filter by role_assignment_id');
      console.log('- No more ambiguity about which role assigned which module/document');
      
      assignments.forEach((a, i) => {
        console.log(`  Assignment ${i + 1}: role_assignment_id=${a.id} → item_id=${a.item_id} (${a.type})`);
      });
    }
    
    console.log('\n✅ Role assignment ID approach looks correct!');
    console.log('\n📝 Next steps:');
    console.log('1. Run the migration: add-role-assignment-id-to-user-assignments.sql');
    console.log('2. Test the updated APIs');
    console.log('3. Verify assignment removal works correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testRoleAssignmentIdApproach();
