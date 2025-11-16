const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkConstraints() {
  console.log('\n=== Checking documents table constraints ===\n');

  // Check table structure and constraints
  const { data, error } = await supabase.rpc('run_sql', {
    sql: `
      SELECT
        conname AS constraint_name,
        contype AS constraint_type,
        pg_get_constraintdef(c.oid) AS constraint_definition
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      JOIN pg_class cl ON cl.oid = c.conrelid
      WHERE cl.relname = 'documents'
      AND n.nspname = 'public'
      ORDER BY contype, conname;
    `
  });

  if (error) {
    console.error('Error fetching constraints:', error);

    // Try alternative query
    const { data: cols, error: colError } = await supabase
      .from('documents')
      .select('*')
      .limit(1);

    if (colError) {
      console.error('Error fetching columns:', colError);
    } else {
      console.log('\nDocument table columns:', Object.keys(cols?.[0] || {}));
    }

    // Try to find duplicate reference codes
    console.log('\n=== Checking for duplicate reference codes ===\n');
    const { data: duplicates, error: dupError } = await supabase.rpc('run_sql', {
      sql: `
        SELECT reference_code, section_id, COUNT(*) as count
        FROM documents
        WHERE reference_code IS NOT NULL
        GROUP BY reference_code, section_id
        HAVING COUNT(*) > 1;
      `
    });

    if (!dupError && duplicates) {
      console.log('Duplicate reference_code + section_id combinations:', duplicates);
    }
  } else {
    console.log('Constraints on documents table:');
    console.table(data);
  }
}

checkConstraints().catch(console.error);
