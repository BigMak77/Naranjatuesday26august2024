import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log("📦 Applying trainer_permissions migration...\n");

  try {
    // Read the migration file
    const migrationSQL = readFileSync(
      "supabase/migrations/20251216_create_trainer_permissions.sql",
      "utf-8"
    );

    console.log("Migration SQL loaded. Attempting to apply...\n");

    // Check if table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from("trainer_permissions")
      .select("id")
      .limit(1);

    if (!checkError) {
      console.log("ℹ️  Table trainer_permissions already exists!");
      console.log("✅ Migration appears to be already applied.");
      return;
    }

    // Apply the migration by executing the SQL via RPC
    // Note: This requires a function to execute raw SQL, which may not be available
    // For now, we'll use the Supabase SQL editor or CLI
    console.log("⚠️  Please apply this migration manually using the Supabase SQL editor:");
    console.log("\n1. Go to your Supabase project dashboard");
    console.log("2. Navigate to SQL Editor");
    console.log("3. Copy and paste the contents of:");
    console.log("   supabase/migrations/20251216_create_trainer_permissions.sql");
    console.log("4. Run the query\n");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

applyMigration();
