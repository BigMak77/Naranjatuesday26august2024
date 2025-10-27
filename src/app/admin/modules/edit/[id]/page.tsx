"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import EditModuleTab from "@/components/modules/EditModuleTab";

interface Module {
  id: string;
  name: string;
  description?: string;
  version?: number;
  is_archived?: boolean;
  group_id?: string;
  learning_objectives?: string;
  estimated_duration?: string;
  delivery_format?: string;
  target_audience?: string;
  prerequisites?: string[];
  tags?: string[];
  thumbnail_url?: string;
  requires_follow_up?: boolean;
  review_period?: string;
  created_at?: string;
  updated_at?: string;
}

export default function EditModulePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id ?? "";
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [module, setModule] = useState<Module | null>(null);

  useEffect(() => {
    const fetchModule = async () => {
      const { data, error } = await supabase
        .from("modules")
        .select("*")
        .eq("id", id)
        .eq("is_archived", false)
        .single();

      if (error || !data) {
        setError("Module not found");
        setLoading(false);
        return;
      }

      setModule(data as Module);
      setLoading(false);
    };

    if (id) {
      void fetchModule();
    }
  }, [id]);

  const handleSuccess = () => {
    // Optionally refetch the module to show updated data
    setTimeout(() => {
      router.push("/admin/modules");
    }, 1200);
  };

  if (loading) return <p className="neon-loading">Loading module...</p>;
  if (error) return <p className="neon-error">{error}</p>;
  if (!module) return <p className="neon-error">Module not found</p>;

  return (
    <div className="mt-8">
      <EditModuleTab module={module} onSuccess={handleSuccess} />
    </div>
  );
}
