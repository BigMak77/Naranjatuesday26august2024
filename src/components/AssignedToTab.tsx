/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/AssignedToTab.tsx
'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import NeonPanel from '@/components/NeonPanel'
import { FiSearch, FiFilter, FiChevronDown, FiCheckCircle, FiXCircle, FiMail } from 'react-icons/fi';

export default function AssignedToTab() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'assigned_to_name' | 'department_name' | 'template_title' | 'scheduled_for' | 'submission_status'>('scheduled_for');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterDept, setFilterDept] = useState<string>('');

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from('assigned_audit_status_view')
        .select('*');
      if (!error && data) setRows(data);
      setLoading(false);
    };
    load();
  }, []);

  // Filter, search, and sort logic
  let filtered = rows;
  if (filterStatus) filtered = filtered.filter(r => r.submission_status === filterStatus);
  if (filterDept) filtered = filtered.filter(r => r.department_name === filterDept);
  if (search) filtered = filtered.filter(r =>
    r.assigned_to_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.department_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.template_title?.toLowerCase().includes(search.toLowerCase())
  );
  filtered = [...filtered].sort((a, b) => {
    if (a[sortBy] < b[sortBy]) return sortDir === 'asc' ? -1 : 1;
    if (a[sortBy] > b[sortBy]) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  // Get unique status and department values for filters
  const statusOptions = Array.from(new Set(rows.map(r => r.submission_status))).filter(Boolean);
  const deptOptions = Array.from(new Set(rows.map(r => r.department_name))).filter(Boolean);

  async function sendReminderEmail(assignmentId: string, assignedTo: string) {
    // Call your backend API or Supabase function to send the email
    // Example: await fetch(`/api/send-reminder?assignmentId=${assignmentId}`)
    alert(`Reminder sent to ${assignedTo}`);
  }

  return (
    <NeonPanel className="neon-panel-audit space-y-4">
      <h3 className="neon-section-title">Assigned Audits</h3>
      <div className="neon-flex neon-flex-wrap gap-4 items-center mb-4">
        <div className="neon-relative">
          <FiSearch className="neon-icon-search" />
          <div className="neon-search-bar-wrapper">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, department, or template..."
              className="neon-input neon-input-search"
            />
          </div>
        </div>
        <div className="neon-flex gap-2">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="neon-input"
          >
            <option value="">All Statuses</option>
            {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            value={filterDept}
            onChange={e => setFilterDept(e.target.value)}
            className="neon-input"
          >
            <option value="">All Departments</option>
            {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>
      <div className="neon-table-wrapper">
        <table className="neon-table min-w-full table-fixed">
          <colgroup>
            <col style={{ width: '38%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '7%' }} />
          </colgroup>
          <thead className="neon-table-head">
            <tr>
              {[
                { header: 'Title', accessor: 'template_title' },
                { header: 'Assigned To', accessor: 'assigned_to_name' },
                { header: 'Department', accessor: 'department_name' },
                { header: 'Scheduled For', accessor: 'scheduled_for' },
                { header: 'Status', accessor: 'submission_status' },
              ].map(col => (
                <th
                  key={col.accessor}
                  className="neon-table-th cursor-pointer select-none"
                  onClick={() => {
                    if (sortBy === col.accessor) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    setSortBy(col.accessor as typeof sortBy);
                  }}
                >
                  {col.header}
                  {sortBy === col.accessor && (
                    <FiChevronDown className={`neon-table-sort ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="neon-table-info">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="neon-table-info">No assigned audits found.</td></tr>
            ) : (
              filtered.map((row, i) => (
                <tr key={i} className="neon-table-row">
                  <td className="neon-table-cell">{row.template_title}</td>
                  <td className="neon-table-cell">{row.assigned_to_name}</td>
                  <td className="neon-table-cell">{row.department_name}</td>
                  <td className="neon-table-cell">{row.scheduled_for}</td>
                  <td className="neon-table-cell">
                    {row.submission_status === 'Completed' ? (
                      <FiCheckCircle className="neon-status-complete neon-table-status-icon" title="Completed" />
                    ) : (
                      <>
                        <FiXCircle className="neon-status-incomplete neon-table-status-icon" title="Not Completed" />
                        <FiMail className="neon-table-remind-icon" title={`Remind ${row.assigned_to_name}`} />
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </NeonPanel>
  );
}
