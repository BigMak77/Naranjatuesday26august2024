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

  // 2. Get role → profile
  const { data: role } = await supabase
    .from("roles")
    .select("role_profile_id")
    .eq("id", user.role_id)
    .single();

  if (!role?.role_profile_id) {
    console.warn("No role profile found for role:", user.role_id);
    return;
  }

  const profileId = role.role_profile_id;

  // 3. Get modules + documents from the role profile
  const [{ data: modules, error: modErr }, { data: documents, error: docErr }] =
    await Promise.all([
      supabase
        .from("role_profile_modules")
        .select("module_id")
        .eq("role_profile_id", profileId),
      supabase
        .from("role_profile_documents")
        .select("document_id")
        .eq("role_profile_id", profileId),
    ]);

  if (modErr || docErr) {
    console.error("Error fetching modules/documents:", modErr || docErr);
    return;
  }

  // 4. Assign modules if not already assigned
  const { data: existingModules } = await supabase
    .from("module_completions")
    .select("module_id")
    .eq("auth_id", auth_id);

  const existingModuleIds = new Set(existingModules?.map((m) => m.module_id));
  const newModuleAssignments = modules
    ?.filter((m) => !existingModuleIds.has(m.module_id))
    .map((m) => ({
      auth_id,
      module_id: m.module_id,
      status: "not_started",
    }));

  if (newModuleAssignments?.length > 0) {
    const { error: modInsertErr } = await supabase
      .from("module_completions")
      .insert(newModuleAssignments);
    if (modInsertErr) console.error("Module assignment error:", modInsertErr);
  }

  // 5. Assign documents if not already assigned
  const { data: existingDocs } = await supabase
    .from("document_completions")
    .select("document_id")
    .eq("auth_id", auth_id);

  const existingDocIds = new Set(existingDocs?.map((d) => d.document_id));
  const newDocAssignments = documents
    ?.filter((d) => !existingDocIds.has(d.document_id))
    .map((d) => ({
      auth_id,
      document_id: d.document_id,
      status: "not_started",
    }));

  if (newDocAssignments?.length > 0) {
    const { error: docInsertErr } = await supabase
      .from("document_completions")
      .insert(newDocAssignments);
    if (docInsertErr) console.error("Document assignment error:", docInsertErr);
  }
}
