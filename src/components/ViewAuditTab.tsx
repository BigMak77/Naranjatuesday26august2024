// components/ViewAuditTab.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'

export default function ViewAuditTab({ setActiveTab }: { setActiveTab: (tab: 'create') => void }) {
  const [templates, setTemplates] = useState<any[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [questionsMap, setQuestionsMap] = useState<Record<string, string[]>>({})

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('audit_templates')
        .select('id, title, description, frequency, version, standard_section_id, archived')
        .order('created_at', { ascending: false })
      if (!error && data) {
        setTemplates(data.filter((t: any) => t.archived !== 'yes'))
      }
    }
    load()
  }, [])

  const toggleExpand = async (templateId: string) => {
    if (expanded === templateId) {
      setExpanded(null)
    } else {
      if (!questionsMap[templateId]) {
        const { data, error } = await supabase
          .from('audit_template_questions_status')
          .select('question_id')
          .eq('template_id', templateId)
        const ids = data?.map((d: any) => d.question_id) || []
        if (ids.length > 0) {
          const { data: qs } = await supabase
            .from('audit_questions')
            .select('question_text')
            .in('id', ids)
          setQuestionsMap(prev => ({ ...prev, [templateId]: qs?.map((q: any) => q.question_text) || [] }))
        }
      }
      setExpanded(templateId)
    }
  }

  return (
    <NeonPanel className="neon-panel-audit space-y-4">
      <h3 className="neon-form-title drop-shadow-glow">Audit Templates</h3>
      <ul className="neon-list-audit space-y-4">
        {templates.map((tpl: any) => (
          <li key={tpl.id} className="neon-list-item-audit">
            <div className="neon-list-item-header">
              <div>
                <h4 className="neon-list-item-title">{tpl.title}</h4>
                <p className="neon-list-item-meta">Version: {tpl.version} | Frequency: {tpl.frequency}</p>
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
                      .eq('id', tpl.id)
                    if (error) alert('Failed to archive: ' + error.message)
                    else setTemplates(prev => prev.filter((t: any) => t.id !== tpl.id))
                  }}
                >
                  Archive
                </button>
              </div>
            </div>
            {expanded === tpl.id && (
              <div className="mt-4 border-t border-[#40E0D0] pt-4 text-sm text-[#b2f1ec] space-y-2">
                {tpl.description && <p><strong>Description:</strong> {tpl.description}</p>}
                <ul className="list-disc list-inside">
                  {questionsMap[tpl.id]?.map((q, i) => (
                    <li key={i}>{q}</li>
                  )) || <li>No questions linked.</li>}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </NeonPanel>
  )
}
