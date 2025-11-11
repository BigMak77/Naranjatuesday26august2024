const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
  console.log('Key:', supabaseServiceKey ? 'Found' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTable() {
  console.log('Creating document_archive table...\n');

  // First, let's check if the table exists
  const { data: existingTable, error: checkError } = await supabase
    .from('document_archive')
    .select('id')
    .limit(1);

  if (!checkError) {
    console.log('✓ Table already exists!');
    return;
  }

  console.log('Table does not exist. Attempting to create...\n');

  // We need to execute raw SQL
  // Try using the REST API directly
  const createTableSQL = `
-- Create document_archive table
CREATE TABLE IF NOT EXISTS document_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  archived_version INTEGER NOT NULL,
  title TEXT NOT NULL,
  reference_code TEXT,
  file_url TEXT,
  document_type_id UUID,
  notes TEXT,
  section_id UUID,
  created_at TIMESTAMPTZ,
  change_summary TEXT,
  change_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_by_auth_id UUID,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_document_archive_document_id ON document_archive(document_id);
CREATE INDEX IF NOT EXISTS idx_document_archive_archived_at ON document_archive(archived_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_archive_section_id ON document_archive(section_id);

-- Enable RLS
ALTER TABLE document_archive ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read document archives"
  ON document_archive FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to create document archives"
  ON document_archive FOR INSERT TO authenticated WITH CHECK (true);
`;

  console.log('SQL to execute:');
  console.log('=====================================');
  console.log(createTableSQL);
  console.log('=====================================\n');

  console.log('⚠️  This script cannot execute raw SQL directly.');
  console.log('\nPlease execute the SQL above manually:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and paste the SQL above');
  console.log('5. Click RUN\n');

  console.log('OR use the file: scripts/create-document-archive-table.sql\n');
}

createTable().catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
