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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || envVars.SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔍 Checking for test-related tables...\n');

// Check for tables
const { data: tables, error } = await supabase
  .rpc('exec_sql', {
    sql: `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND (
        table_name LIKE '%attempt%'
        OR table_name LIKE '%question%'
        OR table_name LIKE '%test%'
      )
      ORDER BY table_name;
    `
  });

if (error) {
  // Try direct query instead
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      query: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND (
          table_name LIKE '%attempt%'
          OR table_name LIKE '%question%'
          OR table_name LIKE '%test%'
        )
        ORDER BY table_name;
      `
    })
  });

  const result = await response.json();
  console.log('Tables found:', result);
} else {
  console.log('Tables found:', tables);
}

// Try querying test_attempts directly
console.log('\n📊 Attempting to query test_attempts table...\n');

const { data: attempts, error: attemptsError } = await supabase
  .from('test_attempts')
  .select('id, user_id, pack_id, passed')
  .limit(1);

if (attemptsError) {
  console.log('❌ Error querying test_attempts:', attemptsError.message);
  console.log('   Code:', attemptsError.code);
  console.log('\n💡 The test_attempts table may not exist or you may not have permissions.\n');
} else {
  console.log('✅ test_attempts table exists!');
  console.log('   Sample data:', attempts);
}
