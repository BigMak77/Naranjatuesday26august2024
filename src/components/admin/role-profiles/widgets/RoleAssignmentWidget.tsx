"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";

type Props = {
  selectedRoles: string[];
  onChange: (roles: string[]) => void;
};

type Role = {
  id: string;
  title: string;
};

export default function RoleAssignmentWidget({
  selectedRoles,
  onChange,
}: Props) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [search, setSearch] = useState("");
  const [showRoles, setShowRoles] = useState(true);

  useEffect(() => {
    const loadRoles = async () => {
      const { data, error } = await supabase.from("roles").select("id, title");
      if (error) {
        console.error("Error loading roles:", error);
        return;
      }
      setRoles(data || []);
    };

    loadRoles();
  }, []);

  const toggleRole = (id: string) => {
    if (selectedRoles.includes(id)) {
      onChange(selectedRoles.filter((r) => r !== id));
    } else {
      onChange([...selectedRoles, id]);
    }
  };

  const filteredRoles = roles.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <NeonPanel className="mt-6">
      <h3 className="neon-section-title">Assign Role Profile to Roles</h3>
      <div className="neon-roleassign-controls mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles..."
          className="neon-input neon-roleassign-search"
        />
        <button
          type="button"
          className="neon-btn neon-roleassign-toggle"
          data-tooltip={showRoles ? 'Hide Roles' : 'Show Roles'}
          onClick={() => setShowRoles((prev) => !prev)}
          aria-label={showRoles ? 'Hide Roles' : 'Show Roles'}
        >
          <span className="neon-icon" aria-hidden="true">
            {showRoles ? '➖' : '➕'}
          </span>
        </button>
      </div>
      {showRoles && (
        <div className="neon-roleassign-list">
          {filteredRoles.length === 0 ? (
            <div className="neon-roleassign-empty">No roles found.</div>
          ) : (
            filteredRoles.map((role) => (
              <label key={role.id} className="neon-roleassign-checkbox-label">
                <input
                  type="checkbox"
                  className="neon-checkbox"
                  checked={selectedRoles.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                />
                <span className="neon-roleassign-role-title">{role.title}</span>
              </label>
            ))
          )}
        </div>
      )}
    </NeonPanel>
  );
}
