import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const moduleId = 'd5d5d28f-649e-47f2-82de-90fb692a3f62';

async function investigateCleanersAssignment() {
  console.log('🔍 Investigating why Floor Cleaning appears for Cleaners role\n');

  // Get the Cleaners role
  const { data: cleanersRole } = await supabase
    .from('roles')
    .select('id, title, department_id, departments(id, name)')
    .ilike('title', '%cleaner%');

  console.log('📋 Cleaners-related roles found:');
  cleanersRole?.forEach(role => {
    const dept = Array.isArray(role.departments) ? role.departments[0] : role.departments;
    console.log(`   • ${role.title}`);
    console.log(`     Role ID: ${role.id}`);
    console.log(`     Department: ${dept?.name || 'N/A'} (${role.department_id || 'No dept ID'})`);
  });
  console.log('');

  if (cleanersRole && cleanersRole.length > 0) {
    for (const role of cleanersRole) {
      console.log(`\n🔍 Checking assignments for: ${role.title}\n`);

      // Check direct role assignments for this module
      const { data: roleAssignment } = await supabase
        .from('role_assignments')
        .select('*')
        .eq('role_id', role.id)
        .eq('item_id', moduleId)
        .eq('type', 'module');

      console.log(`   Direct role assignment: ${roleAssignment && roleAssignment.length > 0 ? 'YES ✅' : 'NO ❌'}`);
      if (roleAssignment && roleAssignment.length > 0) {
        console.log(`   Assignment details:`, roleAssignment);
      }

      // Check department assignments
      if (role.department_id) {
        const { data: deptAssignment } = await supabase
          .from('department_assignments')
          .select('*')
          .eq('department_id', role.department_id)
          .eq('item_id', moduleId)
          .eq('type', 'module');

        console.log(`   Department assignment: ${deptAssignment && deptAssignment.length > 0 ? 'YES ✅' : 'NO ❌'}`);
        if (deptAssignment && deptAssignment.length > 0) {
          console.log(`   Assignment details:`, deptAssignment);
        }
      }
    }
  }

  // Now let's check ALL role_assignments for this module
  console.log('\n\n═══════════════════════════════════════');
  console.log('📊 ALL ROLE ASSIGNMENTS FOR THIS MODULE:\n');

  const { data: allRoleAssignments } = await supabase
    .from('role_assignments')
    .select('role_id, roles(title)')
    .eq('item_id', moduleId)
    .eq('type', 'module');

  if (allRoleAssignments && allRoleAssignments.length > 0) {
    allRoleAssignments.forEach((assignment, idx) => {
      const role = Array.isArray(assignment.roles) ? assignment.roles[0] : assignment.roles;
      console.log(`   ${idx + 1}. ${role?.title || 'Unknown'} (${assignment.role_id})`);
    });
  } else {
    console.log('   No role assignments found');
  }

  // Check ALL department assignments for this module
  console.log('\n📊 ALL DEPARTMENT ASSIGNMENTS FOR THIS MODULE:\n');

  const { data: allDeptAssignments } = await supabase
    .from('department_assignments')
    .select('department_id, departments(name)')
    .eq('item_id', moduleId)
    .eq('type', 'module');

  if (allDeptAssignments && allDeptAssignments.length > 0) {
    allDeptAssignments.forEach((assignment, idx) => {
      const dept = Array.isArray(assignment.departments) ? assignment.departments[0] : assignment.departments;
      console.log(`   ${idx + 1}. ${dept?.name || 'Unknown'} (${assignment.department_id})`);
    });
  } else {
    console.log('   No department assignments found');
  }
  console.log('═══════════════════════════════════════\n');
}

investigateCleanersAssignment();
