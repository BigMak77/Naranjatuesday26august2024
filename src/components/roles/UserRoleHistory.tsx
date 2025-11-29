"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import TextIconButton from "@/components/ui/TextIconButtons";
import { FiUser, FiCalendar, FiClock, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface RoleHistoryEntry {
  id: string;
  auth_id: string; // Primary identifier - user's auth ID
  user_id: string; // Kept for backward compatibility
  old_role_id: string | null;
  old_department_id: string | null;
  new_role_id: string | null;
  new_department_id: string | null;
  changed_by_auth_id: string | null; // Auth ID of user who made change
  changed_by: string | null; // Kept for backward compatibility
  change_reason: string | null;
  changed_at: string;
  created_at: string;
  // Joined data
  user?: {
    id: string;
    auth_id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  old_role?: {
    id: string;
    title: string;
  };
  new_role?: {
    id: string;
    title: string;
  };
  old_department?: {
    id: string;
    name: string;
  };
  new_department?: {
    id: string;
    name: string;
  };
  changed_by_user?: {
    id: string;
    auth_id: string;
    first_name: string;
    last_name: string;
  };
}

interface UserAssignment {
  id: string;
  auth_id: string;
  item_id: string;
  item_type: string;
  assigned_at: string;
  completed_at: string | null;
  status: string;
  // Joined data
  module?: {
    id: string;
    name?: string;
    title?: string;
  };
  document?: {
    id: string;
    title: string;
  };
}

interface UserRoleHistoryProps {
  onControlsReady?: (controls: {
    roleHistoryCount: number;
    refreshData: () => void;
  }) => void;
}

const UserRoleHistory: React.FC<UserRoleHistoryProps> = ({ onControlsReady }) => {
  const [roleHistory, setRoleHistory] = useState<RoleHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [userAssignments, setUserAssignments] = useState<Map<string, UserAssignment[]>>(new Map());
  const [loadingAssignments, setLoadingAssignments] = useState<Set<string>>(new Set());


  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (onControlsReady) {
      onControlsReady({
        roleHistoryCount: roleHistory.length,
        refreshData: fetchData
      });
    }
  }, [roleHistory.length, onControlsReady]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      // First, fetch role history data without joins
      const { data: historyData, error: historyError } = await supabase
        .from("user_role_history")
        .select("*")
        .order("changed_at", { ascending: false });

      if (historyError) {
        console.error("Error fetching role history:", historyError);
        throw historyError;
      }

      if (!historyData || historyData.length === 0) {
        setRoleHistory([]);
        return;
      }

      // Fetch all users, roles, and departments
      const [usersRes, rolesRes, departmentsRes] = await Promise.all([
        supabase.from("users").select("id, auth_id, first_name, last_name, email"),
        supabase.from("roles").select("id, title"),
        supabase.from("departments").select("id, name")
      ]);

      // Create maps for lookups
      const usersMapById = new Map((usersRes.data || []).map(u => [u.id, u]));
      const rolesMap = new Map((rolesRes.data || []).map(r => [r.id, r]));
      const departmentsMap = new Map((departmentsRes.data || []).map(d => [d.id, d]));

      // Manually join the data and add auth_id from users table
      const enrichedHistory = historyData.map(entry => {
        const user = usersMapById.get(entry.user_id) || null;
        const changedByUser = usersMapById.get(entry.changed_by) || null;

        return {
          ...entry,
          auth_id: user?.auth_id || null, // Add auth_id from users table
          user,
          old_role: entry.old_role_id ? rolesMap.get(entry.old_role_id) || null : null,
          new_role: entry.new_role_id ? rolesMap.get(entry.new_role_id) || null : null,
          old_department: entry.old_department_id ? departmentsMap.get(entry.old_department_id) || null : null,
          new_department: entry.new_department_id ? departmentsMap.get(entry.new_department_id) || null : null,
          changed_by_user: changedByUser
        };
      });

      setRoleHistory(enrichedHistory);
    } catch (err: any) {
      console.error("Error fetching role history:", err);
      setError(err.message || "Failed to load role history");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignmentsForRole = async (entryId: string, userId: string, roleId: string | null, authId: string | null) => {
    if (!authId) {
      console.warn("No auth_id available for user");
      return;
    }

    try {
      setLoadingAssignments(prev => new Set(prev).add(entryId));

      console.log("🔍 Fetching training for:", { entryId, userId, roleId, authId });

      // Fetch completed assignments from user_training_completions filtered by role
      // This table tracks which role the user had when they completed training
      let historicalCompletions: any[] = [];

      // First, check all completions for this user to see what data exists
      const { data: allUserCompletions } = await supabase
        .from("user_training_completions")
        .select("item_id, item_type, completed_at, completed_by_role_id")
        .eq("auth_id", authId);

      console.log("📊 All completions for user:", allUserCompletions);

      if (roleId) {
        // Fetch completions that were completed while user had this specific role
        const { data, error: historicalError } = await supabase
          .from("user_training_completions")
          .select("item_id, item_type, completed_at, completed_by_role_id")
          .eq("auth_id", authId)
          .eq("completed_by_role_id", roleId);

        console.log("✅ Filtered by roleId:", roleId, "Results:", data);

        if (historicalError) {
          console.warn("Could not fetch historical completions:", historicalError);
        } else {
          historicalCompletions = data || [];
        }
      } else {
        // If no role ID, show completions where completed_by_role_id is null
        const { data, error: historicalError } = await supabase
          .from("user_training_completions")
          .select("item_id, item_type, completed_at, completed_by_role_id")
          .eq("auth_id", authId)
          .is("completed_by_role_id", null);

        console.log("✅ Filtered by null roleId, Results:", data);

        if (historicalError) {
          console.warn("Could not fetch historical completions:", historicalError);
        } else {
          historicalCompletions = data || [];
        }
      }

      const allCompletions: UserAssignment[] = [];

      // Build list from historical completions
      for (const hist of historicalCompletions) {
        // Fetch module/document name
        let itemData: any = undefined;

        if (hist.item_type === "module") {
          const { data: moduleData } = await supabase
            .from("modules")
            .select("id, name")
            .eq("id", hist.item_id)
            .single();
          if (moduleData) {
            itemData = { id: moduleData.id, name: moduleData.name };
          }
        } else if (hist.item_type === "document") {
          const { data: docData } = await supabase
            .from("documents")
            .select("id, title")
            .eq("id", hist.item_id)
            .single();
          if (docData) {
            itemData = { id: docData.id, title: docData.title };
          }
        }

        allCompletions.push({
          id: `historical-${hist.item_id}`,
          auth_id: authId,
          item_id: hist.item_id,
          item_type: hist.item_type,
          assigned_at: hist.completed_at || "",
          completed_at: hist.completed_at,
          status: "completed",
          module: hist.item_type === "module" ? itemData : undefined,
          document: hist.item_type === "document" ? itemData : undefined,
        });
      }

      // Sort by completion date (most recent first)
      allCompletions.sort((a, b) => {
        if (!a.completed_at) return 1;
        if (!b.completed_at) return -1;
        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
      });

      setUserAssignments(prev => new Map(prev).set(entryId, allCompletions));
    } catch (err: any) {
      console.error("Error fetching assignments:", err);
    } finally {
      setLoadingAssignments(prev => {
        const newSet = new Set(prev);
        newSet.delete(entryId);
        return newSet;
      });
    }
  };

  const toggleExpanded = (entryId: string, userId: string, roleId: string | null, authId: string | null) => {
    const isExpanding = !expandedEntries.has(entryId);

    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (isExpanding) {
        newSet.add(entryId);
        // Fetch assignments when expanding
        if (!userAssignments.has(entryId)) {
          fetchAssignmentsForRole(entryId, userId, roleId, authId);
        }
      } else {
        newSet.delete(entryId);
      }
      return newSet;
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };


  return (
    <>
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", opacity: 0.7 }}>
          Loading role history...
        </div>
      ) : error ? (
        <div style={{
          padding: "1rem",
          background: "rgba(255, 0, 0, 0.1)",
          border: "1px solid rgba(255, 0, 0, 0.3)",
          borderRadius: "8px",
          color: "#ff6b6b"
        }}>
          {error}
        </div>
      ) : roleHistory.length === 0 ? (
        <div style={{
          textAlign: "center",
          padding: "2rem",
          opacity: 0.7,
          background: "rgba(64, 224, 208, 0.05)",
          borderRadius: "8px"
        }}>
          No role history entries found
        </div>
      ) : (
        <div className="user-role-history-list">
          <table className="neon-table">
            <thead>
              <tr>
                <th></th>
                <th>User</th>
                <th>Previous Role</th>
                <th>New Role</th>
                <th>Previous Department</th>
                <th>New Department</th>
                <th>Changed By</th>
                <th>Changed At</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {roleHistory.map((entry: RoleHistoryEntry) => {
                const isExpanded = expandedEntries.has(entry.id);
                const assignments = userAssignments.get(entry.id) || [];
                const isLoadingAssignments = loadingAssignments.has(entry.id);

                return (
                  <React.Fragment key={entry.id}>
                    <tr>
                      <td>
                        <button
                          onClick={() => toggleExpanded(entry.id, entry.user_id, entry.old_role_id, entry.auth_id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#40e0d0",
                            cursor: "pointer",
                            padding: "0.25rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title={isExpanded ? "Hide completed training history" : "Show completed training history"}
                        >
                          {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                        </button>
                      </td>
                      <td>
                        {entry.user ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {entry.user.first_name} {entry.user.last_name}
                            </div>
                            <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                              {entry.user.email}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{entry.old_role?.title || "—"}</td>
                      <td>
                        <span style={{ color: "#40e0d0", fontWeight: 500 }}>
                          {entry.new_role?.title || "—"}
                        </span>
                      </td>
                      <td>{entry.old_department?.name || "—"}</td>
                      <td>
                        <span style={{ color: "#40e0d0" }}>
                          {entry.new_department?.name || "—"}
                        </span>
                      </td>
                      <td>
                        {entry.changed_by_user ? (
                          `${entry.changed_by_user.first_name} ${entry.changed_by_user.last_name}`
                        ) : (
                          "System"
                        )}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>
                        {formatDateTime(entry.changed_at)}
                      </td>
                      <td style={{ fontSize: "0.875rem" }}>
                        {entry.change_reason || "—"}
                      </td>
                    </tr>

                    {/* Expanded row showing assignments */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={9} style={{
                          padding: "1rem 2rem",
                          background: "rgba(64, 224, 208, 0.05)"
                        }}>
                          <div>
                            <h4 style={{
                              color: "#40e0d0",
                              marginBottom: "1rem",
                              fontSize: "0.875rem",
                              fontWeight: 600
                            }}>
                              Completed Training History for {entry.user?.first_name} {entry.user?.last_name}
                            </h4>
                            <p style={{
                              opacity: 0.7,
                              fontSize: "0.75rem",
                              marginBottom: "1rem"
                            }}>
                              All completed training modules and documents (travels with the user across all roles)
                            </p>

                            {isLoadingAssignments ? (
                              <div style={{ opacity: 0.7, fontSize: "0.875rem" }}>
                                Loading completed training history...
                              </div>
                            ) : assignments.length === 0 ? (
                              <div style={{ opacity: 0.7, fontSize: "0.875rem" }}>
                                No completed training found
                              </div>
                            ) : (
                              <table className="neon-table" style={{ fontSize: "0.875rem" }}>
                                <thead>
                                  <tr>
                                    <th>Type</th>
                                    <th>Item</th>
                                    <th>Completed At</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {assignments.map((assignment) => (
                                    <tr key={assignment.id}>
                                      <td>
                                        <span style={{
                                          padding: "0.25rem 0.5rem",
                                          borderRadius: "4px",
                                          fontSize: "0.75rem",
                                          background: assignment.item_type === "module"
                                            ? "rgba(100, 149, 237, 0.2)"
                                            : "rgba(255, 165, 0, 0.2)",
                                          color: assignment.item_type === "module"
                                            ? "#6495ed"
                                            : "#ffa500"
                                        }}>
                                          {assignment.item_type}
                                        </span>
                                      </td>
                                      <td>
                                        {assignment.item_type === "module"
                                          ? assignment.module?.name || assignment.module?.title
                                          : assignment.document?.title || "—"}
                                      </td>
                                      <td>
                                        <span style={{
                                          color: "#00ff00",
                                          fontWeight: 500
                                        }}>
                                          {assignment.completed_at
                                            ? formatDateTime(assignment.completed_at)
                                            : "—"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default UserRoleHistory;
