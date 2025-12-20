#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

console.log('🔍 Checking user_assignments table schema...\n');

// Query one row to see the columns
const { data, error } = await supabase
  .from('user_assignments')
  .select('*')
  .limit(1);

if (error) {
  console.log('❌ Error:', error.message);
} else {
  console.log('✅ user_assignments columns:');
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('(No data found, fetching schema differently...)');
  }
}
