const { createClient } = require('@supabase/supabase-js');

async function setupTestRoleAssignments() {
  console.log('🔧 Setting up test role assignments...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Your test roles from the previous run
  const role1 = '534b9124-d4c5-4569-ab9b-46d3f37b986c';
  const role2 = '040cfbe5-26e1-48c0-8bbc-b8653a79a692';

  try {
    // 1. Check if we have training modules and documents to assign
    console.log('\n📋 Checking available training content...');
    
    const { data: modules } = await supabase
      .from('modules')
      .select('id, name')
      .limit(10);

    const { data: documents } = await supabase
      .from('documents')
      .select('id, title')
      .limit(10);

    console.log(`   Found ${modules?.length || 0} training modules`);
    console.log(`   Found ${documents?.length || 0} training documents`);

    if (modules && modules.length > 0) {
      console.log('   Sample modules:');
      modules.slice(0, 3).forEach(m => console.log(`     - ${m.name} (${m.id})`));
    }

    if (documents && documents.length > 0) {
      console.log('   Sample documents:');
      documents.slice(0, 3).forEach(d => console.log(`     - ${d.title} (${d.id})`));
    }

    if ((!modules || modules.length === 0) && (!documents || documents.length === 0)) {
      console.log('🚨 No training content found!');
      console.log('💡 You need to create modules or documents first in the admin panel');
      return;
    }

    // 2. Clear existing role assignments for test roles
    console.log('\n🧹 Clearing existing role assignments...');
    
    const { error: clearError } = await supabase
      .from('role_assignments')
      .delete()
      .in('role_id', [role1, role2]);

    if (clearError) {
      console.log('⚠️  Error clearing assignments:', clearError.message);
    } else {
      console.log('✅ Cleared existing assignments');
    }

    // 3. Create sample assignments for Role 1
    console.log(`\n📝 Creating assignments for Role 1 (${role1.substring(0, 8)}...)...`);
    
    const role1Assignments = [];
    
    // Assign first 2 modules to role 1
    if (modules && modules.length >= 2) {
      role1Assignments.push(
        { role_id: role1, module_id: modules[0].id, type: 'module' },
        { role_id: role1, module_id: modules[1].id, type: 'module' }
      );
    }
    
    // Assign first 2 documents to role 1
    if (documents && documents.length >= 2) {
      role1Assignments.push(
        { role_id: role1, document_id: documents[0].id, type: 'document' },
        { role_id: role1, document_id: documents[1].id, type: 'document' }
      );
    }

    if (role1Assignments.length > 0) {
      const { error: r1Error } = await supabase
        .from('role_assignments')
        .insert(role1Assignments);

      if (r1Error) {
        console.log('❌ Error creating Role 1 assignments:', r1Error.message);
      } else {
        console.log(`✅ Created ${role1Assignments.length} assignments for Role 1`);
      }
    }

    // 4. Create sample assignments for Role 2
    console.log(`\n📝 Creating assignments for Role 2 (${role2.substring(0, 8)}...)...`);
    
    const role2Assignments = [];
    
    // Assign different modules to role 2 (to test the difference)
    if (modules && modules.length >= 4) {
      role2Assignments.push(
        { role_id: role2, module_id: modules[2].id, type: 'module' },
        { role_id: role2, module_id: modules[3].id, type: 'module' }
      );
    } else if (modules && modules.length >= 2) {
      // Use same modules if we don't have enough
      role2Assignments.push(
        { role_id: role2, module_id: modules[0].id, type: 'module' }
      );
    }
    
    // Assign different documents to role 2
    if (documents && documents.length >= 4) {
      role2Assignments.push(
        { role_id: role2, document_id: documents[2].id, type: 'document' },
        { role_id: role2, document_id: documents[3].id, type: 'document' }
      );
    } else if (documents && documents.length >= 2) {
      // Use different document if we don't have enough
      role2Assignments.push(
        { role_id: role2, document_id: documents[1].id, type: 'document' }
      );
    }

    if (role2Assignments.length > 0) {
      const { error: r2Error } = await supabase
        .from('role_assignments')
        .insert(role2Assignments);

      if (r2Error) {
        console.log('❌ Error creating Role 2 assignments:', r2Error.message);
      } else {
        console.log(`✅ Created ${role2Assignments.length} assignments for Role 2`);
      }
    }

    // 5. Verify the assignments were created
    console.log('\n🔍 Verifying role assignments...');
    
    const { data: finalRole1 } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role1);

    const { data: finalRole2 } = await supabase
      .from('role_assignments')
      .select('*')
      .eq('role_id', role2);

    console.log(`   Role 1 final assignments: ${finalRole1?.length || 0}`);
    console.log(`   Role 2 final assignments: ${finalRole2?.length || 0}`);

    if ((finalRole1?.length || 0) > 0 && (finalRole2?.length || 0) > 0) {
      console.log('\n🎉 SUCCESS! Role assignments created!');
      console.log('\n🧪 Now run your test again:');
      console.log('   node scripts/test-update-role-api.js');
      console.log('\n✅ You should now see assignments being removed and added!');
    } else {
      console.log('\n❌ Something went wrong - assignments not created properly');
    }

  } catch (error) {
    console.error('💥 Setup failed:', error.message);
  }
}

require('dotenv').config({ path: '.env.local' });
setupTestRoleAssignments();
