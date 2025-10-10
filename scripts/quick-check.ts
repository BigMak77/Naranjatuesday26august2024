import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function quickCheck() {
  console.log("Quick database check starting...");
  
  try {
    // Get sample role
    const { data: oneRole } = await supabase
      .from("roles")
      .select("*")
      .limit(1);
    
    console.log("Sample role:", JSON.stringify(oneRole, null, 2));
    
    // Get counts
    const { count: roleCount } = await supabase
      .from("roles")
      .select("*", { count: 'exact', head: true });
    
    const { count: roleAssignmentCount } = await supabase
      .from("role_assignments")
      .select("*", { count: 'exact', head: true });
    
    const { count: userAssignmentCount } = await supabase
      .from("user_assignments")
      .select("*", { count: 'exact', head: true });
    
    console.log("Counts:");
    console.log("- Roles:", roleCount);
    console.log("- Role assignments:", roleAssignmentCount);
    console.log("- User assignments:", userAssignmentCount);
    
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
  }
  
  console.log("Quick check complete.");
}

quickCheck();
