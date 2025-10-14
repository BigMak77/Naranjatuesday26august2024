"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonPanel from "@/components/NeonPanel";
import SuccessModal from "@/components/ui/SuccessModal";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface Permission {
  id: string;
  key: string;
  category: string;
  description: string;
  created_at: string;
}

export default function PermissionManager() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form state
  const [newPermissionKey, setNewPermissionKey] = useState("");
  const [newPermissionCategory, setNewPermissionCategory] = useState("");
  const [newPermissionDescription, setNewPermissionDescription] = useState("");
  const [error, setError] = useState("");

  // Predefined categories
  const categories = [
    "admin",
    "super-manager",
    "manager",
    "turkus",
    "health-safety",
    "hr",
    "training",
    "documents",
    "reports",
    "custom"
  ];

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("permissions")
      .select("*")
      .order("category", { ascending: true })
      .order("key", { ascending: true });

    if (error) {
      console.error("Error fetching permissions:", error);
    } else {
      setPermissions(data || []);
    }
    setLoading(false);
  };

  const handleAddPermission = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Validate
    if (!newPermissionKey || !newPermissionCategory) {
      setError("Permission key and category are required");
      setSaving(false);
      return;
    }

    // Format the key: category:action
    const formattedKey = `${newPermissionCategory}:${newPermissionKey}`;

    // Check if permission already exists
    const existing = permissions.find(p => p.key === formattedKey);
    if (existing) {
      setError("Permission with this key already exists");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("permissions")
      .insert({
        key: formattedKey,
        category: newPermissionCategory,
        description: newPermissionDescription || null
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    // Reset form and refresh
    setNewPermissionKey("");
    setNewPermissionCategory("");
    setNewPermissionDescription("");
    setShowAddForm(false);
    setSaving(false);
    fetchPermissions();
  };

  const handleDeletePermission = async (id: string) => {
    if (!confirm("Are you sure you want to delete this permission?")) {
      return;
    }

    const { error } = await supabase
      .from("permissions")
      .delete()
      .eq("id", id);

    if (error) {
      alert("Error deleting permission: " + error.message);
    } else {
      fetchPermissions();
    }
  };

  // Group permissions by category
  const groupedPermissions = permissions.reduce((acc, perm) => {
    if (!acc[perm.category]) {
      acc[perm.category] = [];
    }
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, Permission[]>);

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  return (
    <div>
      <NeonPanel>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 className="neon-heading">Permission Manager</h2>
          <CustomTooltip text={showAddForm ? "Cancel adding new permission" : "Create a new system permission"}>
            <button
              className="neon-btn neon-btn-add"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              {showAddForm ? "Cancel" : "Add New Permission"}
            </button>
          </CustomTooltip>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddPermission} style={{ marginBottom: "2rem" }}>
            <div className="neon-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
              <h3 className="neon-heading" style={{ marginBottom: "1rem" }}>Create New Permission</h3>

              <label className="neon-label">
                Category:
                <select
                  className="neon-input"
                  value={newPermissionCategory}
                  onChange={e => setNewPermissionCategory(e.target.value)}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>

              <label className="neon-label">
                Permission Action:
                <input
                  type="text"
                  className="neon-input"
                  value={newPermissionKey}
                  onChange={e => setNewPermissionKey(e.target.value)}
                  placeholder="e.g., view, edit, manage-users"
                  required
                />
                <small style={{ color: "#999", fontSize: "0.85rem" }}>
                  Will be formatted as: {newPermissionCategory}:{newPermissionKey}
                </small>
              </label>

              <label className="neon-label">
                Description (optional):
                <textarea
                  className="neon-input"
                  value={newPermissionDescription}
                  onChange={e => setNewPermissionDescription(e.target.value)}
                  placeholder="Describe what this permission allows"
                  rows={3}
                />
              </label>

              {error && <div style={{ color: "#ef4444", marginBottom: "1rem" }}>{error}</div>}

              <div style={{ display: "flex", gap: "12px" }}>
                <CustomTooltip text={saving ? "Creating new permission..." : "Save the new permission to database"}>
                  <button
                    type="submit"
                    className="neon-btn neon-btn-save"
                    disabled={saving}
                  >
                    {saving ? "Creating..." : "Create Permission"}
                  </button>
                </CustomTooltip>
                <CustomTooltip text="Cancel and close the form">
                  <button
                    type="button"
                    className="neon-btn neon-btn-close"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </button>
                </CustomTooltip>
              </div>
            </div>
          </form>
        )}

        <div>
          <h3 className="neon-heading" style={{ marginBottom: "1rem" }}>Existing Permissions</h3>

          {Object.keys(groupedPermissions).length === 0 ? (
            <p style={{ color: "#999" }}>No permissions defined yet. Add your first permission above.</p>
          ) : (
            Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} style={{ marginBottom: "2rem" }}>
                <h4 className="neon-heading" style={{
                  fontSize: "1rem",
                  textTransform: "uppercase",
                  marginBottom: "0.75rem",
                  color: "#2edbd0"
                }}>
                  {category}
                </h4>
                <table className="neon-table">
                  <thead>
                    <tr>
                      <th>Permission Key</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {perms.map(perm => (
                      <tr key={perm.id}>
                        <td>
                          <code style={{
                            background: "#1a1a1a",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            color: "#2edbd0"
                          }}>
                            {perm.key}
                          </code>
                        </td>
                        <td>{perm.description || <em style={{ color: "#666" }}>No description</em>}</td>
                        <td>
                          <CustomTooltip text="Permanently delete this permission">
                            <button
                              className="neon-btn neon-btn-delete"
                              onClick={() => handleDeletePermission(perm.id)}
                            >
                              Delete
                            </button>
                          </CustomTooltip>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      </NeonPanel>
    </div>
  );
}
