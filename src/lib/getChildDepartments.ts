// lib/getChildDepartments.ts
import { supabase } from "./supabase-client";

/**
 * Recursively fetches all child department IDs under a given department ID.
 */
export async function getChildDepartments(
  departmentId: string,
): Promise<string[]> {
  const allChildren: string[] = [];

  async function fetchChildren(id: string) {
    const { data, error } = await supabase
      .from("departments")
      .select("id")
      .eq("parent_id", id);

    if (error) {
      console.error("Failed to fetch child departments:", error);
      return;
    }

    const children = data?.map((d) => d.id) || [];
    allChildren.push(...children);

    for (const childId of children) {
      await fetchChildren(childId);
    }
  }

  await fetchChildren(departmentId);
  return [departmentId, ...allChildren]; // include the root too
}
