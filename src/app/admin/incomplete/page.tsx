'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import NeonTable from '@/components/NeonTable';
import { FiSearch, FiUsers, FiLayers, FiBookOpen } from 'react-icons/fi';

interface IncompleteRecord {
  auth_id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  module: string;
  document: string;
}

export default function IncompleteTrainingPage() {
  const [data, setData] = useState<IncompleteRecord[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      // 1) Incomplete assignments
      const { data: ua, error: uaErr } = await supabase
        .from('user_assignments')
        .select(`
          auth_id,
          item_id,
          item_type,
          completed_at,
          users:users!inner(
            first_name,
            last_name,
            department_id,
            departments(name),
            role_id,
            role:roles!users_role_id_fkey(title)
          )
        `)
        .in('item_type', ['module', 'document'])
        .is('completed_at', null);

      if (!isMounted) return;

      if (uaErr) {
        console.error('Error fetching incomplete training:', uaErr);
        setError(uaErr.message);
        setLoading(false);
        return;
      }

      const rows = ua ?? [];

      // 2) Collect IDs for name lookups
      const moduleIds = Array.from(new Set(rows.filter(r => r.item_type === 'module').map(r => r.item_id)));
      const documentIds = Array.from(new Set(rows.filter(r => r.item_type === 'document').map(r => r.item_id)));

      // 3) Fetch module/document names
      const [modsRes, docsRes] = await Promise.all([
        moduleIds.length
          ? supabase.from('modules').select('id, name').in('id', moduleIds)
          : Promise.resolve({ data: [], error: null } as any),
        documentIds.length
          ? supabase.from('documents').select('id, title, name').in('id', documentIds)
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      const modNameById = new Map<string, string>(
        (modsRes.data ?? []).map((m: any) => [m.id, m.name])
      );
      const docNameById = new Map<string, string>(
        (docsRes.data ?? []).map((d: any) => [d.id, d.title ?? d.name])
      );

      // 4) Normalize to UI rows
      const results: IncompleteRecord[] = rows.map((item: any) => {
        const user = Array.isArray(item.users) ? item.users[0] : item.users ?? {};
        const dep  = user?.departments
          ? (Array.isArray(user.departments) ? user.departments[0] : user.departments)
          : {};
        const role = user?.role ?? {};

        const isModule = item.item_type === 'module';
        const moduleName   = isModule ? (modNameById.get(item.item_id) ?? item.item_id) : '—';
        const documentName = !isModule ? (docNameById.get(item.item_id) ?? item.item_id) : '—';

        return {
          auth_id: item.auth_id,
          first_name: user?.first_name ?? '',
          last_name:  user?.last_name  ?? '',
          department: dep?.name ?? '—',
          role:       role?.title ?? '—',
          module:     moduleName,
          document:   documentName,
        };
      });

      setData(results);
      setLoading(false);
    })();

    return () => { isMounted = false; };
  }, []);

  // Facets
  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.department && r.department !== '—') set.add(r.department);
    return Array.from(set).sort();
  }, [data]);

  const allRoles = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.role && r.role !== '—') set.add(r.role);
    return Array.from(set).sort();
  }, [data]);

  const allModules = useMemo(() => {
    const set = new Set<string>();
    for (const r of data) if (r.module && r.module !== '—') set.add(r.module);
    return Array.from(set).sort();
  }, [data]);

  const rolesForCurrentDept = useMemo(() => {
    if (selectedDept === 'All') return allRoles;
    const set = new Set<string>();
    for (const r of data) {
      if (r.department === selectedDept && r.role && r.role !== '—') set.add(r.role);
    }
    return Array.from(set).sort();
  }, [data, allRoles, selectedDept]);

  const filtered = useMemo(() => {
    let list = data;
    if (selectedDept !== 'All') list = list.filter((r) => r.department === selectedDept);
    if (selectedRole !== 'All') list = list.filter((r) => r.role === selectedRole);
    if (selectedModule !== 'All') list = list.filter((r) => r.module === selectedModule);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.first_name.toLowerCase().includes(s) ||
          r.last_name.toLowerCase().includes(s)
      );
    }
    return list;
  }, [data, search, selectedDept, selectedRole, selectedModule]);

  const tableData = useMemo(
    () =>
      filtered.map((rec) => ({
        user: `${rec.first_name} ${rec.last_name}`.trim(),
        department: rec.department,
        role: rec.role,
        module: rec.module,
        document: rec.document,
      })),
    [filtered]
  );

  return (
    <div className="after-hero">
      <div className="global-content">
        <main className="page-main">
          <div className="neon-panel">
            <div className="neon-panel-content">
              {/* Filters */}
              <div className="neon-form-row">
                <div className="neon-form-group">
                  <FiSearch className="neon-form-icon" />
                  <input
                    type="search"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="neon-input"
                  />
                </div>

                <div className="neon-form-group">
                  <FiUsers className="neon-form-icon" />
                  <select
                    value={selectedDept}
                    onChange={(e) => { setSelectedDept(e.target.value); setSelectedRole('All'); }}
                    className="neon-input"
                  >
                    <option value="All">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="neon-form-group">
                  <FiLayers className="neon-form-icon" />
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Roles</option>
                    {rolesForCurrentDept.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div className="neon-form-group">
                  <FiBookOpen className="neon-form-icon" />
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="neon-input"
                  >
                    <option value="All">All Modules</option>
                    {allModules.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Errors / Loading / Table */}
              {error && (
                <p className="text-red-500 text-sm mt-2">
                  Failed to load incomplete training: {error}
                </p>
              )}

              {loading ? (
                <div className="neon-table-wrapper">
                  <div className="p-6 text-sm opacity-80">Loading…</div>
                </div>
              ) : (
                <div className="neon-table-wrapper">
                  <NeonTable
                    columns={[
                      { header: 'User', accessor: 'user' },
                      { header: 'Department', accessor: 'department' },
                      { header: 'Role', accessor: 'role' },
                      { header: 'Module', accessor: 'module' },
                      { header: 'Document', accessor: 'document' },
                    ]}
                    data={tableData}
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
