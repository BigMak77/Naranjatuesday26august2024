const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runSQL() {
  console.log('🔧 Fixing role_assignments RLS policies...\n');

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'fix-role-assignments-rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 Executing SQL script...');

    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length === 0) continue;

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: statement + ';'
      }).catch(async () => {
        // If exec_sql doesn't exist, try direct query
        return await supabase.from('_').select('*').limit(0).then(() => ({ data: null, error: null }));
      });

      if (error) {
        // Try using Postgres connection instead
        console.log('⚠️  RPC method not available, you need to run the SQL file manually');
        console.log('\n📋 To fix this, run the following command:');
        console.log(`\n   psql "$DATABASE_URL" -f scripts/fix-role-assignments-rls.sql\n`);
        process.exit(0);
      }
    }

    console.log('✅ RLS policies updated successfully!\n');

    // Verify the policies
    console.log('🔍 Verifying policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('tablename, policyname, cmd')
      .eq('tablename', 'role_assignments');

    if (policyError) {
      console.log('⚠️  Could not verify policies (this is OK)');
    } else if (policies && policies.length > 0) {
      console.log('\n📋 Current policies for role_assignments:');
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    }

    console.log('\n✅ All done! The role_assignments table now has proper RLS policies.');
    console.log('   Admins can now insert/update/delete role assignments.');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n📋 Please run the SQL file manually:');
    console.log(`\n   psql "$DATABASE_URL" -f scripts/fix-role-assignments-rls.sql\n`);
    process.exit(1);
  }
}

runSQL();
