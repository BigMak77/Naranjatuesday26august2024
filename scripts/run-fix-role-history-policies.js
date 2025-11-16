const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local');
  console.log('This migration requires the service role key to modify RLS policies.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Applying RLS policy fixes for user_role_history...\n');

    const sqlFile = path.join(__dirname, 'fix-role-history-policies.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error('❌ Error:', error.message);
        // Continue with other statements
      } else {
        console.log('✓ Success\n');
      }
    }

    console.log('\n✓ Migration completed!');
    console.log('\nNow test the role history view in your application.');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();
