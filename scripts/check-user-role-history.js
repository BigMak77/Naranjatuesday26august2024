const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable() {
  console.log('Checking user_role_history table...\n');

  // Try to query the table
  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error querying table:', error);
    console.log('\nTable might not exist or has issues.');
  } else {
    console.log('Table exists and is queryable');
    console.log('Sample data:', data);
  }

  // Try with join to see the FK error
  console.log('\n\nTrying query with join...');
  const { data: joinData, error: joinError } = await supabase
    .from('user_role_history')
    .select(`
      *,
      users!user_role_history_user_id_fkey(first_name, last_name)
    `)
    .limit(1);

  if (joinError) {
    console.error('Error with join:', joinError);
  } else {
    console.log('Join successful:', joinData);
  }
}

checkTable().catch(console.error);
