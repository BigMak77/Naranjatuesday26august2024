const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSections() {
  const { data, error } = await supabase
    .from('standard_sections')
    .select('code, title, standard_id')
    .order('code');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Found ${data.length} sections:\n`);
  console.log('First 20 sections:');
  data.slice(0, 20).forEach(s => {
    console.log(`  ${s.code} - ${s.title}`);
  });

  console.log('\nLast 20 sections:');
  data.slice(-20).forEach(s => {
    console.log(`  ${s.code} - ${s.title}`);
  });

  // Check if clause codes exist
  const testCodes = ['1.1.1', '2.1.1', '3.1.1', '4.1.1', '5.1.1'];
  console.log('\nLooking for test codes:');
  testCodes.forEach(code => {
    const found = data.find(s => s.code === code);
    console.log(`  ${code}: ${found ? 'FOUND' : 'NOT FOUND'}`);
  });
}

checkSections();
