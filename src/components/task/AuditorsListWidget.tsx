// src/components/task/AuditorsListWidget.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface SupabaseAuditorRow {
  id: number;
  users?: {
    first_name?: string;
    last_name?: string;
    role?: { title?: string } | { title?: string }[];
  } | {
    first_name?: string;
    last_name?: string;
    role?: { title?: string } | { title?: string }[];
  }[];
}

export default function AuditorsListWidget() {
  const [auditors, setAuditors] = useState<Array<{ id: number; firstName: string; lastName: string; role: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAuditors = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('auditor_list')
        .select('id, users(first_name, last_name, role(title))')
        .order('created_at', { ascending: false });
      if (error || !data) {
        setError('Failed to load auditors.');
        setAuditors([]);
      } else {
        setAuditors(
          data.map((row: SupabaseAuditorRow) => {
            const userObj = Array.isArray(row.users) ? row.users[0] : row.users;
            let roleTitle = '';
            const role = userObj?.role;
            if (Array.isArray(role)) {
              roleTitle = role[0]?.title || '';
            } else if (role && typeof role === 'object' && 'title' in role) {
              roleTitle = role.title || '';
            }
            return {
              id: row.id,
              firstName: userObj?.first_name || '',
              lastName: userObj?.last_name || '',
              role: roleTitle,
            };
          })
        );
      }
      setLoading(false);
    };
    fetchAuditors();
  }, []);

  return (
    <div className="neon-panel max-w-lg mx-auto mt-6">
      <h2 className="neon-section-title">Auditor List</h2>
      {loading ? (
        <p className="neon-info">Loading auditors...</p>
      ) : error ? (
        <p className="neon-error">{error}</p>
      ) : auditors.length === 0 ? (
        <p className="neon-info">No auditors found.</p>
      ) : (
        <table className="neon-table w-full">
          <thead>
            <tr>
              <th className="neon-th">First Name</th>
              <th className="neon-th">Last Name</th>
              <th className="neon-th">Role</th>
            </tr>
          </thead>
          <tbody>
            {auditors.map(auditor => (
              <tr key={auditor.id} className="neon-tr">
                <td className="neon-td">{auditor.firstName}</td>
                <td className="neon-td">{auditor.lastName}</td>
                <td className="neon-td">{auditor.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
