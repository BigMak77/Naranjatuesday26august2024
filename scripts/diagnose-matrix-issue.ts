import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const moduleId = 'd5d5d28f-649e-47f2-82de-90fb692a3f62';
const cleanerRoleId = 'f1f0ad95-e393-4bdc-befa-030dfccd4ac1';
const cleaningDeptId = '674d27a3-42df-4cb4-b22b-0b384a41e78a';

async function diagnoseMatrixIssue() {
  console.log('🔍 DIAGNOSIS: Why "Floor Cleaning" appears in Cleaners\' matrix\n');
  console.log('═══════════════════════════════════════════════════════\n');

  // Scenario 1: Viewing with NO filters (All Departments, All Roles)
  console.log('📊 SCENARIO 1: Viewing matrix with NO filters\n');
  console.log('   When viewing ALL roles together:');
  console.log('   - The matrix shows columns for modules assigned to ANY visible role');
  console.log('   - Floor Cleaning is assigned to Canteen Manager role');
  console.log('   - Canteen Manager role IS visible in the matrix');
  console.log('   - Therefore, Floor Cleaning column WILL appear');
  console.log('   - All Cleaners will see it as "unassigned" (white cell)\n');

  // Scenario 2: Viewing with Department filter = Cleaning
  console.log('📊 SCENARIO 2: Viewing matrix filtered by Cleaning department\n');

  // Get all roles in Cleaning department
  const { data: cleaningRoles } = await supabase
    .from('roles')
    .select('id, title')
    .eq('department_id', cleaningDeptId);

  console.log(`   Roles in Cleaning department:`);
  cleaningRoles?.forEach(role => {
    console.log(`   - ${role.title} (${role.id})`);
  });

  const cleaningRoleIds = cleaningRoles?.map(r => r.id) || [];

  // Check if Floor Cleaning is assigned to any of these roles
  const { data: roleAssigns } = await supabase
    .from('role_assignments')
    .select('role_id, roles(title)')
    .eq('item_id', moduleId)
    .eq('type', 'module')
    .in('role_id', cleaningRoleIds);

  console.log(`\n   Floor Cleaning assigned to these Cleaning dept roles:`);
  if (roleAssigns && roleAssigns.length > 0) {
    roleAssigns.forEach(a => {
      const role = Array.isArray(a.roles) ? a.roles[0] : a.roles;
      console.log(`   - ${role?.title || 'Unknown'}`);
    });
  } else {
    console.log(`   - NONE ✅`);
  }

  // Check department assignments
  const { data: deptAssigns } = await supabase
    .from('department_assignments')
    .select('*')
    .eq('item_id', moduleId)
    .eq('type', 'module')
    .eq('department_id', cleaningDeptId);

  console.log(`\n   Floor Cleaning assigned to Cleaning department:`);
  if (deptAssigns && deptAssigns.length > 0) {
    console.log(`   - YES ❌ (This would be a problem)`);
  } else {
    console.log(`   - NO ✅`);
  }

  console.log(`\n   Expected behavior when filtered by Cleaning dept:`);
  console.log(`   - Floor Cleaning should NOT appear in the matrix`);

  // Scenario 3: Check if viewing by Role filter
  console.log('\n\n📊 SCENARIO 3: Viewing matrix filtered by Cleaner role\n');

  // Check if Floor Cleaning is assigned to Cleaner role
  const { data: cleanerRoleAssign } = await supabase
    .from('role_assignments')
    .select('*')
    .eq('role_id', cleanerRoleId)
    .eq('item_id', moduleId)
    .eq('type', 'module');

  console.log(`   Floor Cleaning assigned to Cleaner role:`);
  if (cleanerRoleAssign && cleanerRoleAssign.length > 0) {
    console.log(`   - YES ❌ (This would be a problem)`);
  } else {
    console.log(`   - NO ✅`);
  }

  console.log(`\n   Expected behavior when filtered by Cleaner role:`);
  console.log(`   - Floor Cleaning should NOT appear in the matrix`);

  console.log('\n\n═══════════════════════════════════════════════════════');
  console.log('💡 CONCLUSION:\n');
  console.log('   If you are seeing Floor Cleaning in the Cleaners\' view,');
  console.log('   it means you are viewing the matrix with either:');
  console.log('   1. NO filters (showing all departments/roles)');
  console.log('   2. A bug in the filtering logic\n');
  console.log('   The module should ONLY appear when:');
  console.log('   - Viewing all roles (unfiltered)');
  console.log('   - Viewing Canteen department');
  console.log('   - Viewing Canteen Manager role');
  console.log('═══════════════════════════════════════════════════════\n');
}

diagnoseMatrixIssue();
