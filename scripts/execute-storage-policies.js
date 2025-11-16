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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSql(sql) {
  const { data, error } = await supabase.rpc('exec_sql', { sql });
  return { data, error };
}

(async () => {
  console.log('Attempting to apply storage policies...\n');

  // Read the SQL file
  const sqlContent = fs.readFileSync('scripts/add-modules-storage-policies.sql', 'utf8');

  // Split by semicolon and filter out comments and empty statements
  const statements = sqlContent
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && s.length > 10);

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const preview = statement.substring(0, 80).replace(/\s+/g, ' ');

    console.log(`[${i + 1}/${statements.length}] ${preview}...`);

    // Try using the REST API directly
    const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);

      // Try alternative: Direct query via PostgREST
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ sql: statement })
        });

        if (!response.ok) {
          console.log(`   ⚠️  REST API also failed: ${response.statusText}`);
        } else {
          console.log('   ✅ Applied via REST API');
        }
      } catch (restError) {
        console.log(`   ⚠️  REST API error: ${restError.message}`);
      }
    } else {
      console.log('   ✅ Success');
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('⚠️  IMPORTANT: If all statements failed above, you need to:');
  console.log('='.repeat(70));
  console.log('\n1. Open: https://supabase.com/dashboard/project/igzucjhzvghlhpqmgolb/sql/new');
  console.log('\n2. Copy and paste the SQL from:');
  console.log('   scripts/add-modules-storage-policies.sql');
  console.log('\n3. Click "Run"');
  console.log('\n4. You should see "Success. No rows returned"');
  console.log('\n' + '='.repeat(70));
})();
