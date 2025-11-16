const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

console.log('Connecting to Supabase...');
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

(async () => {
  console.log('Checking if attachments column exists...\n');

  // First check if the column already exists
  const { data: testData, error: testError } = await supabase
    .from('modules')
    .select('id, attachments')
    .limit(1);

  if (!testError) {
    console.log('✅ Attachments column already exists!');
    console.log('Sample:', testData);
    process.exit(0);
  }

  if (testError && !testError.message.includes('column') && !testError.message.includes('attachments')) {
    console.error('Unexpected error:', testError);
    process.exit(1);
  }

  console.log('Column does not exist. Attempting to add it...\n');

  // Use raw SQL through a test update
  console.log('Please run this SQL in your Supabase SQL Editor:');
  console.log('\n' + '='.repeat(60));
  console.log(fs.readFileSync('./scripts/add-module-attachments.sql', 'utf8'));
  console.log('='.repeat(60) + '\n');

  console.log('After running the SQL, run this script again to verify.');
})();
