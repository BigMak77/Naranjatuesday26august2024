import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDepartments() {
  const deptIds = ['674d27a3-42df-4cb4-b22b-0b384a41e78a', '361020da-b01c-4b75-bc6f-721bc3253ef6'];

  const { data } = await supabase
    .from('departments')
    .select('*')
    .in('id', deptIds);

  console.log('📁 Departments:\n');
  data?.forEach(dept => {
    console.log(`   ${dept.name}`);
    console.log(`   - ID: ${dept.id}`);
    console.log('');
  });
}

checkDepartments();
