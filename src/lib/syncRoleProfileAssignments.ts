import { supabase } from "@/lib/supabase-client";

export async function syncRoleProfileAssignments(auth_id: string) {
  // This function is deprecated. Role profiles are no longer used.
  // If assignment syncing is needed, refactor to use user_assignments or the new system.
  return { inserted: 0 };
}
