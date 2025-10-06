import { supabase } from "@/lib/supabase-client";

export async function syncRoleProfileAssignments(auth_id: string) {
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, role_id, department_id")
    .eq("auth_id", auth_id)
    .single();

  if (userErr || !user) throw new Error("User not found.");

  const { id: user_id, role_id, department_id } = user;

  const { data: assignments } = await supabase
    .from("role_profile_assignments")
    .select("role_profile_id, user_id, role_id, department_id");

  const profileIds = (assignments || [])
    .filter(
      (a) =>
        a.user_id === user_id ||
        a.role_id === role_id ||
        a.department_id === department_id,
    )
    .map((a) => a.role_profile_id);

  if (profileIds.length === 0) return { inserted: 0 };

  const [{ data: modules }, { data: documents }, { data: behaviours }] =
    await Promise.all([
      supabase
        .from("role_profile_modules")
        .select("module_id")
        .in("role_profile_id", profileIds),
      supabase
        .from("role_profile_documents")
        .select("document_id")
        .in("role_profile_id", profileIds),
      supabase
        .from("role_profile_behaviours")
        .select("behaviour_id")
        .in("role_profile_id", profileIds),
    ]);

  type AssignmentRow = {
    auth_id: string;
    type: "module" | "document" | "behaviour";
    module_id?: string;
    document_id?: string;
    behaviour_id?: string;
  };

  const allRows: AssignmentRow[] = [];

  for (const m of modules || []) {
    allRows.push({ auth_id, type: "module", module_id: m.module_id });
  }
  for (const d of documents || []) {
    allRows.push({ auth_id, type: "document", document_id: d.document_id });
  }
  for (const b of behaviours || []) {
    allRows.push({ auth_id, type: "behaviour", behaviour_id: b.behaviour_id });
  }

  // Instead, this function should be refactored to use user_assignments if needed, or simply return 0 if not used
  return { inserted: 0 };
}
