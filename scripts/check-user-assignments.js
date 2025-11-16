const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkUserAssignments() {
  console.log('Checking user_assignments table...\n');

  // 1. Check if table exists and get structure
  console.log('1. Checking table structure...');
  const { data: columns, error: columnsError } = await supabase
    .from('user_assignments')
    .select('*')
    .limit(0);

  if (columnsError) {
    console.error('❌ Error accessing user_assignments table:', columnsError.message);
    return;
  }
  console.log('✓ Table exists\n');

  // 2. Count total assignments
  console.log('2. Counting assignments...');
  const { count: totalCount, error: countError } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Error counting:', countError.message);
  } else {
    console.log(`Total assignments: ${totalCount}\n`);
  }

  // 3. Count completed assignments
  console.log('3. Checking completed assignments...');
  const { data: completedData, count: completedCount, error: completedError } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact' })
    .not('completed_at', 'is', null);

  if (completedError) {
    console.error('Error fetching completed:', completedError.message);
  } else {
    console.log(`Completed assignments: ${completedCount}`);
    if (completedData && completedData.length > 0) {
      console.log('\nSample completed assignments:');
      completedData.slice(0, 5).forEach((a, i) => {
        console.log(`  ${i + 1}. Type: ${a.item_type}, ID: ${a.item_id}, Completed: ${a.completed_at}`);
      });
    }
  }
  console.log();

  // 4. Count assignments by status
  console.log('4. Breakdown by status...');
  const { data: allData } = await supabase
    .from('user_assignments')
    .select('completed_at, opened_at');

  if (allData) {
    const completed = allData.filter(a => a.completed_at).length;
    const opened = allData.filter(a => a.opened_at && !a.completed_at).length;
    const assigned = allData.filter(a => !a.opened_at && !a.completed_at).length;

    console.log(`  Completed: ${completed}`);
    console.log(`  Opened: ${opened}`);
    console.log(`  Assigned: ${assigned}`);
  }
  console.log();

  // 5. Check RLS policies
  console.log('5. Checking RLS policies...');
  const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
    sql_query: `
      SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'user_assignments';
    `
  });

  if (policyError) {
    console.log('Could not fetch policies (may need different permissions)');
  } else if (policies) {
    console.log('RLS Policies:', JSON.stringify(policies, null, 2));
  }

  // 6. Sample data with user info
  console.log('\n6. Sample assignments with user details...');
  const { data: sampleData, error: sampleError } = await supabase
    .from('user_assignments')
    .select('auth_id, item_id, item_type, opened_at, completed_at')
    .limit(5);

  if (sampleError) {
    console.error('Error fetching sample:', sampleError.message);
  } else if (sampleData && sampleData.length > 0) {
    for (const assignment of sampleData) {
      const status = assignment.completed_at ? 'completed' : assignment.opened_at ? 'opened' : 'assigned';
      console.log(`  - Auth ID: ${assignment.auth_id}, Type: ${assignment.item_type}, Status: ${status}`);
    }
  } else {
    console.log('  No assignments found');
  }
}

checkUserAssignments().catch(console.error);
