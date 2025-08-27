"use client";
import NeonPanel from "@/components/NeonPanel";
import { FiFileText, FiPlus } from "react-icons/fi";
import { supabase } from "@/lib/supabase-client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
// Update the import path to match the actual file location and filename
// Update the import path to match the actual file location and filename
import NeonIconButton from "@/components/ui/NeonIconButton"; // <-- Ensure this file exists and the casing is correct
// If the file is actually named 'NeonIconButton.tsx', ensure the casing matches exactly.
// For example, if the file is 'NeonIconButton.tsx', this import is correct.
// If the file is 'neonIconButton.tsx', change to:
//
// import NeonIconButton from "@/components/neonIconButton";
//
// If the file is in a different folder, update the path accordingly.

type Policy = {
  id?: string;
  title?: string;
  description?: string;
  // Add more fields as needed
};

export default function PolicyDetailPage() {
  const params = useParams();
  const id =
    typeof params === "object" && params !== null && "id" in params
      ? (params as { id?: string }).id
      : undefined;
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No policy ID provided.");
      setLoading(false);
      return;
    }
    const fetchPolicy = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("policies")
        .select("*")
        .eq("id", id)
        .single();
      if (error) setError(error.message);
      setPolicy(data);
      setLoading(false);
    };
    fetchPolicy();
  }, [id]);

  if (loading)
    return (
      <NeonPanel>
        <p>Loading...</p>
      </NeonPanel>
    );
  if (error)
    return (
      <NeonPanel>
        <p className="neon-error">{error}</p>
      </NeonPanel>
    );
  if (!policy)
    return (
      <NeonPanel>
        <p>No policy found.</p>
      </NeonPanel>
    );

  return (
    <NeonPanel>
      <h1 className="flex items-center gap-2 text-xl font-bold mb-4">
        <FiFileText /> {policy.title}
      </h1>
      <p className="mb-2">{policy.description}</p>
      {/* Add more policy details here as needed */}
      <NeonIconButton variant="add" icon={<FiPlus />} title="Add Policy" />
    </NeonPanel>
  );
}
