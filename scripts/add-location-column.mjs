#!/usr/bin/env node

/**
 * Add location column to users table
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

async function addLocationColumn() {
  console.log('📦 Adding location column to users table...\n');

  try {
    // Check if location column already exists by trying to query it
    const { error: checkError } = await supabase
      .from('users')
      .select('location')
      .limit(1);

    if (!checkError) {
      console.log('✅ Location column already exists!');
      return;
    }

    // If we got here, the column doesn't exist
    console.log('⚠️  Cannot apply migration automatically via Supabase client.');
    console.log('The Supabase JS client does not support raw SQL execution.\n');
    console.log('📋 Please apply this SQL manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
    console.log('2. Click "New Query"');
    console.log('3. Paste and run the following SQL:\n');
    console.log('─'.repeat(80));
    console.log(`
-- Add location column to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN users.location IS 'User''s selected location (England, Wales, Poland, or Group)';
    `);
    console.log('─'.repeat(80));
    console.log('\n4. Click "Run" to execute\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

addLocationColumn();
