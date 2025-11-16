const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  console.log('Checking modules table schema...\n');

  // Query the modules table structure
  const { data, error } = await supabase
    .from('modules')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('Modules table columns:');
    console.log(JSON.stringify(Object.keys(data[0]), null, 2));
    console.log('\nSample row:');
    console.log(JSON.stringify(data[0], null, 2));
  } else {
    console.log('No data in modules table yet - checking with empty insert');
  }
})();
