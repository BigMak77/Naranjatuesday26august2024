const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read env file
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1]?.trim();
const supabaseServiceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1]?.trim() ||
                          env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = fs.readFileSync('./scripts/add-module-attachments.sql', 'utf8');

(async () => {
  console.log('Adding attachments column to modules table...\n');

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error executing SQL:', error);

    // Try alternative method using raw query
    console.log('\nTrying direct query method...');
    const { error: error2 } = await supabase
      .from('modules')
      .select('attachments')
      .limit(1);

    if (error2 && error2.message.includes('column') && error2.message.includes('does not exist')) {
      console.log('\nColumn does not exist yet. Please run the SQL manually:');
      console.log(sql);
      process.exit(1);
    } else if (!error2) {
      console.log('✅ Attachments column already exists!');
      process.exit(0);
    }

    process.exit(1);
  }

  console.log('✅ Successfully added attachments column!');
})();
