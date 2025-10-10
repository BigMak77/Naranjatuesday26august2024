import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function checkRolesTable() {
  console.log("🔍 Checking roles table for embedded data...\n");

  try {
    // Get first few roles to see the structure
    const { data: sampleRoles } = await supabase
      .from("roles")
      .select("*")
      .limit(5);

    console.log("📋 Sample roles structure:");
    if (sampleRoles && sampleRoles.length > 0) {
      console.log(JSON.stringify(sampleRoles[0], null, 2));
    }

    // Check for any roles with embedded modules or documents
    const { data: allRoles } = await supabase
      .from("roles")
      .select("id, title, modules, documents");

    let rolesWithModules = 0;
    let rolesWithDocuments = 0;
    let totalEmbeddedModules = 0;
    let totalEmbeddedDocuments = 0;

    console.log("\n📊 Analyzing roles for embedded data:");
    
    if (allRoles) {
      for (const role of allRoles) {
        let hasModules = false;
        let hasDocuments = false;
        
        if (role.modules) {
          if (Array.isArray(role.modules) && role.modules.length > 0) {
            hasModules = true;
            rolesWithModules++;
            totalEmbeddedModules += role.modules.length;
          } else if (typeof role.modules === 'string' && role.modules.trim() !== '') {
            hasModules = true;
            rolesWithModules++;
            totalEmbeddedModules += 1; // Assume 1 if it's a string
          }
        }
        
        if (role.documents) {
          if (Array.isArray(role.documents) && role.documents.length > 0) {
            hasDocuments = true;
            rolesWithDocuments++;
            totalEmbeddedDocuments += role.documents.length;
          } else if (typeof role.documents === 'string' && role.documents.trim() !== '') {
            hasDocuments = true;
            rolesWithDocuments++;
            totalEmbeddedDocuments += 1; // Assume 1 if it's a string
          }
        }
        
        if (hasModules || hasDocuments) {
          console.log(`   ${role.title}:`);
          if (hasModules) {
            const moduleCount = Array.isArray(role.modules) ? role.modules.length : 1;
            console.log(`     - ${moduleCount} embedded modules`);
          }
          if (hasDocuments) {
            const docCount = Array.isArray(role.documents) ? role.documents.length : 1;
            console.log(`     - ${docCount} embedded documents`);
          }
        }
      }
    }

    console.log(`\n📈 Summary:`);
    console.log(`   Total roles: ${allRoles?.length || 0}`);
    console.log(`   Roles with embedded modules: ${rolesWithModules}`);
    console.log(`   Roles with embedded documents: ${rolesWithDocuments}`);
    console.log(`   Total embedded modules: ${totalEmbeddedModules}`);
    console.log(`   Total embedded documents: ${totalEmbeddedDocuments}`);

    // Check role_assignments table
    const { count: roleAssignmentCount } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });

    console.log(`\n🔗 Current role_assignments table:`);
    console.log(`   Total role assignments: ${roleAssignmentCount}`);

    if (totalEmbeddedModules + totalEmbeddedDocuments > 0) {
      console.log(`\n⚠️  MIGRATION NEEDED:`);
      console.log(`   ${totalEmbeddedModules + totalEmbeddedDocuments} embedded assignments need to be migrated to role_assignments table`);
    } else {
      console.log(`\n✅ No embedded data found in roles table`);
    }

  } catch (error) {
    console.error("Error checking roles table:", error);
  }
}

checkRolesTable().catch(console.error);
