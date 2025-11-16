// Test script to check storage bucket access
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testBucket() {
  console.log('\n=== Testing Storage Bucket Access ===\n');

  // List all buckets
  console.log('1. Listing all buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    console.log('Available buckets:', buckets.map(b => b.name));
  }

  // Try to list files in "documents" bucket
  console.log('\n2. Listing files in "documents" bucket...');
  const { data: files, error: filesError } = await supabase.storage
    .from('documents')
    .list('', {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

  if (filesError) {
    console.error('Error listing files:', filesError);
  } else {
    console.log(`Found ${files?.length || 0} files in "documents" bucket:`);
    files?.forEach(file => {
      console.log(`  - ${file.name} (${file.metadata?.size} bytes)`);
    });
  }

  // Check if there's a bucket with a different name
  const possibleNames = ['documents', 'DOCUMENTS', 'NARANJA DOCS', 'document'];
  console.log('\n3. Checking alternative bucket names...');

  for (const bucketName of possibleNames) {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .list('', { limit: 10 });

    if (!error && data && data.length > 0) {
      console.log(`✓ Bucket "${bucketName}" exists with ${data.length} files`);
    }
  }
}

testBucket().catch(console.error);
