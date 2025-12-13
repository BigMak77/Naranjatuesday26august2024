import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoleRelationship() {
  // Get both roles
  const { data: roles } = await supabase
    .from('roles')
    .select('id, title, department_id, departments(id, name)')
    .or('title.ilike.%cleaner%,title.ilike.%canteen%');

  console.log('📋 Roles:\n');
  roles?.forEach(role => {
    const dept = Array.isArray(role.departments) ? role.departments[0] : role.departments;
    console.log(`   ${role.title}`);
    console.log(`   - Role ID: ${role.id}`);
    console.log(`   - Department ID: ${role.department_id || 'None'}`);
    console.log(`   - Department Name: ${dept?.name || 'N/A'}`);
    console.log('');
  });

  // Check if they share the same department
  const cleanerRole = roles?.find(r => r.title?.toLowerCase().includes('cleaner'));
  const canteenRole = roles?.find(r => r.title?.toLowerCase().includes('canteen'));

  if (cleanerRole && canteenRole) {
    console.log('🔍 Comparison:');
    console.log(`   Same department? ${cleanerRole.department_id === canteenRole.department_id ? 'YES ✅' : 'NO ❌'}`);
    if (cleanerRole.department_id === canteenRole.department_id && cleanerRole.department_id) {
      console.log(`   They both belong to department: ${cleanerRole.department_id}`);
    }
  }
}

checkRoleRelationship();
