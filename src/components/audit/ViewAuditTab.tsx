// components/ViewAuditTab.tsx
// Custom tooltips added to View and Archive buttons
"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

type TemplateRow = {
  id: string;
  title?: string | null;
  description?: string | null;
  frequency?: string | null;
  version?: string | null;
  standard_section_id?: string | null;
  archived?: string | boolean | null;
  created_at?: string | null;
};

export default function ViewAuditTab() {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Record<string, string[]>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isArchived = (v: TemplateRow["archived"]) => {
    if (typeof v === "boolean") return v;
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === "yes" || s === "true" || s === "1";
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // keep select wide enough to support both 'title' and 'template_title'
      const { data, error } = await supabase
        .from("audit_templates")
        .select(
          "id, title, description, frequency, version, standard_section_id, archived",
        )
        .order("title", { ascending: true });

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setTemplates([]);
      } else {
        const visible = (data ?? []).filter(
          (t: TemplateRow) => !isArchived(t.archived),
        );
        setTemplates(visible);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const displayTitle = (tpl: TemplateRow) =>
    tpl.title?.trim() || "(untitled)";

  const toggleExpand = async (templateId: string) => {
    setErr(null);
    if (expanded === templateId) {
      setExpanded(null);
      return;
    }
    // fetch questions lazily on first expand
    if (!questionsMap[templateId]) {
      const { data: linkRows, error: linkErr } = await supabase
        .from("audit_template_questions_status")
        .select("question_id")
        .eq("template_id", templateId);

      if (linkErr) {
        setErr(linkErr.message);
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
        setExpanded(templateId);
        return;
      }

      const ids = (linkRows ?? [])
        .map((r: { question_id: string }) => r.question_id)
        .filter(Boolean);
      if (ids.length === 0) {
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
        setExpanded(templateId);
        return;
      }

      const { data: qs, error: qErr } = await supabase
        .from("audit_questions")
        .select("question_text")
        .in("id", ids);

      if (qErr) {
        setErr(qErr.message);
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
      } else {
        const texts = (qs ?? [])
          .map((q: { question_text: string }) => q.question_text)
          .filter(Boolean);
        setQuestionsMap((m) => ({ ...m, [templateId]: texts }));
      }
    }
    setExpanded(templateId);
  };

  const list = useMemo(
    () =>
      templates.map((tpl) => ({
        id: tpl.id,
        title: displayTitle(tpl),
        description: tpl.description ?? "",
        frequency: tpl.frequency ?? "—",
        version: tpl.version ?? "—",
      })),
    [templates],
  );

  return (
    <NeonPanel className="neon-panel-audit">
      <div className="audit-header-row">
        <h3 className="audit-title">Audit Templates</h3>
      </div>

      {err && <div className="audit-error-row">{err}</div>}
      {loading ? (
        <div className="audit-loading-row">Loading…</div>
      ) : list.length === 0 ? (
        <div className="audit-empty-row">No audit templates found.</div>
      ) : (
        <table className="neon-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Version</th>
              <th>Frequency</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((tpl) => (
              <tr key={tpl.id}>
                <td>{tpl.title}</td>
                <td>{tpl.description}</td>
                <td>{tpl.version}</td>
                <td>{tpl.frequency}</td>
                <td>
                  <CustomTooltip text={expanded === tpl.id ? "Hide audit template details" : "View audit template details"}>
                    <NeonIconButton
                      variant="view"
                      title={expanded === tpl.id ? "Hide Details" : "View Details"}
                      onClick={() => toggleExpand(tpl.id)}
                    />
                  </CustomTooltip>
                  <CustomTooltip text="Archive this audit template">
                    <NeonIconButton
                      variant="archive"
                      title="Archive"
                      onClick={async () => {
                        const { error } = await supabase
                          .from("audit_templates")
                          .update({ archived: "yes" })
                          .eq("id", tpl.id);
                        if (error) {
                          alert("Failed to archive: " + error.message);
                        } else {
                        setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                        if (expanded === tpl.id) setExpanded(null);
                      }
                    }}
                  />
                  </CustomTooltip>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Expanded details row below the table */}
      {expanded && (
        <div className="mt-4 pt-4 text-sm text-[#b2f1ec] neon-panel">
          {templates.find((t) => t.id === expanded)?.description && (
            <p>
              <strong>Description:</strong> {templates.find((t) => t.id === expanded)?.description}
            </p>
          )}
          <p className="opacity-80">
            <strong>Questions:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1">
            {Array.isArray(questionsMap[expanded]) && questionsMap[expanded].length > 0 ? (
              questionsMap[expanded].map((q, i) => <li key={`${expanded}-${i}`}>{q}</li>)
            ) : (
              <li className="opacity-70">No questions linked.</li>
            )}
          </ul>
        </div>
      )}
    </NeonPanel>
  );
}
