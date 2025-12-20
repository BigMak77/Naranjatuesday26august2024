#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the migration file
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251219_auto_complete_training_on_test_pass.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

console.log('📄 Applying migration: 20251219_auto_complete_training_on_test_pass.sql');
console.log('');

// Execute the migration
try {
  // Split by statement delimiter and execute each statement
  const statements = migrationSQL
    .split(/;[\s]*(?=CREATE|DROP|DO|COMMENT|ALTER|INSERT|UPDATE)/gi)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim() + ';');

  console.log(`📊 Found ${statements.length} SQL statements to execute`);
  console.log('');

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] Executing: ${preview}...`);

    const { error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
      // If exec_sql doesn't exist, try direct query
      const { error: queryError } = await supabase.from('_').select('*').limit(0);

      // Try using the Supabase management API instead
      console.log('⚠️  Using direct SQL execution (exec_sql RPC not available)');

      // We'll execute the full migration as one block
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ sql: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to execute migration: ${errorText}`);
      }

      break;
    }
  }

  console.log('');
  console.log('✅ Migration applied successfully!');
  console.log('');
  console.log('The training dashboard should now update automatically when users pass tests.');

} catch (error) {
  console.error('');
  console.error('❌ Error applying migration:', error.message);
  console.error('');
  console.error('💡 Attempting to apply via connection string...');

  // Provide alternative method
  console.error('');
  console.error('Please run the migration manually using:');
  console.error('');
  console.error('cat supabase/migrations/20251219_auto_complete_training_on_test_pass.sql | \\');
  console.error('psql "your-connection-string-here"');
  console.error('');
  process.exit(1);
}
