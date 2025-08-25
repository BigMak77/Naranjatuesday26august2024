// lib/getPolicies.ts
import { supabase } from "./supabase-client";

export async function getPolicies() {
  const { data, error } = await supabase
    .from("policies")
    .select("id, title, category_id, version_number")
    .order("title");

  if (error) {
    console.error("Error fetching policies:", error);
    return [];
  }

  return data;
}
