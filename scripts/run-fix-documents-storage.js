const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('\n=== Fixing Documents Storage Bucket Policies ===\n');

  const sqlPath = path.join(__dirname, 'fix-documents-storage-policies.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split by semicolon and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`Executing statement ${i + 1}/${statements.length}...`);
    console.log(statement.substring(0, 80) + '...\n');

    const { error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
      console.error(`Error executing statement ${i + 1}:`, error.message);
      // Continue with other statements
    } else {
      console.log(`✓ Statement ${i + 1} executed successfully\n`);
    }
  }

  // Test if we can now list files
  console.log('\n=== Testing File Listing ===\n');
  const { data: files, error: listError } = await supabase.storage
    .from('documents')
    .list('', { limit: 10 });

  if (listError) {
    console.error('Still cannot list files:', listError.message);
    console.log('\nYou may need to run this SQL directly in Supabase SQL Editor:');
    console.log(sql);
  } else {
    console.log(`✓ Successfully listed ${files?.length || 0} files from documents bucket`);
    if (files && files.length > 0) {
      files.forEach(file => console.log(`  - ${file.name}`));
    }
  }

  console.log('\n=== Done ===\n');
}

runMigration().catch(console.error);
