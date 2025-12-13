import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debug() {
  const { data: users } = await supabase.from('users').select('*').eq('first_name', 'Gail').eq('last_name', 'Cue').single();

  console.log('Gail Cue user record:');
  console.log('  auth_id:', users!.auth_id);
  console.log('  role_id:', users!.role_id);
  console.log('  department_id:', users!.department_id);

  const { data: role } = await supabase.from('roles').select('*, departments(name)').eq('id', users!.role_id).single();
  console.log('\nRole:', role!.title);
  console.log('  Role dept_id:', role!.department_id);
  console.log('  Dept name:', (role as any)!.departments?.[0]?.name);

  const { data: deptAssigns } = await supabase.from('department_assignments').select('*').eq('department_id', role!.department_id);
  console.log('\nDepartment assignments for this role dept:', deptAssigns?.length || 0);

  const { data: directDeptAssigns } = await supabase.from('department_assignments').select('*').eq('department_id', users!.department_id);
  console.log('Department assignments for user direct dept_id:', directDeptAssigns?.length || 0);

  if (role!.department_id !== users!.department_id) {
    console.log('\n⚠️  MISMATCH FOUND:');
    console.log('  user.department_id:', users!.department_id);
    console.log('  role.department_id:', role!.department_id);
  } else {
    console.log('\n✅ Department IDs match');
  }

  // Manually create the assignments
  console.log('\n🔧 Manually creating assignments for Gail...');
  const assignments = deptAssigns || [];
  for (const da of assignments) {
    const { error } = await supabase.from('user_assignments').insert({
      auth_id: users!.auth_id,
      item_id: da.item_id,
      item_type: da.type,
      assigned_at: new Date().toISOString()
    });

    if (error && error.code !== '23505') {
      console.log('  ❌ Error:', error.message);
    } else if (error?.code === '23505') {
      console.log('  ⚪ Already exists:', da.type);
    } else {
      console.log('  ✅ Created:', da.type);
    }
  }

  const { data: finalAssignments } = await supabase.from('user_assignments').select('*').eq('auth_id', users!.auth_id);
  console.log('\n📊 Gail now has', finalAssignments?.length || 0, 'assignments');
}

debug();
