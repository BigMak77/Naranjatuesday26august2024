// Check user_assignments table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkTableStructure() {
  console.log('🔍 Checking user_assignments table structure...\n');

  // Method 1: Try to get column info from information_schema
  console.log('📋 Method 1: Querying information_schema...');
  const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_assignments'
      ORDER BY ordinal_position;
    `
  });

  if (columnsError) {
    console.log('❌ Method 1 failed:', columnsError.message);
  } else if (columns) {
    console.log('✅ Column structure:');
    console.table(columns);
  }

  // Method 2: Query a sample record to see what columns exist
  console.log('\n📋 Method 2: Selecting sample record...');
  const { data: sample, error: sampleError } = await supabase
    .from('user_assignments')
    .select('*')
    .limit(1);

  if (sampleError) {
    console.log('❌ Method 2 failed:', sampleError.message);
  } else if (sample && sample.length > 0) {
    console.log('✅ Sample record columns:');
    console.log(Object.keys(sample[0]));
    console.log('\n✅ Sample record:');
    console.log(sample[0]);
  } else {
    console.log('⚠️  No records found in table');
  }

  // Method 3: Get count
  console.log('\n📋 Method 3: Checking record count...');
  const { count, error: countError } = await supabase
    .from('user_assignments')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.log('❌ Method 3 failed:', countError.message);
  } else {
    console.log(`✅ Total records: ${count}`);
  }

  // Method 4: Check specific columns that code expects
  console.log('\n📋 Method 4: Testing specific column queries...');
  const columnsToTest = [
    'auth_id',
    'item_id',
    'item_type',
    'assigned_at',
    'completed_at',
    'due_at',
    'follow_up_required',
    'follow_up_due_date',
    'follow_up_completed_at',
    'role_assignment_id',
    'created_at'
  ];

  for (const col of columnsToTest) {
    const { data, error } = await supabase
      .from('user_assignments')
      .select(col)
      .limit(1);

    if (error) {
      console.log(`❌ ${col}: DOES NOT EXIST (${error.message})`);
    } else {
      console.log(`✅ ${col}: EXISTS`);
    }
  }
}

checkTableStructure().catch(console.error);
