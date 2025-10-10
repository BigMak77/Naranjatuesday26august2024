require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  console.log("🔍 Quick database check...\n");
  
  try {
    // Get sample role
    console.log("Fetching sample role...");
    const { data: sampleRole } = await supabase
      .from("roles")
      .select("*")
      .limit(1)
      .single();
    
    console.log("Sample role structure:");
    console.log(JSON.stringify(sampleRole, null, 2));
    
    // Get counts
    console.log("\nFetching counts...");
    
    const { count: roleCount } = await supabase
      .from("roles")
      .select("*", { count: 'exact', head: true });
    
    const { count: roleAssignmentCount } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });
    
    const { count: userAssignmentCount } = await supabase
      .from("user_assignments")
      .select("*", { count: 'exact', head: true });
    
    console.log("\n📊 Database counts:");
    console.log(`   Roles: ${roleCount}`);
    console.log(`   Role assignments: ${roleAssignmentCount}`);
    console.log(`   User assignments: ${userAssignmentCount}`);
    
    // Check if roles have embedded data
    console.log("\nChecking for embedded role data...");
    const { data: rolesWithData } = await supabase
      .from("roles")
      .select("id, title, modules, documents");
    
    let embeddedCount = 0;
    for (const role of rolesWithData || []) {
      if ((role.modules && role.modules.length > 0) || 
          (role.documents && role.documents.length > 0)) {
        embeddedCount++;
      }
    }
    
    console.log(`   Roles with embedded data: ${embeddedCount}`);
    
    console.log("\n✅ Check complete!");
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
