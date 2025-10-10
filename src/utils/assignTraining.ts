import { supabase } from "@/lib/supabase-client";

export async function assignTrainingForUser(auth_id: string) {
  // 1. Get user and their role
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, role_id")
    .eq("id", auth_id)
    .single();

  if (!user || userErr) {
    console.error("User fetch error:", userErr);
    return;
  }

  // Role profiles are deprecated. If training assignment is needed, refactor to use new assignment logic.
  // This function is now a stub.
  return;
}
