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

async function fixRoleHistoryPolicy() {
  console.log('Fixing user_role_history RLS policies...\n');

  // Drop the old policy
  console.log('1. Dropping old "System can insert role history" policy...');
  const { error: dropError } = await supabase.rpc('exec_sql', {
    sql_query: 'DROP POLICY IF EXISTS "System can insert role history" ON user_role_history'
  });

  if (dropError) {
    console.error('Error dropping policy:', dropError.message);
  } else {
    console.log('✓ Old policy dropped\n');
  }

  // Create new policy
  console.log('2. Creating "Authenticated users can insert role history" policy...');
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql_query: `CREATE POLICY "Authenticated users can insert role history" ON user_role_history
  FOR INSERT
  TO authenticated
  WITH CHECK (true)`
  });

  if (createError) {
    console.error('Error creating policy:', createError.message);
    console.error('Details:', createError);
  } else {
    console.log('✓ New policy created\n');
  }

  // Add comment
  console.log('3. Adding policy comment...');
  const { error: commentError } = await supabase.rpc('exec_sql', {
    sql_query: `COMMENT ON POLICY "Authenticated users can insert role history" ON user_role_history
  IS 'Allow authenticated users to insert role history records when changing departments/roles'`
  });

  if (commentError) {
    console.error('Warning - could not add comment:', commentError.message);
  } else {
    console.log('✓ Comment added\n');
  }

  console.log('Policy fix complete!');
  console.log('\nNow authenticated users can insert role history records.');
}

fixRoleHistoryPolicy().catch(console.error);
