import React, { useState, useEffect } from "react";
import { PERMISSIONS, PermissionKey } from "../../types/userPermissions";
import { supabase } from "../../lib/supabase-client";

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  permissions?: PermissionKey[];
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
      supabase.from("users").select("id, email, first_name, last_name, permissions")
        .then(({ data, error }) => {
          if (error) {
            console.error("Error fetching users:", error);
          }
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

    const { error } = await supabase
      .from("users")
      .update({ permissions: userPermissions })
      .eq("id", selectedUserId);

    if (error) {
      console.error("Error saving permissions:", error);
      alert("Failed to save permissions: " + error.message);
    } else {
      alert("Permissions saved successfully!");
      // Refresh users to get updated data
      const { data } = await supabase
        .from("users")
        .select("id, email, first_name, last_name, permissions");
      if (data) setUsers(data);
    }
    setSaving(false);
  };

  return (
    <section className="neon-card neon-form-padding">
      <h2 className="neon-heading">User Permissions Manager</h2>
      <div className="user-permissions-manager-content">
        {loading && <div style={{ padding: "1rem", color: "#2edbd0" }}>Loading users...</div>}

        {!loading && users.length === 0 && (
          <div style={{ padding: "1rem", color: "#ef4444" }}>
            <p>No users found or the permissions column doesn't exist yet.</p>
            <p style={{ marginTop: "0.5rem", fontSize: "0.9rem" }}>
              Please run the migration SQL in your Supabase dashboard to add the permissions column.
            </p>
          </div>
        )}

        {!loading && users.length > 0 && (
          <>
            <label className="neon-label">Select User:</label>
            <select
              className="neon-input"
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
            >
              <option value="">-- Select a user --</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name && user.last_name
                    ? `${user.first_name} ${user.last_name}`
                    : user.email}
                </option>
              ))}
            </select>
          </>
        )}
        {!loading && selectedUserId && (
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
            <button
              className="neon-btn neon-btn-save mt-4"
              onClick={handleSave}
              disabled={saving}
              type="button"
            >
              {saving ? "Saving..." : "Save Permissions"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default UserPermissionsManager;
