"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

export default function GroupModuleReport() {
  const [modules, setModules] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch all modules for filter dropdown
  useEffect(() => {
    supabase
      .from("modules")
      .select("id, name")
      .order("name")
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setModules(data || []);
      });
  }, []);

  // Fetch departments and roles for selected module
  useEffect(() => {
    if (!selectedModule) {
      setDepartments([]);
      setRoles([]);
      return;
    }
    setLoading(true);
    setError("");
    // 1. Get departments attached to this module
    supabase
      .from("group_modules")
      .select("group_id")
      .eq("module_id", selectedModule)
      .then(async ({ data: groupModules, error: gmErr }) => {
        if (gmErr) {
          setError(gmErr.message);
          setLoading(false);
          return;
        }
        const groupIds = (groupModules || []).map((gm: any) => gm.group_id);
        if (groupIds.length === 0) {
          setDepartments([]);
          setRoles([]);
          setLoading(false);
          return;
        }
        // 2. Get departments for these groups
        const { data: groupDepts, error: gdErr } = await supabase
          .from("group_departments")
          .select("department_id")
          .in("group_id", groupIds);
        const deptIds = (groupDepts || []).map((gd: any) => gd.department_id);
        // 3. Get department details
        let departments: { id: string; name: string }[] = [];
        if (deptIds.length > 0) {
          const { data: depts } = await supabase
            .from("departments")
            .select("id, name")
            .in("id", deptIds);
          departments = depts || [];
        }
        setDepartments(departments);
        // 4. Get roles for these departments
        let roles: { id: string; title: string }[] = [];
        if (deptIds.length > 0) {
          const { data: deptRoles } = await supabase
            .from("roles")
            .select("id, title, department_id")
            .in("department_id", deptIds);
          roles = (deptRoles || []).map((r: any) => ({ id: r.id, title: r.title }));
        }
        setRoles(roles);
        setLoading(false);
      });
  }, [selectedModule]);

  // Filter modules by search
  const filteredModules = modules.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <NeonPanel className="neon-panel-lg">
      <h2 className="neon-form-title mb-4">Group Module Report</h2>
      <div className="mb-4">
        <input
          className="neon-input w-full"
          placeholder="Search module name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="mb-4">
        <select
          className="neon-input w-full"
          value={selectedModule}
          onChange={e => setSelectedModule(e.target.value)}
        >
          <option value="">Select a module...</option>
          {filteredModules.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="neon-message neon-message-error mb-2">{error}</div>}
      {selectedModule && !loading && (
        <>
          <div className="mb-4">
            <h3 className="neon-form-title">Departments</h3>
            {departments.length === 0 ? (
              <div>No departments found.</div>
            ) : (
              <ul>
                {departments.map((d) => (
                  <li key={d.id}>{d.name}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="mb-4">
            <h3 className="neon-form-title">Roles</h3>
            {roles.length === 0 ? (
              <div>No roles found.</div>
            ) : (
              <ul>
                {roles.map((r) => (
                  <li key={r.id}>{r.title}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </NeonPanel>
  );
}
