// components/ViewAuditTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import NeonPanel from '@/components/NeonPanel';

type TabKey = 'create' | 'view' | 'assign' | 'submissions' | 'questions' | 'assigned' | 'auditors';

type TemplateRow = {
  id: string;
  title?: string | null;            // some schemas use 'title'
  template_title?: string | null;   // others use 'template_title'
  description?: string | null;
  frequency?: string | null;
  version?: string | null;
  standard_section_id?: string | null;
  archived?: string | boolean | null;
  created_at?: string | null;
};

export default function ViewAuditTab({ setActiveTab }: { setActiveTab: (tab: TabKey) => void }) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [questionsMap, setQuestionsMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const isArchived = (v: TemplateRow['archived']) => {
    if (typeof v === 'boolean') return v;
    if (v == null) return false;
    const s = String(v).trim().toLowerCase();
    return s === 'yes' || s === 'true' || s === '1';
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr(null);

      // keep select wide enough to support both 'title' and 'template_title'
      const { data, error } = await supabase
        .from('audit_templates')
        .select('id, title, template_title, description, frequency, version, standard_section_id, archived')
        .order('title', { ascending: true });

      if (!alive) return;

      if (error) {
        setErr(error.message);
        setTemplates([]);
      } else {
        const visible = (data ?? []).filter((t: TemplateRow) => !isArchived(t.archived));
        setTemplates(visible);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const displayTitle = (tpl: TemplateRow) =>
    (tpl.title?.trim() || tpl.template_title?.trim() || '(untitled)');

  const toggleExpand = async (templateId: string) => {
    setErr(null);
    if (expanded === templateId) {
      setExpanded(null);
      return;
    }
    // fetch questions lazily on first expand
    if (!questionsMap[templateId]) {
      const { data: linkRows, error: linkErr } = await supabase
        .from('audit_template_questions_status')
        .select('question_id')
        .eq('template_id', templateId);

      if (linkErr) {
        setErr(linkErr.message);
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
        setExpanded(templateId);
        return;
      }

      const ids = (linkRows ?? []).map((r: any) => r.question_id).filter(Boolean);
      if (ids.length === 0) {
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
        setExpanded(templateId);
        return;
      }

      const { data: qs, error: qErr } = await supabase
        .from('audit_questions')
        .select('question_text')
        .in('id', ids);

      if (qErr) {
        setErr(qErr.message);
        setQuestionsMap((m) => ({ ...m, [templateId]: [] }));
      } else {
        const texts = (qs ?? []).map((q: any) => q.question_text).filter(Boolean);
        setQuestionsMap((m) => ({ ...m, [templateId]: texts }));
      }
    }
    setExpanded(templateId);
  };

  const list = useMemo(
    () => templates.map((tpl) => ({
      id: tpl.id,
      title: displayTitle(tpl),
      description: tpl.description ?? '',
      frequency: tpl.frequency ?? '—',
      version: tpl.version ?? '—',
    })),
    [templates]
  );

  return (
    <NeonPanel className="neon-panel-audit space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="neon-form-title drop-shadow-glow">Audit Templates</h3>
        {/* Quick route to assignment tab if you want */}
        {/* <button className="neon-link-audit" onClick={() => setActiveTab('assign')}>Go to Assign</button> */}
      </div>

      {err && <div className="text-red-400 text-sm">{err}</div>}
      {loading ? (
        <div className="opacity-80 text-sm p-3">Loading…</div>
      ) : list.length === 0 ? (
        <div className="opacity-70 text-sm p-3">No audit templates found.</div>
      ) : (
        <ul className="neon-list-audit space-y-4">
          {list.map((tpl) => (
            <li key={tpl.id} className="neon-list-item-audit">
              <div className="neon-list-item-header">
                <div>
                  <h4 className="neon-list-item-title">{tpl.title}</h4>
                  <p className="neon-list-item-meta">
                    Version: {tpl.version} &nbsp;|&nbsp; Frequency: {tpl.frequency}
                  </p>
                </div>
                <div className="neon-list-item-actions">
                  <button
                    type="button"
                    className="neon-link-audit"
                    onClick={() => toggleExpand(tpl.id)}
                  >
                    {expanded === tpl.id ? 'Hide Details' : 'View Details'}
                  </button>
                  <button
                    type="button"
                    className="neon-link-archive"
                    onClick={async () => {
                      const { error } = await supabase
                        .from('audit_templates')
                        .update({ archived: 'yes' })
                        .eq('id', tpl.id);
                      if (error) {
                        alert('Failed to archive: ' + error.message);
                      } else {
                        setTemplates((prev) => prev.filter((t) => t.id !== tpl.id));
                        if (expanded === tpl.id) setExpanded(null);
                      }
                    }}
                  >
                    Archive
                  </button>
                </div>
              </div>

              {expanded === tpl.id && (
                <div className="mt-4 border-t border-[#40E0D0] pt-4 text-sm text-[#b2f1ec] space-y-2">
                  {templates.find((t) => t.id === tpl.id)?.description && (
                    <p><strong>Description:</strong> {templates.find((t) => t.id === tpl.id)?.description}</p>
                  )}

                  <p className="opacity-80">
                    <strong>Questions:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {Array.isArray(questionsMap[tpl.id]) && questionsMap[tpl.id].length > 0 ? (
                      questionsMap[tpl.id].map((q, i) => <li key={`${tpl.id}-${i}`}>{q}</li>)
                    ) : (
                      <li className="opacity-70">No questions linked.</li>
                    )}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </NeonPanel>
  );
}
