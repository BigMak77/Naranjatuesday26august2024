#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read environment variables
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = envVars.SUPABASE_PROJECT_ID;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('');
  console.error('Please ensure your .env.local file contains:');
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Read the migration file - use APPLY_THIS_FIX.sql which has everything
const migrationPath = path.join(__dirname, '..', 'APPLY_THIS_FIX.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📄 Applying complete fix for training dashboard...');
console.log('');

try {
  console.log('🔌 Connecting to Supabase API...');

  // Use Supabase SQL endpoint to execute migration
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`
    },
    body: JSON.stringify({ query: migrationSQL })
  });

  const result = await response.text();

  if (!response.ok) {
    throw new Error(`API request failed: ${result}`);
  }

  console.log('');
  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('Changes:');
  console.log('  • Created trigger function: auto_complete_training_on_test_pass()');
  console.log('  • Created trigger on test_attempts table');
  console.log('  • Backfilled existing completed training from passed tests');
  console.log('');
  console.log('The training dashboard should now update automatically when users pass tests.');

} catch (error) {
  console.error('');
  console.error('❌ Error applying migration:', error.message);

  if (error.stderr) {
    console.error('');
    console.error('Error details:');
    console.error(error.stderr);
  }

  if (error.message.includes('already exists') || error.stderr?.includes('already exists')) {
    console.error('');
    console.error('⚠️  Some objects already exist. This is likely safe to ignore.');
    console.error('    The migration may have been partially applied.');
  } else {
    process.exit(1);
  }
}
