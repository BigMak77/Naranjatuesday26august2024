// components/SubmissionsTab.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import NeonPanel from '@/components/NeonPanel';
import { FiSearch } from 'react-icons/fi';

type SubmissionRow = {
  id: string;
  assignment_id: string | null;
  audit_id: string;
  submitted_by_auth_id: string;
  status: string; // 'in_progress' | 'submitted' | others if you add
  submitted_at: string | null;
};

type EnrichedRow = {
  id: string;
  audit_title: string;
  user_name: string;
  department: string;
  status: string;
  submitted_at: string | null;         // ISO
  submitted_at_display: string;        // pretty
  due_at_display: string | null;       // pretty or null
};

export default function SubmissionsTab() {
  const [rows, setRows] = useState<EnrichedRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'submitted' | 'in_progress'>('All');

  useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      // 1) Base submissions (latest first)
      const { data: subs, error } = await supabase
        .from('audit_submissions')
        .select('id, assignment_id, audit_id, submitted_by_auth_id, status, submitted_at')
        .order('submitted_at', { ascending: false })
        .limit(200);

      if (!alive) return;

      if (error) {
        console.error('Error loading submissions:', error.message);
        setErr(error.message);
        setRows([]);
        setLoading(false);
        return;
      }

      const base: SubmissionRow[] = (subs ?? []) as SubmissionRow[];

      // 2) Collect IDs to enrich
      const auditIds = Array.from(new Set(base.map(b => b.audit_id)));
      const userIds  = Array.from(new Set(base.map(b => b.submitted_by_auth_id)));
      const assignIds = Array.from(new Set(base.map(b => b.assignment_id).filter(Boolean))) as string[];

      // 3) Fetch audit titles (if table exists)
      const titleMap = new Map<string, string>();
      if (auditIds.length) {
        try {
          const { data: audits } = await supabase
            .from('audits')
            .select('id, name, title')
            .in('id', auditIds);
          (audits ?? []).forEach((a: any) => {
            titleMap.set(a.id, (a.title || a.name || a.id) as string);
          });
        } catch {
          // audits table might not exist yet; fallback to id below
        }
      }

      // 4) Fetch user names + departments
      const userMap = new Map<
        string,
        { first_name?: string | null; last_name?: string | null; email?: string | null; department?: string }
      >();
      if (userIds.length) {
        const { data: users, error: uErr } = await supabase
          .from('users')
          .select('auth_id, first_name, last_name, email, departments(name)')
          .in('auth_id', userIds);

        if (!uErr && users) {
          users.forEach((u: any) => {
            const dep = Array.isArray(u.departments) ? u.departments[0]?.name : u.departments?.name;
            userMap.set(u.auth_id, {
              first_name: u.first_name,
              last_name: u.last_name,
              email: u.email,
              department: dep || '—',
            });
          });
        }
      }

      // 5) Fetch due dates from assignments (if table exists)
      const dueMap = new Map<string, string | null>();
      if (assignIds.length) {
        try {
          const { data: assigns } = await supabase
            .from('user_assignments')
            .select('id, due_at')
            .in('id', assignIds);
          (assigns ?? []).forEach((a: any) => {
            dueMap.set(a.id, a.due_at ?? null);
          });
        } catch {
          // table or RLS might block; leave dueMap empty
        }
      }

      // 6) Build enriched rows
      const enriched: EnrichedRow[] = base.map((b) => {
        const user = userMap.get(b.submitted_by_auth_id) || {};
        const name =
          `${(user.first_name || '').trim()} ${(user.last_name || '').trim()}`.trim() ||
          user.email ||
          b.submitted_by_auth_id;

        const auditTitle = titleMap.get(b.audit_id) ?? b.audit_id;

        const prettySubmitted = b.submitted_at
          ? new Date(b.submitted_at).toLocaleString()
          : 'Not submitted';

        const dueIso = b.assignment_id ? dueMap.get(b.assignment_id) ?? null : null;
        const prettyDue = dueIso
          ? new Date(dueIso).toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: '2-digit',
            })
          : null;

        return {
          id: b.id,
          audit_title: auditTitle,
          user_name: name,
          department: user.department || '—',
          status: b.status || 'in_progress',
          submitted_at: b.submitted_at,
          submitted_at_display: prettySubmitted,
          due_at_display: prettyDue,
        };
      });

      if (!alive) return;
      setRows(enriched);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Filters & search
  const filtered = useMemo(() => {
    let list = rows;
    if (statusFilter !== 'All') {
      list = list.filter(r => (r.status || '').toLowerCase() === statusFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        r.user_name.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.audit_title.toLowerCase().includes(q)
      );
    }
    // recent first
    return [...list].sort((a, b) => {
      const A = a.submitted_at ? Date.parse(a.submitted_at) : 0;
      const B = b.submitted_at ? Date.parse(b.submitted_at) : 0;
      return B - A;
    });
  }, [rows, query, statusFilter]);

  // Status options from data
  const statusOptions = useMemo(
    () =>
      ['All', ...Array.from(new Set(rows.map(r => (r.status || '').toLowerCase()))).filter(Boolean)] as
        ('All' | 'submitted' | 'in_progress')[],
    [rows]
  );

  return (
    <NeonPanel bgColor="#012f34" glowColor="#40E0D0" className="submissions-tab-panel">
      <h3 className="submissions-tab-title">Audit Submissions</h3>

      {/* Controls */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative grow max-w-md">
          <FiSearch className="absolute left-2 top-2.5 opacity-70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by user, department, or audit…"
            className="pl-8 neon-input w-full"
          />
        </div>

        <select
          className="neon-input"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
        >
          {statusOptions.map(opt => (
            <option key={opt} value={opt}>{opt === 'All' ? 'All statuses' : opt}</option>
          ))}
        </select>
      </div>

      {/* Body */}
      {err && <p className="text-red-400 text-sm mb-2">Failed to load: {err}</p>}

      {loading ? (
        <p className="submissions-tab-loading-msg">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="submissions-tab-empty-msg">No submissions yet.</p>
      ) : (
        <ul className="submissions-tab-list">
          {filtered.map((s) => (
            <li key={s.id} className="submissions-tab-list-item">
              <div className="submissions-tab-list-item-content">
                <p><strong>Submission ID:</strong> {s.id}</p>
                <p><strong>Audit:</strong> {s.audit_title}</p>
                <p><strong>User:</strong> {s.user_name}</p>
                <p><strong>Department:</strong> {s.department}</p>
                <p><strong>Status:</strong> {s.status || 'in_progress'}</p>
                <p><strong>Submitted At:</strong> {s.submitted_at_display}</p>
                {s.due_at_display && <p><strong>Due:</strong> {s.due_at_display}</p>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </NeonPanel>
  );
}
