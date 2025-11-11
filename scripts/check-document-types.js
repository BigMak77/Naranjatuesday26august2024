const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTypes() {
  const { data, error } = await supabase
    .from('document_type')
    .select('*');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Document Types:');
    console.table(data);
  }
}

checkTypes();
