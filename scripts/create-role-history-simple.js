const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  console.log('Creating user_role_history table via SQL editor...\n');
  console.log('Please run the following SQL in your Supabase SQL Editor:\n');
  console.log('1. Go to your Supabase project dashboard');
  console.log('2. Click on "SQL Editor" in the left sidebar');
  console.log('3. Create a new query');
  console.log('4. Paste and run the SQL from: scripts/create-user-role-history-table.sql\n');
  console.log('Or copy this command:\n');
  console.log('cat scripts/create-user-role-history-table.sql\n');

  // Try using PostgREST's /rest/v1/rpc endpoint if available
  console.log('\nAlternatively, checking if we can create via API...\n');

  // First check if table already exists
  const { data: existing, error: checkError } = await supabase
    .from('user_role_history')
    .select('id')
    .limit(1);

  if (!checkError || checkError.code !== '42P01') {
    console.log('Table already exists!');
    return;
  }

  console.log('Table does not exist. Please create it manually using the SQL Editor.');
  console.log('\nSQL file location: scripts/create-user-role-history-table.sql');
}

createTable().catch(console.error);
