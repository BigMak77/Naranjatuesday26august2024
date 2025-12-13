"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";

interface Module {
  id: string;
  name: string;
  version: string;
  ref_code?: string;
}

interface Role {
  id: string;
  title: string;
  department?: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

export default function ViewModuleAssignments() {
  const [modules, setModules] = useState<Module[]>([]);
  const [filteredModules, setFilteredModules] = useState<Module[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedModuleName, setSelectedModuleName] = useState<string>("");
  const [assignedRoles, setAssignedRoles] = useState<Role[]>([]);
  const [assignedDepartments, setAssignedDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchModules() {
      setLoading(true);
      const { data } = await supabase
        .from("modules")
        .select("id, name, version, ref_code")
        .eq("is_archived", false)
        .order("name", { ascending: true });
      setModules(data || []);
      setFilteredModules(data || []);
      setLoading(false);
    }
    fetchModules();
  }, []);

  // Filter modules based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredModules(modules);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = modules.filter(
        (m) =>
          m.name.toLowerCase().includes(query) ||
          m.ref_code?.toLowerCase().includes(query)
      );
      setFilteredModules(filtered);
    }
  }, [searchQuery, modules]);

  const handleModuleSelect = async (moduleId: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) return;

    setSelectedModuleId(moduleId);
    setSelectedModuleName(module.name);
    setLoading(true);

    // Fetch roles that have this module assigned
    const { data: roleAssignments, error: roleError } = await supabase
      .from("role_assignments")
      .select("role_id")
      .eq("item_id", moduleId)
      .eq("type", "module");

    console.log("🔍 Role assignments for module:", roleAssignments);
    if (roleError) console.error("❌ Role assignments error:", roleError);

    const roleIds = (roleAssignments || []).map((a) => a.role_id);

    // Fetch role details with department info
    if (roleIds.length > 0) {
      const { data: roles } = await supabase
        .from("roles")
        .select(`
          id,
          title,
          departments (
            name
          )
        `)
        .in("id", roleIds);

      // Sort roles alphabetically by title (A-Z)
      const sortedRoles = (roles || []).sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      );

      // Transform to match our interface
      const transformedRoles = sortedRoles.map((role) => ({
        id: role.id,
        title: role.title,
        department: Array.isArray(role.departments)
          ? role.departments[0]
          : role.departments,
      }));

      setAssignedRoles(transformedRoles);
    } else {
      setAssignedRoles([]);
    }

    // Fetch departments that have this module assigned
    const { data: deptAssignments, error: deptError } = await supabase
      .from("department_assignments")
      .select("department_id")
      .eq("item_id", moduleId)
      .eq("type", "module");

    console.log("🔍 Department assignments for module:", deptAssignments);
    if (deptError) console.error("❌ Department assignments error:", deptError);

    const departmentIds = (deptAssignments || []).map((a) => a.department_id);

    // Fetch department details
    if (departmentIds.length > 0) {
      const { data: departments } = await supabase
        .from("departments")
        .select("id, name")
        .in("id", departmentIds);

      // Sort departments alphabetically by name (A-Z)
      const sortedDepartments = (departments || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
      );

      setAssignedDepartments(sortedDepartments);
    } else {
      setAssignedDepartments([]);
    }

    setLoading(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedModuleId("");
    setSelectedModuleName("");
    setAssignedRoles([]);
    setAssignedDepartments([]);
  };

  if (loading && modules.length === 0) {
    return <div>Loading modules...</div>;
  }

  return (
    <>
      <NeonPanel>
        <h2 className="neon-heading">View Module Assignments</h2>
        <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
          Search for a training module to view which roles and departments are assigned to it
        </p>

        {/* Search Input */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search modules by name or ref code..."
            className="neon-input"
            style={{ width: "100%", maxWidth: "500px" }}
          />
        </div>

        {/* Module Selection */}
        <label>
          Select a module:
          <select
            value={selectedModuleId}
            onChange={(e) => handleModuleSelect(e.target.value)}
            className="neon-input"
            style={{ width: "100%", maxWidth: "500px" }}
          >
            <option value="">-- Choose a module --</option>
            {filteredModules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.ref_code ? `${module.ref_code} - ` : ""}
                {module.name}
              </option>
            ))}
          </select>
        </label>

        {filteredModules.length === 0 && searchQuery && (
          <p style={{ marginTop: 12, color: "var(--text-secondary)", fontStyle: "italic" }}>
            No modules found matching "{searchQuery}"
          </p>
        )}
      </NeonPanel>

      {dialogOpen && (
        <OverlayDialog
          open={true}
          onClose={handleCloseDialog}
          showCloseButton={true}
          width={900}
        >
          <div style={{ padding: 24 }}>
            <h2 style={{ color: "var(--accent)", fontWeight: 600, fontSize: "1.5rem", marginBottom: 24 }}>
              Assignments for {selectedModuleName}
            </h2>

            {/* Roles Section */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
                Assigned to Roles ({assignedRoles.length})
              </h3>
              {assignedRoles.length > 0 ? (
                <NeonTable
                  columns={[
                    { header: "Role Title", accessor: "title", width: "60%" },
                    { header: "Department", accessor: "department", width: "40%" },
                  ]}
                  data={assignedRoles.map((r) => ({
                    title: r.title,
                    department: r.department?.name || (
                      <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                        No department
                      </span>
                    ),
                  }))}
                />
              ) : (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  This module is not assigned to any specific roles
                </p>
              )}
            </div>

            {/* Departments Section */}
            <div>
              <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
                Assigned to Departments ({assignedDepartments.length})
              </h3>
              {assignedDepartments.length > 0 ? (
                <NeonTable
                  columns={[
                    { header: "Department Name", accessor: "name", width: "100%" },
                  ]}
                  data={assignedDepartments.map((d) => ({
                    name: d.name,
                  }))}
                />
              ) : (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  This module is not assigned to any departments
                </p>
              )}
            </div>

            {assignedRoles.length === 0 && assignedDepartments.length === 0 && (
              <div style={{
                marginTop: 24,
                padding: 16,
                background: "var(--surface)",
                borderRadius: 8,
                border: "1px solid var(--border)"
              }}>
                <p style={{ color: "var(--text-secondary)", textAlign: "center", fontStyle: "italic" }}>
                  This module has not been assigned to any roles or departments yet.
                </p>
              </div>
            )}
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
