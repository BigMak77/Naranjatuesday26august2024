#!/usr/bin/env node

/**
 * Script to add follow-up assessment tracking columns to user_assignments table
 * Run with: node run-follow-up-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Starting follow-up assessment migration...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync('add-follow-up-tracking-to-assignments.sql', 'utf8');

    console.log('📋 SQL Migration:\n');
    console.log(sql);
    console.log('\n');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--') && s !== '');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i] + ';';
      console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
      console.log(stmt.substring(0, 100) + '...\n');

      const { data, error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        // Try using the REST API instead
        console.log('⚠️ RPC failed, trying direct query...');

        // For ALTER TABLE and CREATE INDEX, we need to use the SQL editor or REST API
        // Since Supabase client doesn't support DDL directly, we'll provide instructions
        console.log('ℹ️ This statement needs to be run in Supabase SQL Editor:');
        console.log(stmt);
      } else {
        console.log('✅ Statement executed successfully');
      }
    }

    console.log('\n\n==============================================');
    console.log('⚠️ IMPORTANT: Please run the SQL manually ⚠️');
    console.log('==============================================\n');
    console.log('The Supabase JavaScript client cannot execute DDL statements.');
    console.log('Please follow these steps:\n');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy the contents of: add-follow-up-tracking-to-assignments.sql');
    console.log('4. Paste and run it in the SQL Editor\n');
    console.log('OR\n');
    console.log('If you have the DATABASE_URL connection string:');
    console.log('psql "YOUR_DATABASE_URL" < add-follow-up-tracking-to-assignments.sql\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
