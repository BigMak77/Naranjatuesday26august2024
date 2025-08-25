import { supabase } from "@/lib/supabase-client";

export async function assignDepartmentTrainingForUser(auth_id: string) {
  // 1. Get user's department
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, department_id")
    .eq("id", auth_id)
    .single();

  if (!user?.department_id || userErr) {
    console.error("User fetch or missing department error:", userErr);
    return;
  }

  const departmentId = user.department_id;

  // 2. Get modules + documents for department
  const [{ data: modules, error: modErr }, { data: documents, error: docErr }] =
    await Promise.all([
      supabase
        .from("department_modules")
        .select("module_id")
        .eq("department_id", departmentId),
      supabase
        .from("department_documents")
        .select("document_id")
        .eq("department_id", departmentId),
    ]);

  if (modErr || docErr) {
    console.error("Error fetching department training:", modErr || docErr);
    return;
  }

  // 3. Get already completed modules
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
    const { error: insertModErr } = await supabase
      .from("module_completions")
      .insert(newModuleAssignments);
    if (insertModErr) console.error("Module assignment error:", insertModErr);
  }

  // 4. Get already completed documents
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
    const { error: insertDocErr } = await supabase
      .from("document_completions")
      .insert(newDocAssignments);
    if (insertDocErr) console.error("Document assignment error:", insertDocErr);
  }
}
