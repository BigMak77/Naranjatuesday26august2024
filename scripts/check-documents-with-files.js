const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocuments() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, title, reference_code, file_url')
    .order('reference_code');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const withFiles = documents.filter(d => d.file_url);
  const withoutFiles = documents.filter(d => !d.file_url);

  console.log(`=== Document Files Status ===\n`);
  console.log(`Total documents: ${documents.length}`);
  console.log(`With files: ${withFiles.length}`);
  console.log(`Without files: ${withoutFiles.length}\n`);

  if (withFiles.length > 0) {
    console.log('Documents WITH files (first 10):');
    withFiles.slice(0, 10).forEach(d => {
      console.log(`  ${d.reference_code} - ${d.title}`);
    });
  }

  console.log('\nAll documents are currently WITHOUT attached files.');
  console.log('To fix this, you need to:');
  console.log('1. Go to /admin/documents');
  console.log('2. Edit each document');
  console.log('3. Upload a file for it');
  console.log('\nOR you can remove the download functionality for documents without files.');
}

checkDocuments();
