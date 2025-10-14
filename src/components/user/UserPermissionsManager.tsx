import React, { useState, useEffect } from "react";
import { PERMISSIONS, PermissionKey } from "@/types/userPermissions";
import { supabase } from "@/lib/supabase-client";
import SuccessModal from "@/components/ui/SuccessModal";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface User {
  id: string;
  email: string;
  full_name?: string;
  permissions: PermissionKey[];
}

interface UserPermissionsManagerProps {
  // Optionally accept a list of users as a prop
  users?: User[];
}

const UserPermissionsManager: React.FC<UserPermissionsManagerProps> = ({ users: usersProp }) => {
  const [users, setUsers] = useState<User[]>(usersProp || []);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userPermissions, setUserPermissions] = useState<PermissionKey[]>([]);

  // Fetch users if not provided
  useEffect(() => {
    if (!usersProp) {
      setLoading(true);
      supabase.from("users").select("id, email, full_name, permissions")
        .then(({ data }) => {
          setUsers(data || []);
          setLoading(false);
        });
    }
  }, [usersProp]);

  // When user changes, update permissions
  useEffect(() => {
    const user = users.find(u => u.id === selectedUserId);
    setUserPermissions(user?.permissions || []);
  }, [selectedUserId, users]);

  const handleToggle = (perm: PermissionKey) => {
    setUserPermissions((prev) =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await supabase.from("users").update({ permissions: userPermissions }).eq("id", selectedUserId);
    setSaving(false);
    // Optionally, refetch users
  };

  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">User Permissions Manager</h2>
      <div className="user-permissions-manager-content">
        <label className="neon-label">Select User:</label>
        <select
          className="neon-input"
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
        >
          <option value="">-- Select a user --</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.full_name || user.email}
            </option>
          ))}
        </select>
        {selectedUserId && (
          <div className="user-permissions-list mt-4">
            {PERMISSIONS.map((perm) => (
              <label key={perm} className="neon-switch-label">
                <input
                  type="checkbox"
                  checked={userPermissions.includes(perm)}
                  onChange={() => handleToggle(perm)}
                  className="neon-switch"
                />
                <span className="neon-switch-text">{perm}</span>
              </label>
            ))}
            <CustomTooltip text={saving ? "Saving permissions..." : "Save permission changes for this user"}>
              <button
                className="neon-btn neon-btn-save mt-4"
                onClick={handleSave}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving..." : "Save Permissions"}
              </button>
            </CustomTooltip>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserPermissionsManager;
