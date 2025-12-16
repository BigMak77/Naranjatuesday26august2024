#!/usr/bin/env node

/**
 * Apply document_modules migration to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  console.log('📦 Applying document_modules migration...\n');

  const migrationPath = join(__dirname, '../supabase/migrations/20251216_create_document_modules_junction.sql');
  const migrationSQL = readFileSync(migrationPath, 'utf8');

  console.log('Migration SQL loaded. Attempting to apply...\n');

  try {
    // Try to verify if table already exists
    const { error: checkError } = await supabase
      .from('document_modules')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('ℹ️  Table document_modules already exists!');
      console.log('✅ Migration appears to be already applied.\n');
      return;
    }

    // Table doesn't exist, we need to create it
    console.log('⚠️  Cannot apply migration automatically via Supabase client.');
    console.log('The Supabase JS client does not support raw SQL execution.\n');
    console.log('📋 Please apply this SQL manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/' + process.env.SUPABASE_PROJECT_ID + '/sql');
    console.log('2. Click "New Query"');
    console.log('3. Paste and run the following SQL:\n');
    console.log('─'.repeat(80));
    console.log(migrationSQL);
    console.log('─'.repeat(80));
    console.log('\n4. Click "Run" to execute\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nPlease apply the SQL manually as shown above.');
  }
}

applyMigration();
