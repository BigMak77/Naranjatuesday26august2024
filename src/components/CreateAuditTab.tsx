// components/CreateAuditTab.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";

interface AuditQuestion {
  id: string;
  question_text: string;
}
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
  const [availableQuestions, setAvailableQuestions] = useState<AuditQuestion[]>(
    [],
  );
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const editId = sessionStorage.getItem("edit_template_id");
    const fetchData = async () => {
      const [qRes, sRes] = await Promise.all([
        supabase
          .from("audit_questions")
          .select("id, question_text")
          .order("question_text"),
        supabase.from("standard_sections").select("id, title").order("title"),
      ]);
      if (!qRes.error) setAvailableQuestions(qRes.data || []);
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
          const { data: qLinks } = await supabase
            .from("audit_template_questions_status")
            .select("question_id")
            .eq("template_id", editId);
          if (qLinks)
            setSelectedQuestions(
              qLinks.map((q: { question_id: string }) => q.question_id),
            );
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
    if (selectedQuestions.length > 0) {
      const rows = selectedQuestions.map((qId, idx) => ({
        template_id: inserted.id,
        question_id: qId,
        sort_order: idx + 1,
      }));
      const { error: qErr } = await supabase
        .from("audit_template_questions_status")
        .insert(rows);
      if (qErr) alert("Error linking questions: " + qErr.message);
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
    setSelectedQuestions([]);
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
        <div className="flex flex-col gap-2">
          <label className="neon-label mb-2">Link Questions</label>
          <div className="neon-panel p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableQuestions.map((q) => (
              <label
                key={q.id}
                className="flex items-center gap-2 p-2 rounded bg-white shadow-sm neon-panel"
              >
                <input
                  type="checkbox"
                  value={q.id}
                  checked={selectedQuestions.includes(q.id)}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedQuestions((prev) =>
                      prev.includes(id)
                        ? prev.filter((x) => x !== id)
                        : [...prev, id],
                    );
                  }}
                  className="neon-checkbox"
                />
                <span className="text-sm text-gray-800">{q.question_text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </NeonForm>
  );
}
