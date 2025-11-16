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
  console.log('Checking Supabase Storage configuration...\n');

  // List all buckets
  console.log('=== Storage Buckets ===');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    console.log('Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  }

  // Check if 'modules' bucket exists
  const modulesBucket = buckets?.find(b => b.name === 'modules');

  if (!modulesBucket) {
    console.log('\n⚠️  WARNING: "modules" bucket does not exist!');
    console.log('You need to create it in Supabase Dashboard > Storage');
  } else {
    console.log('\n✅ "modules" bucket exists');
    console.log(`   Public: ${modulesBucket.public}`);
  }

  // Try to list files in modules bucket to test permissions
  console.log('\n=== Testing modules bucket access ===');
  const { data: files, error: filesError } = await supabase.storage
    .from('modules')
    .list('training-modules', { limit: 5 });

  if (filesError) {
    console.log('⚠️  Error accessing modules bucket:', filesError.message);
    console.log('This might be normal if the bucket is empty or folder doesn\'t exist yet');
  } else {
    console.log(`✅ Successfully accessed modules bucket`);
    console.log(`   Files found: ${files?.length || 0}`);
    if (files && files.length > 0) {
      console.log('   Recent files:');
      files.forEach(file => {
        console.log(`     - ${file.name} (${file.metadata?.size || 0} bytes)`);
      });
    }
  }

  // Note about policies
  console.log('\n=== Storage Policies ===');
  console.log('Note: Storage policies cannot be queried directly via the API.');
  console.log('Please check in Supabase Dashboard > Storage > modules > Policies');
  console.log('\nRequired policies:');
  console.log('1. SELECT (read) - Allow public or authenticated users to download');
  console.log('2. INSERT (upload) - Allow authenticated users to upload files');
  console.log('\nExample SQL to add policies:');
  console.log(`
-- Allow public read access for downloads
CREATE POLICY "Public read access for modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload modules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete modules"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);
  `);

})();
