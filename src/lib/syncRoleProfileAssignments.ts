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

  const { data: existing } = await supabase
    .from("user_training_assignments")
    .select("type, module_id, document_id, behaviour_id")
    .eq("auth_id", auth_id);

  const key = (r: AssignmentRow) =>
    `${r.type}:${r.module_id || r.document_id || r.behaviour_id}`;
  const existingKeys = new Set(
    (existing || []).map((r) => key(r as AssignmentRow)),
  );
  const toInsert = allRows.filter((r) => !existingKeys.has(key(r)));

  if (toInsert.length > 0) {
    await supabase.from("user_training_assignments").insert(toInsert);
  }

  return { inserted: toInsert.length };
}
