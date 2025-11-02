"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import { FiHeart, FiShield, FiCheck, FiX } from "react-icons/fi";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface User {
  id: string;
  auth_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  permissions?: string[];
}

interface QuickPermissionAssignProps {
  userId?: string;
  onUpdate?: () => void;
}

/**
 * QuickPermissionAssign - A simplified component for assigning First Aider and Safety Rep permissions
 */
export default function QuickPermissionAssign({ userId, onUpdate }: QuickPermissionAssignProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Permission states
  const [isFirstAider, setIsFirstAider] = useState(false);
  const [isSafetyRep, setIsSafetyRep] = useState(false);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("users")
        .select("id, auth_id, email, first_name, last_name, permissions")
        .order("first_name", { ascending: true });

      if (data && !error) {
        setUsers(data);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  // Update permission states when user changes
  useEffect(() => {
    const user = users.find((u) => u.id === selectedUserId);
    if (user && user.permissions) {
      const perms = user.permissions;
      setIsFirstAider(
        perms.includes("health-safety:add-first-aid-report") ||
        perms.includes("health-safety:manage-first-aid")
      );
      setIsSafetyRep(
        perms.includes("health-safety:add-risk-assessment") ||
        perms.includes("health-safety:manage-risk-assessments")
      );
    } else {
      setIsFirstAider(false);
      setIsSafetyRep(false);
    }
  }, [selectedUserId, users]);

  const handleSave = async () => {
    if (!selectedUserId) {
      setMessage({ type: "error", text: "Please select a user" });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const user = users.find((u) => u.id === selectedUserId);
      if (!user) throw new Error("User not found");

      // Build new permissions array
      let permissions = user.permissions || [];

      // Remove all first aider and safety rep permissions first
      permissions = permissions.filter(
        (p) =>
          !p.startsWith("health-safety:add-first-aid-report") &&
          !p.startsWith("health-safety:edit-first-aid-report") &&
          !p.startsWith("health-safety:manage-first-aid") &&
          !p.startsWith("health-safety:add-risk-assessment") &&
          !p.startsWith("health-safety:edit-risk-assessment") &&
          !p.startsWith("health-safety:manage-risk-assessments") &&
          !p.startsWith("health-safety:approve-risk-assessment")
      );

      // Add permissions based on checkboxes
      if (isFirstAider) {
        permissions.push("health-safety:add-first-aid-report");
        permissions.push("health-safety:edit-first-aid-report");
      }

      if (isSafetyRep) {
        permissions.push("health-safety:add-risk-assessment");
        permissions.push("health-safety:edit-risk-assessment");
      }

      // Update database
      const { error } = await supabase
        .from("users")
        .update({ permissions })
        .eq("id", selectedUserId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUserId ? { ...u, permissions } : u))
      );

      setMessage({ type: "success", text: "Permissions updated successfully!" });

      if (onUpdate) {
        onUpdate();
      }

      // Clear success message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error updating permissions:", error);
      setMessage({ type: "error", text: "Failed to update permissions" });
    } finally {
      setSaving(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.email;
  };

  if (loading) {
    return (
      <div className="neon-card p-6">
        <p className="text-gray-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="neon-card p-6">
      <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
        <FiShield className="text-cyan-400" />
        Quick Permission Assignment
      </h3>

      <div className="space-y-4">
        {/* User Selection */}
        <div>
          <label className="neon-label">Select User:</label>
          <select
            className="neon-input w-full"
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            disabled={!!userId}
          >
            <option value="">-- Select a user --</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {getUserDisplayName(user)}
              </option>
            ))}
          </select>
        </div>

        {selectedUserId && (
          <div className="space-y-3 mt-6">
            {/* First Aider Permission */}
            <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-cyan-500/20">
              <FiHeart className="text-red-400 text-xl" />
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFirstAider}
                  onChange={(e) => setIsFirstAider(e.target.checked)}
                  className="w-5 h-5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className="font-semibold text-white">First Aider</div>
                  <div className="text-sm text-gray-400">
                    Can add and edit first aid reports
                  </div>
                </div>
              </label>
            </div>

            {/* Safety Representative Permission */}
            <div className="flex items-center gap-3 p-4 bg-black/30 rounded-lg border border-cyan-500/20">
              <FiShield className="text-yellow-400 text-xl" />
              <label className="flex items-center gap-3 flex-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isSafetyRep}
                  onChange={(e) => setIsSafetyRep(e.target.checked)}
                  className="w-5 h-5 rounded border-cyan-500 text-cyan-500 focus:ring-cyan-500"
                />
                <div>
                  <div className="font-semibold text-white">Safety Representative</div>
                  <div className="text-sm text-gray-400">
                    Can add and edit risk assessments
                  </div>
                </div>
              </label>
            </div>

            {/* Save Button */}
            <div className="flex gap-3 mt-6">
              <CustomTooltip text={saving ? "Saving permissions..." : "Save permission changes"}>
                <button
                  className="neon-btn neon-btn-save flex items-center gap-2"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <FiCheck />
                  {saving ? "Saving..." : "Save Permissions"}
                </button>
              </CustomTooltip>
            </div>

            {/* Status Message */}
            {message && (
              <div
                className={`p-3 rounded-lg border ${
                  message.type === "success"
                    ? "bg-green-500/10 border-green-500/30 text-green-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
