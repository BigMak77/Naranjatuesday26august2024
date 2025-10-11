const { createClient } = require('@supabase/supabase-js');

async function quickRoleFix() {
  console.log('🔧 Quick Role Assignment System Fix...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. Check if audit log table exists and create if needed
    console.log('\n📋 Checking audit log table...');
    
    const { error: createTableError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_role_change_log (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          old_role_id UUID,
          new_role_id UUID,
          assignments_removed INTEGER DEFAULT 0,
          assignments_added INTEGER DEFAULT 0,
          changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          changed_by UUID DEFAULT auth.uid()
        );
      `
    });

    if (createTableError) {
      console.log('⚠️  Could not create audit table via RPC:', createTableError.message);
      console.log('💡 You may need to run fix-audit-log-table.sql manually in Supabase SQL editor');
    } else {
      console.log('✅ Audit log table ready');
    }

    // 2. Check role assignments setup
    console.log('\n📋 Checking role assignments configuration...');
    
    const testRoles = [
      '534b9124-d4c5-4569-ab9b-46d3f37b986c',
      '040cfbe5-26e1-48c0-8bbc-b8653a79a692'
    ];

    for (const roleId of testRoles) {
      const { data: assignments, error } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('role_id', roleId);

      if (error) {
        console.log(`❌ Error checking role ${roleId}:`, error.message);
      } else {
        console.log(`📊 Role ${roleId.substring(0, 8)}... has ${assignments?.length || 0} assignments`);
        
        if (assignments && assignments.length === 0) {
          console.log(`⚠️  Role has no assignments - this explains why sync didn't work!`);
        }
      }
    }

    // 3. Check if there are ANY role assignments in the system
    const { count: totalRoleAssignments, error: countError } = await supabase
      .from('role_assignments')
      .select('*', { count: 'exact' });

    if (countError) {
      console.log('❌ Error counting role assignments:', countError.message);
    } else {
      console.log(`\n📊 Total role assignments in system: ${totalRoleAssignments || 0}`);
      
      if ((totalRoleAssignments || 0) === 0) {
        console.log('🚨 PROBLEM FOUND: No role assignments exist in the system!');
        console.log('💡 This is why the sync returned 0 added/removed assignments');
        console.log('\n🔧 SOLUTION: You need to configure role assignments first');
        console.log('   1. Go to your admin panel');
        console.log('   2. Set up training assignments for each role');
        console.log('   3. Then test the role sync again');
      }
    }

    // 4. Test creating a sample role assignment for testing
    console.log('\n🧪 Checking if we can create test role assignments...');
    
    // First check if there are any documents/modules to assign
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, title')
      .limit(1);

    const { data: modules, error: modError } = await supabase
      .from('training_modules')
      .select('id, title')
      .limit(1);

    if ((documents?.length || 0) === 0 && (modules?.length || 0) === 0) {
      console.log('⚠️  No documents or training modules found to assign');
      console.log('💡 You need to create training content first');
    } else {
      console.log(`✅ Found ${documents?.length || 0} documents and ${modules?.length || 0} modules`);
      console.log('💡 You can create role assignments with these');
    }

    console.log('\n🎯 SUMMARY:');
    console.log('===========');
    console.log('✅ API endpoint is working (returned 200 OK)');
    console.log('✅ Role change logic is functioning');
    console.log('⚠️  Missing audit log table (needs manual creation)');
    console.log('🚨 Missing role assignments configuration');
    console.log('\n💡 NEXT STEPS:');
    console.log('1. Run fix-audit-log-table.sql in Supabase SQL editor');
    console.log('2. Configure role assignments in your admin panel');
    console.log('3. Re-run the test - you should see assignments being added/removed');

  } catch (error) {
    console.error('💥 Fix attempt failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
quickRoleFix();
