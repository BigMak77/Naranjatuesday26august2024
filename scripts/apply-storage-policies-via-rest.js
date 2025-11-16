const https = require('https');
const fs = require('fs');

// Read env file
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

// Extract project reference from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('Could not extract project reference from Supabase URL');
  process.exit(1);
}

console.log('Project Reference:', projectRef);
console.log('\n⚠️  IMPORTANT: Storage policies cannot be created via the API.');
console.log('You MUST apply them manually via Supabase Dashboard.\n');

console.log('=' .repeat(70));
console.log('STEP-BY-STEP INSTRUCTIONS:');
console.log('=' .repeat(70));
console.log('\n1. Open your browser and go to:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/sql/new`);
console.log('\n2. Copy and paste this SQL:\n');

const sql = fs.readFileSync('scripts/add-modules-storage-policies.sql', 'utf8');
console.log('   ' + sql.split('\n').join('\n   '));

console.log('\n3. Click the "Run" button');
console.log('\n4. You should see: "Success. No rows returned"');
console.log('\n5. Verify by going to:');
console.log(`   https://supabase.com/dashboard/project/${projectRef}/storage/buckets/modules`);
console.log('   Click on "Policies" tab and you should see 4 policies\n');

console.log('=' .repeat(70));
console.log('ALTERNATIVE: Use Supabase CLI');
console.log('=' .repeat(70));
console.log('\nIf you have Supabase CLI installed, you can run:');
console.log('   npx supabase db execute --file scripts/add-modules-storage-policies.sql\n');

console.log('=' .repeat(70));
