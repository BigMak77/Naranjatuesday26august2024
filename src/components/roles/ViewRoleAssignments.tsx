"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import OverlayDialog from "@/components/ui/OverlayDialog";
import NeonTable from "@/components/NeonTable";

interface Role {
  id: string;
  title: string;
}

interface Module {
  id: string;
  name: string;
  version: string;
}

interface Document {
  id: string;
  title: string;
  version: string;
}

export default function ViewRoleAssignments() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [selectedRoleName, setSelectedRoleName] = useState<string>("");
  const [assignedModules, setAssignedModules] = useState<Module[]>([]);
  const [assignedDocuments, setAssignedDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    async function fetchRoles() {
      setLoading(true);
      const { data } = await supabase
        .from("roles")
        .select("id, title")
        .order("title", { ascending: true });
      setRoles(data || []);
      setLoading(false);
    }
    fetchRoles();
  }, []);

  const handleRoleSelect = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    setSelectedRoleId(roleId);
    setSelectedRoleName(role.title);
    setLoading(true);

    // Fetch assignments for this role
    const { data: assignments } = await supabase
      .from("role_assignments")
      .select("item_id, type")
      .eq("role_id", roleId);

    const moduleIds = (assignments || [])
      .filter(a => a.type === "module")
      .map(a => a.item_id);

    const documentIds = (assignments || [])
      .filter(a => a.type === "document")
      .map(a => a.item_id);

    // Fetch module details
    if (moduleIds.length > 0) {
      const { data: modules } = await supabase
        .from("modules")
        .select("id, name, version")
        .in("id", moduleIds);
      // Sort modules alphabetically by name (A-Z)
      const sortedModules = (modules || []).sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      );
      setAssignedModules(sortedModules);
    } else {
      setAssignedModules([]);
    }

    // Fetch document details
    if (documentIds.length > 0) {
      const { data: documents } = await supabase
        .from("documents")
        .select("id, title, version")
        .in("id", documentIds);
      // Sort documents alphabetically by title (A-Z)
      const sortedDocuments = (documents || []).sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
      );
      setAssignedDocuments(sortedDocuments);
    } else {
      setAssignedDocuments([]);
    }

    setLoading(false);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedRoleId("");
    setSelectedRoleName("");
    setAssignedModules([]);
    setAssignedDocuments([]);
  };

  if (loading && roles.length === 0) {
    return <div>Loading roles...</div>;
  }

  return (
    <>
      <NeonPanel>
        <h2 className="neon-heading">View Role Training Assignments</h2>
        <p style={{ marginBottom: 16, color: "var(--text-secondary)" }}>
          Select a role to view its assigned training modules and documents
        </p>
        <label>
          Select a role:
          <select
            value={selectedRoleId}
            onChange={(e) => handleRoleSelect(e.target.value)}
            className="neon-input"
          >
            <option value="">-- Choose a role --</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.title}</option>
            ))}
          </select>
        </label>
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
              Training Assignments for {selectedRoleName}
            </h2>

            {/* Modules Section */}
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
                Assigned Training Modules ({assignedModules.length})
              </h3>
              {assignedModules.length > 0 ? (
                <NeonTable
                  columns={[
                    { header: "Module Name", accessor: "name", width: "70%" },
                    { header: "Version", accessor: "version", width: "30%" },
                  ]}
                  data={assignedModules.map(m => ({
                    name: m.name,
                    version: m.version,
                  }))}
                />
              ) : (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  No training modules assigned to this role
                </p>
              )}
            </div>

            {/* Documents Section */}
            <div>
              <h3 style={{ color: "var(--neon)", fontWeight: 600, fontSize: "1.125rem", marginBottom: 16 }}>
                Assigned Documents ({assignedDocuments.length})
              </h3>
              {assignedDocuments.length > 0 ? (
                <NeonTable
                  columns={[
                    { header: "Document Title", accessor: "title", width: "70%" },
                    { header: "Version", accessor: "version", width: "30%" },
                  ]}
                  data={assignedDocuments.map(d => ({
                    title: d.title,
                    version: d.version,
                  }))}
                />
              ) : (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>
                  No documents assigned to this role
                </p>
              )}
            </div>
          </div>
        </OverlayDialog>
      )}
    </>
  );
}
