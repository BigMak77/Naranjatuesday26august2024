// components/AssignAuditTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import NeonForm from '@/components/NeonForm';

type AuditTemplate = { id: string; title?: string | null; name?: string | null };
type UserRow = { auth_id: string; email: string | null; first_name?: string | null; last_name?: string | null; department_id?: string | null };
type Department = { id: string; name: string };

export default function AssignAuditTab() {
  const [templates, setTemplates] = useState<AuditTemplate[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [templateId, setTemplateId] = useState('');
  const [userAuthId, setUserAuthId] = useState('');     // auth_id of the selected user
  const [departmentId, setDepartmentId] = useState(''); // target dept (when bulk assigning)
  const [scheduledFor, setScheduledFor] = useState(''); // yyyy-mm-dd
  const [assignLoading, setAssignLoading] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  // Load dropdown data
  useEffect(() => {
    (async () => {
      setFeedback('');
      const [tpls, us, depts] = await Promise.all([
        supabase.from('audit_templates').select('id, title, name').order('title', { ascending: true }),
        supabase.from('users').select('auth_id, email, first_name, last_name, department_id').order('last_name', { ascending: true }),
        supabase.from('departments').select('id, name').order('name', { ascending: true }),
      ]);

      if (!tpls.error && tpls.data) setTemplates(tpls.data);
      if (!us.error && us.data) setUsers(us.data);
      if (!depts.error && depts.data) setDepartments(depts.data);
    })();
  }, []);

  const templateLabel = (t: AuditTemplate) => (t.title?.trim() || t.name?.trim() || '(untitled)');
  const userLabel = (u: UserRow) =>
    `${(u.first_name ?? '').trim()} ${(u.last_name ?? '').trim()}`.trim() ||
    (u.email ?? '') ||
    u.auth_id;

  const dueAtIso = useMemo(() => {
    if (!scheduledFor) return null;
    // Store date as UTC midnight for consistency
    const d = new Date(`${scheduledFor}T00:00:00Z`);
    return isNaN(+d) ? null : d.toISOString();
  }, [scheduledFor]);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!templateId) {
      setFeedback('Please choose an audit template.');
      return;
    }
    if (!userAuthId && !departmentId) {
      setFeedback('Choose either a user or a department.');
      return;
    }

    setAssignLoading(true);
    try {
      const {
        data: { user },
        error: authErr,
      } = await supabase.auth.getUser();
      if (authErr) throw authErr;

      const assignedBy = user?.id ?? null;

      // Build rows to upsert
      type AssignmentRow = {
        auth_id: string;
        item_type: 'audit';
        item_id: string;
        assigned_by: string | null;
        origin_type: 'direct' | 'department';
        origin_id: string | null;
        due_at: string;
      };
      let rows: AssignmentRow[] = [];

      if (userAuthId) {
        rows = [
          {
            auth_id: userAuthId,
            item_type: 'audit' as const,
            item_id: templateId,
            assigned_by: assignedBy,
            origin_type: 'direct',
            origin_id: null,
            due_at: dueAtIso ?? '',
          },
        ];
      } else if (departmentId) {
        const { data: deptUsers, error: deptErr } = await supabase
          .from('users')
          .select('auth_id')
          .eq('department_id', departmentId)
          .not('auth_id', 'is', null);

        if (deptErr) throw deptErr;

        const authIds = Array.from(new Set((deptUsers ?? []).map((u) => u.auth_id).filter(Boolean)));

        if (authIds.length === 0) {
          setFeedback('No users found in that department.');
          setAssignLoading(false);
          return;
        }

        rows = authIds.map((aid) => ({
          auth_id: aid as string,
          item_type: 'audit' as const,
          item_id: templateId,
          assigned_by: assignedBy,
          origin_type: 'department',
          origin_id: departmentId,
          due_at: dueAtIso ?? '',
        }));
      }

      if (rows.length === 0) {
        setFeedback('No matching users to assign.');
        setAssignLoading(false);
        return;
      }

      // Idempotent insert: ignore duplicates (don’t overwrite existing rows)
      const { data: inserted, error } = await supabase
        .from('user_assignments')
        .upsert(rows, { onConflict: 'auth_id,item_id,item_type', ignoreDuplicates: true })
        .select('id'); // returns only the rows that were *inserted*

      if (error) throw error;

      const count = inserted?.length ?? 0;
      const tplName = templateLabel(templates.find((t) => t.id === templateId) || { id: '' });

      setFeedback(
        userAuthId
          ? (count === 0
              ? `“${tplName}” was already assigned to that user.`
              : `Assigned “${tplName}” to 1 user.`)
          : (count === 0
              ? `No new assignments were created (they may already have “${tplName}”).`
              : `Assigned “${tplName}” to ${count} user(s) in the department.`)
      );

      // Reset (keep template to allow repeating on another target)
      setUserAuthId('');
      setDepartmentId('');
      // setScheduledFor(''); // optional: keep the date
    } catch (e: unknown) {
      const errMsg = e instanceof Error ? e.message : String(e);
      console.error('Assign audit error:', errMsg);
      setFeedback(errMsg ?? 'Failed to assign audit.');
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="assign-audit-tab-container">
      <NeonForm
        title="Assign Audit"
        onSubmit={handleAssign}
        submitLabel={assignLoading ? 'Assigning…' : 'Assign Audit'}
      >
        {/* Template */}
        <select
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          className="assign-audit-tab-input"
          required
          disabled={assignLoading}
        >
          <option value="">Select Audit Template</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>
              {templateLabel(tpl)}
            </option>
          ))}
        </select>

        {/* Target: user OR department */}
        <div className="assign-audit-tab-row">
          <select
            value={userAuthId}
            onChange={(e) => {
              setUserAuthId(e.target.value);
              setDepartmentId('');
            }}
            className="assign-audit-tab-input"
            disabled={assignLoading}
          >
            <option value="">Assign to User</option>
            {users.map((u) => (
              <option key={u.auth_id} value={u.auth_id}>
                {userLabel(u)}
              </option>
            ))}
          </select>

          <select
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              setUserAuthId('');
            }}
            className="assign-audit-tab-input"
            disabled={assignLoading}
          >
            <option value="">Assign to Department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Due date */}
        <input
          type="date"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
          className="assign-audit-tab-input"
          disabled={assignLoading}
        />

        {/* Feedback */}
        {feedback && (
          <div className="mt-2 text-sm" style={{ color: 'var(--neon, #40E0D0)' }}>
            {feedback}
          </div>
        )}

        {/* Tip when RLS blocks inserts */}
        {/* <div className="mt-2 text-xs opacity-70">
          If you see an insert error, ensure your RLS policy on <code>user_assignments</code> allows the current user to insert.
        </div> */}
      </NeonForm>
    </div>
  );
}
