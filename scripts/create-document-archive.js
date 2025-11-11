const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createDocumentArchiveTable() {
  console.log('Creating document_archive table...');

  const sqlPath = path.join(__dirname, 'create-document-archive-table.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon to execute each statement separately
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    if (statement) {
      console.log('\nExecuting:', statement.substring(0, 100) + '...');
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });

      if (error) {
        console.error('Error:', error.message);
        // Continue with other statements
      } else {
        console.log('✓ Success');
      }
    }
  }

  console.log('\n✓ Document archive table creation completed!');
}

createDocumentArchiveTable().catch(console.error);
