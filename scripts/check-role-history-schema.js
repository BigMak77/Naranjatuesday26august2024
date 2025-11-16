require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking user_role_history table schema...\n');

  const { data, error } = await supabase
    .from('user_role_history')
    .select('*')
    .limit(3);

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('📋 Sample records:');
    console.table(data);
    console.log('\n📊 Columns in user_role_history:');
    console.log(Object.keys(data[0]));
  } else {
    console.log('⚠️ No records found in user_role_history');
  }
}

checkSchema().catch(console.error);
