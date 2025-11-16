const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing with ANON key (what the UI uses):\n');

// Test with anon key (this is what the UI uses)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testAnonAccess() {
  const { data, error } = await supabaseAnon
    .from('user_role_history')
    .select('*');

  if (error) {
    console.error('❌ Error with ANON key:', error);
    console.log('\nThis means RLS policies are blocking access!');
  } else {
    console.log(`✓ Success with ANON key: Found ${data?.length || 0} entries`);
    if (data && data.length > 0) {
      console.log('First entry:', data[0]);
    }
  }

  console.log('\n---\n');

  if (supabaseServiceKey) {
    console.log('Testing with SERVICE ROLE key (bypasses RLS):\n');
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: serviceData, error: serviceError } = await supabaseService
      .from('user_role_history')
      .select('*');

    if (serviceError) {
      console.error('❌ Error with SERVICE key:', serviceError);
    } else {
      console.log(`✓ Success with SERVICE key: Found ${serviceData?.length || 0} entries`);
      if (serviceData && serviceData.length > 0) {
        console.log('First entry:', serviceData[0]);
      }
    }

    console.log('\n---\n');

    if (data?.length === 0 && serviceData && serviceData.length > 0) {
      console.log('⚠️  DIAGNOSIS: Data exists in table but RLS policies are blocking access!');
      console.log('\nSOLUTION: The user needs to be authenticated and have proper permissions.');
      console.log('Check that RLS policies allow the logged-in user to view role history.');
    }
  }
}

testAnonAccess().catch(console.error);
