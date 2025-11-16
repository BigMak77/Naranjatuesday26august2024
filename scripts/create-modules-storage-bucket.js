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
  console.log('Creating "modules" storage bucket...\n');

  // Check if bucket already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const modulesBucket = buckets?.find(b => b.name === 'modules');

  if (modulesBucket) {
    console.log('✅ "modules" bucket already exists');
  } else {
    // Create the bucket
    const { data, error } = await supabase.storage.createBucket('modules', {
      public: true,
      fileSizeLimit: 52428800, // 50 MB
      allowedMimeTypes: [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/zip',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/octet-stream' // For SCORM packages
      ]
    });

    if (error) {
      console.error('❌ Error creating bucket:', error);
      process.exit(1);
    }

    console.log('✅ "modules" bucket created successfully');
  }

  console.log('\nNow applying storage policies...\n');

  // Execute SQL to create policies
  const { error: policyError } = await supabase.rpc('exec_sql', {
    sql: `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Public read access for modules" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can upload modules" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can update modules" ON storage.objects;
      DROP POLICY IF EXISTS "Authenticated users can delete modules" ON storage.objects;

      -- Allow public read access for downloads
      CREATE POLICY "Public read access for modules"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'modules');

      -- Allow authenticated users to upload files
      CREATE POLICY "Authenticated users can upload modules"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'modules'
        AND auth.role() = 'authenticated'
      );

      -- Allow authenticated users to update their uploads
      CREATE POLICY "Authenticated users can update modules"
      ON storage.objects FOR UPDATE
      USING (
        bucket_id = 'modules'
        AND auth.role() = 'authenticated'
      )
      WITH CHECK (
        bucket_id = 'modules'
        AND auth.role() = 'authenticated'
      );

      -- Allow authenticated users to delete files
      CREATE POLICY "Authenticated users can delete modules"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'modules'
        AND auth.role() = 'authenticated'
      );
    `
  });

  if (policyError) {
    console.log('⚠️  Could not apply policies via RPC (this is normal)');
    console.log('You need to run the SQL manually in Supabase Dashboard > SQL Editor\n');
    console.log('Copy and paste this SQL:\n');
    console.log(`
-- Allow public read access for downloads
CREATE POLICY "Public read access for modules"
ON storage.objects FOR SELECT
USING (bucket_id = 'modules');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload modules"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update their uploads
CREATE POLICY "Authenticated users can update modules"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete modules"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'modules'
  AND auth.role() = 'authenticated'
);
    `);
  } else {
    console.log('✅ Storage policies applied successfully');
  }

  console.log('\n✅ Setup complete! You can now upload files to the modules bucket.');
})();
