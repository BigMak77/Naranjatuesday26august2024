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

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  console.log('Applying storage policies for modules bucket...\n');

  // Read the SQL file
  const sql = fs.readFileSync('scripts/add-modules-storage-policies-fixed.sql', 'utf8');

  // Split into individual statements (crude but works for our case)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));

  for (const statement of statements) {
    if (!statement) continue;

    console.log(`Executing: ${statement.substring(0, 60)}...`);

    try {
      // We can't execute storage policies directly via the API
      // So we'll use a workaround by connecting via PostgreSQL
      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.log(`  ⚠️  Note: ${error.message}`);
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.log(`  ⚠️  ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('IMPORTANT: If you see errors above, you need to:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy and paste the SQL from scripts/add-modules-storage-policies-fixed.sql');
  console.log('3. Click "Run"');
  console.log('='.repeat(70));

  console.log('\nVerifying bucket setup...');

  // Verify the bucket exists
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
    process.exit(1);
  }

  const modulesBucket = buckets?.find(b => b.name === 'modules');

  if (modulesBucket) {
    console.log('✅ "modules" bucket exists');
    console.log(`   Public: ${modulesBucket.public}`);
  } else {
    console.log('❌ "modules" bucket NOT found!');
  }

  console.log('\nNext steps:');
  console.log('1. Run the SQL manually in Supabase Dashboard if needed');
  console.log('2. Try uploading a file through the app to test');
})();
