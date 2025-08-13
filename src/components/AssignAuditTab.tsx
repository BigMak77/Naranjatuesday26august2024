// components/AssignAuditTab.tsx
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonForm from '@/components/NeonForm'

export default function AssignAuditTab() {
  type AuditTemplate = { id: string; title: string }
  const [templates, setTemplates] = useState<AuditTemplate[]>([])
  type User = { id: string; email: string }
  const [users, setUsers] = useState<User[]>([])
  type Department = { id: string; name: string }
  const [departments, setDepartments] = useState<Department[]>([])
  type StandardSection = { id: string; title: string }
  const [standardSections, setStandardSections] = useState<StandardSection[]>([])
  type Standard = { id: string; name: string }
  const [standards, setStandards] = useState<Standard[]>([])
  const [templateId, setTemplateId] = useState('')
  const [userId, setUserId] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [notes, setNotes] = useState('')
  const [standardId, setStandardId] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [assignLoading, setAssignLoading] = useState(false)

  useEffect(() => {
    const loadAll = async () => {
      const [tpls, usrs, depts, stds, secs] = await Promise.all([
        supabase.from('audit_templates').select('id, title').order('title'),
        supabase.from('auth.users').select('id, email').order('email'),
        supabase.from('departments').select('id, name').order('name'),
        supabase.from('document_standard').select('id, name').order('name'),
        supabase.from('standard_sections').select('id, title').order('title'),
      ])
      if (!tpls.error) setTemplates(tpls.data || [])
      if (!usrs.error) setUsers(usrs.data || [])
      if (!depts.error) setDepartments(depts.data || [])
      if (!stds.error) setStandards(stds.data || [])
      if (!secs.error) setStandardSections(secs.data || [])
    }
    loadAll()
  }, [])

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateId || (!userId && !departmentId)) {
      alert('Please select a template and either a user or department.')
      return
    }
    setAssignLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const selectedTemplate = templates.find((t: AuditTemplate) => t.id === templateId)
    const title = selectedTemplate?.title || ''
    const { error } = await supabase.from('audit_assignments').insert({
      template_id: templateId,
      template_title: title,
      assigned_to: userId || null,
      department_id: departmentId || null,
      scheduled_for: scheduledFor || null,
      created_by: user?.id || null,
      notes: notes || null,
      standard_id: standardId || null,
      standard_section_id: sectionId || null,
    })
    setAssignLoading(false)
    if (error) alert('Assignment failed: ' + error.message)
    else {
      alert('Audit assigned!')
      setTemplateId('')
      setUserId('')
      setDepartmentId('')
      setScheduledFor('')
      setNotes('')
      setStandardId('')
      setSectionId('')
    }
  }

  return (
    <div className="assign-audit-tab-container">
      <NeonForm title="Assign Audit" onSubmit={handleAssign} submitLabel={assignLoading ? 'Assigning...' : 'Assign Audit'}>
        <div className="assign-audit-tab-spacer" />
        <select value={templateId} onChange={e => setTemplateId(e.target.value)} className="assign-audit-tab-input" required>
          <option value="">Select Audit Template</option>
          {templates.map((tpl: AuditTemplate) => (
            <option key={tpl.id} value={tpl.id}>{tpl.title}</option>
          ))}
        </select>
        <div className="assign-audit-tab-row">
          <select value={userId} onChange={e => { setUserId(e.target.value); setDepartmentId(''); }} className="assign-audit-tab-input">
            <option value="">Assign to User</option>
            {users.map((u: User) => (
              <option key={u.id} value={u.id}>{u.email}</option>
            ))}
          </select>
          <select value={departmentId} onChange={e => { setDepartmentId(e.target.value); setUserId(''); }} className="assign-audit-tab-input">
            <option value="">Assign to Department</option>
            {departments.map((d: Department) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <input type="date" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} className="assign-audit-tab-input" />
        <select value={standardId} onChange={e => setStandardId(e.target.value)} className="assign-audit-tab-input">
          <option value="">Link to Standard (optional)</option>
          {standards.map((std: Standard) => (
            <option key={std.id} value={std.id}>{std.name}</option>
          ))}
        </select>
        <select value={sectionId} onChange={e => setSectionId(e.target.value)} className="assign-audit-tab-input">
          <option value="">Link to Standard Section (optional)</option>
          {standardSections.map((sec: StandardSection) => (
            <option key={sec.id} value={sec.id}>{sec.title}</option>
          ))}
        </select>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} className="assign-audit-tab-input" placeholder="Notes (optional)" rows={3} />
      </NeonForm>
    </div>
  )
}
