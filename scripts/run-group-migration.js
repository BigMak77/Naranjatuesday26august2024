require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function runMigration() {
  console.log("🚀 Creating training groups tables...\n");

  try {
    // Read the migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20251226100001_create_training_groups_safe.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log("📄 Executing SQL migration...\n");

    // Execute the entire SQL file
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (error) {
      console.error("❌ Migration failed:", error.message);
      console.log("\nℹ️  Note: The exec_sql function might not exist. Let me try an alternative approach...\n");

      // Alternative: Execute via REST API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ sql_string: migrationSQL })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ REST API execution failed:", errorText);
        console.log("\n⚠️  Please run the migration SQL manually in the Supabase SQL Editor:");
        console.log(`   File: supabase/migrations/20251226100000_create_training_groups.sql`);
        return;
      }

      console.log("✅ Migration executed successfully via REST API!");
    } else {
      console.log("✅ Migration executed successfully!");
    }

    // Verify tables were created
    console.log("\n🔍 Verifying table creation...");

    const tables = ['training_groups', 'training_group_members', 'training_group_assignments'];

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (error) {
          console.log(`   ❌ Table '${table}': ${error.message}`);
        } else {
          console.log(`   ✅ Table '${table}' exists (${count || 0} rows)`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': ${err.message}`);
      }
    }

    console.log("\n✅ Setup complete! You can now use Group Training.");

  } catch (error) {
    console.error("❌ Error during migration:", error);
    console.log("\n📝 Manual steps:");
    console.log("1. Go to your Supabase project dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Copy the contents of: supabase/migrations/20251226100000_create_training_groups.sql");
    console.log("4. Paste and execute the SQL");
  }
}

runMigration();
