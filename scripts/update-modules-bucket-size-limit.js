const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  console.log('Updating modules bucket file size limit...\n');

  // Check current bucket settings
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  const modulesBucket = buckets?.find(b => b.name === 'modules');

  if (!modulesBucket) {
    console.error('❌ "modules" bucket does not exist!');
    console.log('Run: node scripts/create-modules-storage-bucket.js');
    process.exit(1);
  }

  console.log('Current bucket settings:');
  console.log(`  - Public: ${modulesBucket.public}`);
  console.log(`  - Current file size limit: ${modulesBucket.file_size_limit ? (modulesBucket.file_size_limit / (1024 * 1024)).toFixed(0) + ' MB' : 'Not set'}`);

  // Update the bucket to allow larger files
  // Common video file sizes: 100-500 MB
  // Setting to 500 MB (524288000 bytes) for training videos
  const newSizeLimit = 524288000; // 500 MB

  console.log(`\n⚠️  Attempting to update file size limit to ${(newSizeLimit / (1024 * 1024)).toFixed(0)} MB...`);

  const { data, error } = await supabase.storage.updateBucket('modules', {
    public: true,
    fileSizeLimit: newSizeLimit,
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
      'video/webm',
      'video/x-ms-wmv',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/octet-stream' // For SCORM packages
    ]
  });

  if (error) {
    console.error('❌ Error updating bucket:', error);
    console.log('\n⚠️  You may need to update this manually in Supabase Dashboard:');
    console.log('1. Go to: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/storage/buckets');
    console.log('2. Click on the "modules" bucket');
    console.log('3. Click "Edit bucket"');
    console.log(`4. Change "File size limit" to ${(newSizeLimit / (1024 * 1024)).toFixed(0)} MB`);
    console.log('5. Click "Save"');
    process.exit(1);
  }

  console.log('✅ Bucket updated successfully!');
  console.log(`   New file size limit: ${(newSizeLimit / (1024 * 1024)).toFixed(0)} MB`);

  // Verify the update
  const { data: updatedBuckets } = await supabase.storage.listBuckets();
  const updatedBucket = updatedBuckets?.find(b => b.name === 'modules');

  if (updatedBucket) {
    console.log('\nVerified bucket settings:');
    console.log(`  - Public: ${updatedBucket.public}`);
    console.log(`  - File size limit: ${updatedBucket.file_size_limit ? (updatedBucket.file_size_limit / (1024 * 1024)).toFixed(0) + ' MB' : 'Not set'}`);
  }

  console.log('\n✅ You can now upload video files up to 500 MB!');
})();
