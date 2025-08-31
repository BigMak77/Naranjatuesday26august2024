// components/CreateAuditTab.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";

interface Section {
  id: string;
  title: string;
}

export default function CreateAuditTab() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [version, setVersion] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const editId = sessionStorage.getItem("edit_template_id");
    const fetchData = async () => {
      const sRes = await supabase
        .from("standard_sections")
        .select("id, title")
        .order("title");
      if (!sRes.error) setSections(sRes.data || []);

      if (editId) {
        const { data: tpl, error: tErr } = await supabase
          .from("audit_templates")
          .select("title, description, frequency, version, standard_section_id")
          .eq("id", editId)
          .single();
        if (tpl && !tErr) {
          setTitle(tpl.title || "");
          setDescription(tpl.description || "");
          setFrequency(tpl.frequency || "");
          setVersion(tpl.version || "");
          setSectionId(tpl.standard_section_id || "");
        }
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    let inserted = null;
    let error = null;
    const editId = sessionStorage.getItem("edit_template_id");
    if (editId) {
      ({ error } = await supabase
        .from("audit_templates")
        .update({
          title,
          description,
          frequency,
          version,
          standard_section_id: sectionId || null,
        })
        .eq("id", editId));
      inserted = { id: editId };
    } else {
      ({ data: inserted, error } = await supabase
        .from("audit_templates")
        .insert({
          title,
          description,
          frequency,
          version,
          standard_section_id: sectionId || null,
          created_by: user?.id || null,
        })
        .select("id")
        .single());
    }
    if (error || !inserted) {
      alert("Error creating template: " + error?.message);
      setLoading(false);
      return;
    }
    alert(
      editId
        ? "Audit template updated successfully"
        : "Audit template created successfully",
    );
    sessionStorage.removeItem("edit_template_id");
    setLoading(false);
    setTitle("");
    setDescription("");
    setFrequency("");
    setVersion("");
    setSectionId("");
    router.refresh();
  };

  return (
    <NeonForm
      title="Create Audit Template"
      onSubmit={handleSubmit}
      submitLabel={loading ? "Saving..." : "Create Template"}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="neon-input"
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
            className="neon-input"
            rows={2}
          />
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="neon-input"
            required
          >
            <option value="">Select Frequency</option>
            {["Monthly", "Quarterly", "Yearly"].map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="Version"
            className="neon-input"
          />
          <select
            value={sectionId}
            onChange={(e) => setSectionId(e.target.value)}
            className="neon-input"
          >
            <option value="">Link to Standard Section (optional)</option>
            {sections.map((s: Section) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </NeonForm>
  );
}
