const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRoleHistory() {
  console.log('Checking user_role_history table...\n');

  // Query all data from the table
  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .order('changed_at', { ascending: false });

  if (error) {
    console.error('Error querying table:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No data found in user_role_history table.');
    console.log('\nMake sure:');
    console.log('1. The table was created (run setup-role-history-complete.sql)');
    console.log('2. The trigger is active (check triggers on users table)');
    console.log('3. You have changed a user\'s role after creating the trigger');
    return;
  }

  console.log(`Found ${data.length} entries:\n`);

  data.forEach((entry, index) => {
    console.log(`Entry ${index + 1}:`);
    console.log('  ID:', entry.id);
    console.log('  User ID:', entry.user_id);
    console.log('  Old Role ID:', entry.old_role_id);
    console.log('  New Role ID:', entry.new_role_id);
    console.log('  Old Department ID:', entry.old_department_id);
    console.log('  New Department ID:', entry.new_department_id);
    console.log('  Changed By:', entry.changed_by);
    console.log('  Changed At:', entry.changed_at);
    console.log('  Created At:', entry.created_at);
    console.log('');
  });
}

checkRoleHistory().catch(console.error);
