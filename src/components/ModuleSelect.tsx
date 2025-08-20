"use client";

import React from "react";
import { supabase } from "@/lib/supabase-client";

export interface Module {
  id: string;
  name: string;
  is_archived?: boolean;
}

export default function ModuleSelect({
  value,
  onChange,
  modules,
}: {
  value: string | null;
  onChange: (id: string | null) => void;
  modules: Module[]; // injected by parent
}) {
  return (
    <select
      className="neon-input"
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Select a module…</option>
      {modules.map((m) => (
        <option key={m.id} value={m.id}>
          {m.name}
        </option>
      ))}
    </select>
  );
}

// Helper to fetch ACTIVE modules (use in parent)
export async function fetchActiveModules() {
  const { data, error } = await supabase
    .from("modules")
    .select("id,name,is_archived")
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Module[];
}
