#!/usr/bin/env node

/**
 * Script to apply the document_modules migration to Supabase
 * This creates the junction table for linking documents to training modules
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('📦 Applying document_modules migration...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251216_create_document_modules_junction.sql');
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

  try {
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // If exec_sql function doesn't exist, try direct execution
      console.log('⚠️  exec_sql not available, trying direct SQL execution...\n');

      // Split into individual statements and execute them
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        const { error: execError } = await supabase.rpc('exec', {
          query: statement + ';'
        });

        if (execError) {
          console.error('❌ Error executing statement:', statement.substring(0, 100) + '...');
          console.error('Error details:', execError);
          throw execError;
        }
      }
    }

    console.log('✅ Migration applied successfully!\n');
    console.log('Created:');
    console.log('  - document_modules table');
    console.log('  - Indexes on document_id and module_id');
    console.log('  - RLS policies for authenticated users\n');

    // Verify the table was created
    const { data: tables, error: tablesError } = await supabase
      .from('document_modules')
      .select('id')
      .limit(0);

    if (tablesError && tablesError.code === '42P01') {
      console.error('❌ Table was not created. Please run the SQL manually in Supabase dashboard.');
      console.log('\nSQL to run:');
      console.log(migrationSQL);
      process.exit(1);
    } else if (!tablesError) {
      console.log('✅ Verified: document_modules table exists and is accessible\n');
    }

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    console.log('\n📋 Please apply this SQL manually in your Supabase dashboard:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql');
    console.log('2. Create a new query');
    console.log('3. Paste and run the following SQL:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    process.exit(1);
  }
}

applyMigration();
