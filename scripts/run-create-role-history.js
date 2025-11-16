const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Creating user_role_history table...\n');

  const sqlPath = path.join(__dirname, 'create-user-role-history-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    console.log(`\nExecuting statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 100) + '...\n');

    const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
      console.error(`Error executing statement ${i + 1}:`, error);
      // Continue with other statements even if one fails
    } else {
      console.log(`✓ Statement ${i + 1} executed successfully`);
    }
  }

  console.log('\n\nMigration completed!');

  // Verify the table was created
  console.log('\nVerifying table...');
  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error verifying table:', error);
  } else {
    console.log('✓ Table exists and is accessible');
  }
}

runMigration().catch(console.error);
