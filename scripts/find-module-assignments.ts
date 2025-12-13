import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const moduleId = process.argv[2] || 'd5d5d28f-649e-47f2-82de-90fb692a3f62';

async function findModuleAssignments() {
  // First, get the module details
  console.log('🔍 Looking up module...\n');
  const { data: module } = await supabase
    .from('modules')
    .select('id, name, ref_code, version')
    .eq('id', moduleId)
    .single();

  if (!module) {
    console.log('❌ Module not found');
    return;
  }

  console.log('📦 Module Details:');
  console.log(`   Name: ${module.name}`);
  console.log(`   Ref Code: ${module.ref_code || 'N/A'}`);
  console.log(`   Version: ${module.version}`);
  console.log('');

  // Get role assignments
  console.log('🔍 Checking role assignments...\n');
  const { data: roleAssignments } = await supabase
    .from('role_assignments')
    .select('role_id')
    .eq('item_id', moduleId)
    .eq('type', 'module');

  if (roleAssignments && roleAssignments.length > 0) {
    const roleIds = roleAssignments.map(a => a.role_id);

    const { data: roles } = await supabase
      .from('roles')
      .select(`
        id,
        title,
        departments (
          name
        )
      `)
      .in('id', roleIds)
      .order('title');

    console.log(`✅ Found ${roles?.length || 0} role(s) assigned:\n`);
    roles?.forEach((role, idx) => {
      const dept = Array.isArray(role.departments) ? role.departments[0] : role.departments;
      console.log(`   ${idx + 1}. ${role.title}`);
      console.log(`      Department: ${dept?.name || 'N/A'}`);
      console.log(`      Role ID: ${role.id}`);
      console.log('');
    });
  } else {
    console.log('⚠️  No direct role assignments found\n');
  }

  // Get department assignments
  console.log('🔍 Checking department assignments...\n');
  const { data: deptAssignments } = await supabase
    .from('department_assignments')
    .select('department_id')
    .eq('item_id', moduleId)
    .eq('type', 'module');

  if (deptAssignments && deptAssignments.length > 0) {
    const deptIds = deptAssignments.map(a => a.department_id);

    const { data: departments } = await supabase
      .from('departments')
      .select('id, name')
      .in('id', deptIds)
      .order('name');

    console.log(`✅ Found ${departments?.length || 0} department(s) assigned:\n`);
    departments?.forEach((dept, idx) => {
      console.log(`   ${idx + 1}. ${dept.name}`);
      console.log(`      Department ID: ${dept.id}`);
      console.log('');
    });

    // Also show which roles belong to these departments
    if (departments && departments.length > 0) {
      console.log('   📋 Roles in these departments:\n');
      const { data: deptRoles } = await supabase
        .from('roles')
        .select('title, department_id, departments(name)')
        .in('department_id', deptIds)
        .order('title');

      deptRoles?.forEach((role) => {
        const dept = Array.isArray(role.departments) ? role.departments[0] : role.departments;
        console.log(`      • ${role.title} (${dept?.name || 'N/A'})`);
      });
      console.log('');
    }
  } else {
    console.log('⚠️  No department assignments found\n');
  }

  // Summary
  const totalRoles = roleAssignments?.length || 0;
  const totalDepts = deptAssignments?.length || 0;
  console.log('═══════════════════════════════════════');
  console.log(`📊 Summary:`);
  console.log(`   Direct role assignments: ${totalRoles}`);
  console.log(`   Department assignments: ${totalDepts}`);
  console.log('═══════════════════════════════════════');
}

findModuleAssignments();
