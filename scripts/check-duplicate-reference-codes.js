const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  const { data: documents, error } = await supabase
    .from('documents')
    .select('id, reference_code, title')
    .order('reference_code');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total documents: ${documents.length}\n`);

  // Group by reference_code
  const grouped = {};
  documents.forEach(doc => {
    const code = doc.reference_code || '(null)';
    if (!grouped[code]) {
      grouped[code] = [];
    }
    grouped[code].push(doc);
  });

  // Find duplicates
  const duplicates = Object.entries(grouped).filter(([code, docs]) => docs.length > 1);

  if (duplicates.length === 0) {
    console.log('✓ No duplicate reference codes found!');
  } else {
    console.log(`⚠️  Found ${duplicates.length} duplicate reference codes:\n`);
    duplicates.forEach(([code, docs]) => {
      console.log(`Reference Code: ${code} (${docs.length} documents)`);
      docs.forEach((doc, i) => {
        console.log(`  ${i + 1}. ${doc.title} (ID: ${doc.id})`);
      });
      console.log('');
    });
  }

  // Check null reference codes
  const nullCodes = documents.filter(d => !d.reference_code);
  if (nullCodes.length > 0) {
    console.log(`\nℹ️  ${nullCodes.length} documents have no reference code (null)`);
  }
}

checkDuplicates();
