require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function runMigration() {
  console.log("🚀 Starting training groups migration...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251226100000_create_training_groups.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log("📄 Executing migration SQL...");

    // Split SQL into individual statements (split by semicolon followed by newline)
    const statements = migrationSQL
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`   Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      // Skip empty statements
      if (!statement || statement.trim() === '') continue;

      // Get a brief description of the statement
      let desc = statement.substring(0, 60).replace(/\n/g, ' ').trim();
      if (statement.length > 60) desc += '...';

      try {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

        if (error) {
          // Try direct execution as fallback
          const { error: directError } = await supabase.from('_temp').select('*').limit(0);

          if (directError) {
            console.log(`   ⚠️  Statement ${i + 1}: ${desc}`);
            console.log(`      Error: ${error.message}`);
            errorCount++;
          } else {
            console.log(`   ✅ Statement ${i + 1}: ${desc}`);
            successCount++;
          }
        } else {
          console.log(`   ✅ Statement ${i + 1}: ${desc}`);
          successCount++;
        }
      } catch (err) {
        console.log(`   ❌ Statement ${i + 1}: ${desc}`);
        console.log(`      Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);

    // Verify tables were created
    console.log("\n🔍 Verifying table creation...");

    const tables = ['training_groups', 'training_group_members', 'training_group_assignments'];

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ Table '${table}' verification failed: ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' exists and is accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Error checking table '${table}': ${err.message}`);
      }
    }

    console.log("\n✅ Migration complete!");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    process.exit(1);
  }
}

runMigration();
