"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import TextIconButton from "@/components/ui/TextIconButtons";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import SuccessModal from "@/components/ui/SuccessModal";
import {
  FiUsers,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiSave,
  FiX,
  FiUserPlus,
  FiUserMinus,
  FiFileText,
  FiBook,
} from "react-icons/fi";

interface User {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string;
  employee_number?: string;
  role_id?: string;
  roles?: {
    name: string;
  };
}

interface TrainingGroup {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  member_count?: number;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  added_at: string;
  users?: User;
}

interface Module {
  id: string;
  name: string;
  ref_code?: string;
  version: string;
}

interface Document {
  id: string;
  title: string;
  reference_code?: string;
  current_version?: number;
}

interface GroupAssignment {
  id: string;
  group_id: string;
  item_id: string;
  item_type: "module" | "document";
  assigned_at: string;
  modules?: Module;
  documents?: Document;
}

type Stage = "list" | "create" | "edit" | "manage-members" | "manage-assignments";

export default function GroupTraining() {
  const [stage, setStage] = useState<Stage>("list");
  const [groups, setGroups] = useState<TrainingGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<TrainingGroup | null>(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  // Member management
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [availableUserSearch, setAvailableUserSearch] = useState("");

  // Assignment management
  const [groupAssignments, setGroupAssignments] = useState<GroupAssignment[]>([]);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [availableDocuments, setAvailableDocuments] = useState<Document[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [assignmentStep, setAssignmentStep] = useState<"modules" | "documents">("modules");
  const [moduleSearch, setModuleSearch] = useState("");
  const [documentSearch, setDocumentSearch] = useState("");

  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Load groups on mount
  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_groups")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;

      // Get member counts for each group
      const groupsWithCounts = await Promise.all(
        (data || []).map(async (group) => {
          const { count } = await supabase
            .from("training_group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id);

          return {
            ...group,
            member_count: count || 0,
          };
        })
      );

      setGroups(groupsWithCounts);
    } catch (error) {
      console.error("Error fetching groups:", error);
      alert("Failed to load training groups");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_groups")
        .insert([
          {
            name: groupName.trim(),
            description: groupDescription.trim(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSuccessMessage("Training group created successfully!");
      setShowSuccessModal(true);
      setGroupName("");
      setGroupDescription("");
      setStage("list");
      fetchGroups();
    } catch (error: any) {
      console.error("Error creating group:", error);
      alert(`Failed to create group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("training_groups")
        .update({
          name: groupName.trim(),
          description: groupDescription.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", selectedGroup.id);

      if (error) throw error;

      setSuccessMessage("Training group updated successfully!");
      setShowSuccessModal(true);
      setStage("list");
      fetchGroups();
    } catch (error: any) {
      console.error("Error updating group:", error);
      alert(`Failed to update group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (group: TrainingGroup) => {
    if (!confirm(`Are you sure you want to delete "${group.name}"? This will remove all members and assignments.`)) {
      return;
    }

    setLoading(true);
    try {
      // Delete group (cascading will handle members and assignments)
      const { error } = await supabase
        .from("training_groups")
        .delete()
        .eq("id", group.id);

      if (error) throw error;

      setSuccessMessage("Group deleted successfully!");
      setShowSuccessModal(true);
      fetchGroups();
    } catch (error: any) {
      console.error("Error deleting group:", error);
      alert(`Failed to delete group: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Member Management Functions
  const fetchGroupMembers = async (groupId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_group_members")
        .select(`
          *,
          users!inner (
            id,
            auth_id,
            first_name,
            last_name,
            email,
            employee_number,
            role_id
          )
        `)
        .eq("group_id", groupId)
        .order("added_at", { ascending: false });

      if (error) throw error;

      // Get all unique role IDs from members
      const roleIds = [...new Set(
        (data || [])
          .map((m) => m.users?.role_id)
          .filter((id): id is string => !!id)
      )];

      // Fetch all roles at once
      let rolesMap = new Map<string, { name: string }>();
      if (roleIds.length > 0) {
        const { data: roles, error: rolesError } = await supabase
          .from("roles")
          .select("id, title")
          .in("id", roleIds);

        if (rolesError) {
          console.error("Error fetching roles:", rolesError);
        } else if (roles) {
          rolesMap = new Map(roles.map((r) => [r.id, { name: r.title }]));
        }
      }

      // Map roles to members
      const usersWithRoles = (data || []).map((member) => {
        const user = member.users;
        const roleData = user?.role_id ? rolesMap.get(user.role_id) : null;
        return {
          ...member,
          users: {
            ...user,
            roles: roleData || null
          }
        };
      });

      console.log("Group members with roles:", usersWithRoles);
      setGroupMembers(usersWithRoles);

      // Fetch available users (not in this group)
      const memberUserIds = (data || []).map((m) => m.user_id);
      const { data: users, error: usersError } = await supabase
        .from("users")
        .select(`
          id,
          auth_id,
          first_name,
          last_name,
          email,
          employee_number,
          role_id
        `)
        .order("last_name", { ascending: true });

      if (usersError) throw usersError;

      // Get unique role IDs for available users
      const availableRoleIds = [...new Set(
        (users || [])
          .map((u) => u.role_id)
          .filter((id): id is string => !!id)
      )];

      // Fetch roles for available users
      let availableRolesMap = new Map<string, { name: string }>();
      if (availableRoleIds.length > 0) {
        const { data: roles, error: availableRolesError } = await supabase
          .from("roles")
          .select("id, title")
          .in("id", availableRoleIds);

        if (availableRolesError) {
          console.error("Error fetching available roles:", availableRolesError);
        } else if (roles) {
          availableRolesMap = new Map(roles.map((r) => [r.id, { name: r.title }]));
        }
      }

      // Map roles to users
      const usersWithRoleNames = (users || []).map((user) => ({
        ...user,
        roles: user.role_id ? availableRolesMap.get(user.role_id) : undefined
      }));

      const available = usersWithRoleNames.filter(
        (u) => !memberUserIds.includes(u.id)
      );
      setAvailableUsers(available);
    } catch (error) {
      console.error("Error fetching group members:", error);
      alert("Failed to load group members");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async () => {
    if (!selectedGroup || selectedUsers.length === 0) {
      alert("Please select at least one user to add");
      return;
    }

    setLoading(true);
    try {
      // Add members to group
      const membersToAdd = selectedUsers.map((userId) => ({
        group_id: selectedGroup.id,
        user_id: userId,
      }));

      const { error: membersError } = await supabase
        .from("training_group_members")
        .insert(membersToAdd);

      if (membersError) throw membersError;

      // Sync assignments for new members
      const response = await fetch("/api/sync-group-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          userIds: selectedUsers,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync assignments");
      }

      setSuccessMessage(`Successfully added ${selectedUsers.length} member(s) to the group!`);
      setShowSuccessModal(true);
      setSelectedUsers([]);
      fetchGroupMembers(selectedGroup.id);
    } catch (error: any) {
      console.error("Error adding members:", error);
      alert(`Failed to add members: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMembers = async (memberIds: string[]) => {
    if (!selectedGroup) return;

    if (!confirm(`Remove ${memberIds.length} member(s) from this group? Their training assignments will also be removed.`)) {
      return;
    }

    setLoading(true);
    try {
      // Get user_ids before deleting members
      const membersToRemove = groupMembers.filter((m) =>
        memberIds.includes(m.id)
      );
      const userIds = membersToRemove.map((m) => m.user_id);

      // Delete members
      const { error: deleteError } = await supabase
        .from("training_group_members")
        .delete()
        .in("id", memberIds);

      if (deleteError) throw deleteError;

      // Remove user assignments for this group
      const response = await fetch("/api/remove-group-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
          userIds: userIds,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove assignments");
      }

      setSuccessMessage("Members removed successfully!");
      setShowSuccessModal(true);
      fetchGroupMembers(selectedGroup.id);
    } catch (error: any) {
      console.error("Error removing members:", error);
      alert(`Failed to remove members: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Assignment Management Functions
  const fetchGroupAssignments = async (groupId: string) => {
    setLoading(true);
    try {
      // Fetch current assignments (without nested joins)
      const { data: assignments, error } = await supabase
        .from("training_group_assignments")
        .select("*")
        .eq("group_id", groupId);

      if (error) throw error;

      // Set selected items based on current assignments
      const moduleIds = (assignments || [])
        .filter((a) => a.item_type === "module")
        .map((a) => a.item_id);
      const documentIds = (assignments || [])
        .filter((a) => a.item_type === "document")
        .map((a) => a.item_id);

      setSelectedModules(moduleIds);
      setSelectedDocuments(documentIds);

      // Fetch available modules and documents
      const [modulesRes, documentsRes] = await Promise.all([
        supabase
          .from("modules")
          .select("id, name, ref_code, version")
          .eq("is_archived", false)
          .order("name", { ascending: true }),
        supabase
          .from("documents")
          .select("id, title, reference_code, current_version")
          .eq("archived", false)
          .order("title", { ascending: true }),
      ]);

      if (modulesRes.error) throw modulesRes.error;
      if (documentsRes.error) throw documentsRes.error;

      const allModules = modulesRes.data || [];
      const allDocuments = documentsRes.data || [];

      // Build enriched assignments by matching IDs
      const enrichedAssignments = (assignments || []).map((assignment) => {
        if (assignment.item_type === "module") {
          const module = allModules.find((m) => m.id === assignment.item_id);
          return {
            ...assignment,
            modules: module || null,
            documents: null,
          };
        } else {
          const document = allDocuments.find((d) => d.id === assignment.item_id);
          return {
            ...assignment,
            modules: null,
            documents: document || null,
          };
        }
      });

      setGroupAssignments(enrichedAssignments);
      setAvailableModules(allModules);
      setAvailableDocuments(allDocuments);
    } catch (error) {
      console.error("Error fetching group assignments:", error);
      alert("Failed to load group assignments");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAssignments = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from("training_group_assignments")
        .delete()
        .eq("group_id", selectedGroup.id);

      if (deleteError) throw deleteError;

      // Insert new assignments
      const newAssignments = [
        ...selectedModules.map((moduleId) => ({
          group_id: selectedGroup.id,
          item_id: moduleId,
          item_type: "module" as const,
        })),
        ...selectedDocuments.map((documentId) => ({
          group_id: selectedGroup.id,
          item_id: documentId,
          item_type: "document" as const,
        })),
      ];

      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from("training_group_assignments")
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      // Sync assignments to all group members
      const response = await fetch("/api/sync-group-training", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupId: selectedGroup.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to sync assignments");
      }

      setSuccessMessage("Assignments saved and synced to all group members!");
      setShowSuccessModal(true);
      setStage("list");
      fetchGroups();
    } catch (error: any) {
      console.error("Error saving assignments:", error);
      alert(`Failed to save assignments: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  // Render functions
  const renderGroupsList = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600 }}>
          Training Groups
        </h3>
        <CustomTooltip text="Create a new training group">
          <TextIconButton
            variant="add"
            icon={<FiPlus />}
            label="Create Group"
            onClick={() => {
              setGroupName("");
              setGroupDescription("");
              setStage("create");
            }}
          />
        </CustomTooltip>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 40 }}>
          Loading groups...
        </p>
      ) : groups.length === 0 ? (
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: 40, fontStyle: "italic" }}>
          No training groups created yet. Create your first group to get started.
        </p>
      ) : (
        <NeonTable
          columns={[
            { header: "Group Name", accessor: "name", align: "center" },
            { header: "Description", accessor: "description", align: "center" },
            { header: "Members", accessor: "members", width: 100, align: "center" },
            { header: "Created", accessor: "created", width: 120, align: "center" },
            { header: "Actions", accessor: "actions", width: 400, align: "center" },
          ]}
          data={groups.map((group) => ({
            name: group.name,
            description: group.description || <span style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No description</span>,
            members: (
              <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                {group.member_count || 0}
              </span>
            ),
            created: new Date(group.created_at).toLocaleDateString(),
            actions: (
              <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                <CustomTooltip text="Manage group members">
                  <TextIconButton
                    variant="view"
                    icon={<FiUserPlus />}
                    label="Members"
                    onClick={() => {
                      setSelectedGroup(group);
                      fetchGroupMembers(group.id);
                      setStage("manage-members");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Manage training assignments">
                  <TextIconButton
                    variant="next"
                    icon={<FiBook />}
                    label="Assignments"
                    onClick={() => {
                      setSelectedGroup(group);
                      fetchGroupAssignments(group.id);
                      setAssignmentStep("modules");
                      setStage("manage-assignments");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Edit group details">
                  <TextIconButton
                    variant="edit"
                    icon={<FiEdit />}
                    label="Edit"
                    onClick={() => {
                      setSelectedGroup(group);
                      setGroupName(group.name);
                      setGroupDescription(group.description || "");
                      setStage("edit");
                    }}
                  />
                </CustomTooltip>
                <CustomTooltip text="Delete this group">
                  <TextIconButton
                    variant="delete"
                    icon={<FiTrash2 />}
                    label="Delete"
                    onClick={() => handleDeleteGroup(group)}
                  />
                </CustomTooltip>
              </div>
            ),
          }))}
        />
      )}
    </div>
  );

  const renderCreateEdit = () => (
    <div>
      <h3 style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600, marginBottom: 16 }}>
        {stage === "create" ? "Create Training Group" : "Edit Training Group"}
      </h3>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, color: "var(--text-primary)", fontWeight: 500 }}>
          Group Name *
        </label>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Enter group name..."
          className="neon-input"
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: 24 }}>
        <label style={{ display: "block", marginBottom: 8, color: "var(--text-primary)", fontWeight: 500 }}>
          Description
        </label>
        <textarea
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          placeholder="Enter group description..."
          className="neon-input"
          style={{ width: "100%", minHeight: 80, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <CustomTooltip text={stage === "create" ? "Create the group" : "Save changes"}>
          <TextIconButton
            variant="save"
            icon={<FiSave />}
            label={stage === "create" ? "Create Group" : "Save Changes"}
            onClick={stage === "create" ? handleCreateGroup : handleEditGroup}
            disabled={loading}
          />
        </CustomTooltip>
        <CustomTooltip text="Cancel and go back">
          <TextIconButton
            variant="cancel"
            icon={<FiX />}
            label="Cancel"
            onClick={() => setStage("list")}
            disabled={loading}
          />
        </CustomTooltip>
      </div>
    </div>
  );

  const renderManageMembers = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600 }}>
          Manage Members: {selectedGroup?.name}
        </h3>
        <CustomTooltip text="Back to groups list">
          <TextIconButton
            variant="cancel"
            icon={<FiX />}
            label="Back"
            onClick={() => setStage("list")}
          />
        </CustomTooltip>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 600 }}>
            Current Members ({groupMembers.filter((member) => {
              const user = member.users;
              if (!user) return false;
              const searchLower = memberSearch.toLowerCase();
              return (
                user.first_name?.toLowerCase().includes(searchLower) ||
                user.last_name?.toLowerCase().includes(searchLower) ||
                user.employee_number?.toLowerCase().includes(searchLower) ||
                user.roles?.name?.toLowerCase().includes(searchLower)
              );
            }).length})
          </h4>
          <input
            type="text"
            placeholder="Search members..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            className="neon-input"
            style={{ width: 300 }}
          />
        </div>
        {groupMembers.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: 16 }}>
            No members in this group yet. Add members below.
          </p>
        ) : (
          <NeonTable
            columns={[
              { header: "Name", accessor: "name", align: "center" },
              { header: "Emp #", accessor: "emp_number", width: 120, align: "center" },
              { header: "Role", accessor: "role", width: 200, align: "center" },
              { header: "Added", accessor: "added", width: 120, align: "center" },
              { header: "Actions", accessor: "actions", width: 120, align: "center" },
            ]}
            data={groupMembers
              .filter((member) => {
                const user = member.users;
                if (!user) return false;
                const searchLower = memberSearch.toLowerCase();
                return (
                  user.first_name?.toLowerCase().includes(searchLower) ||
                  user.last_name?.toLowerCase().includes(searchLower) ||
                  user.employee_number?.toLowerCase().includes(searchLower) ||
                  user.roles?.name?.toLowerCase().includes(searchLower)
                );
              })
              .map((member) => {
                const user = member.users;
                return {
                  name: user ? `${user.last_name}, ${user.first_name}` : "Unknown",
                  emp_number: user?.employee_number || <span style={{ color: "var(--text-secondary)" }}>—</span>,
                  role: user?.roles?.name || <span style={{ color: "var(--text-secondary)" }}>No role</span>,
                  added: new Date(member.added_at).toLocaleDateString(),
                  actions: (
                    <CustomTooltip text="Remove from group">
                      <TextIconButton
                        variant="delete"
                        icon={<FiUserMinus />}
                        label="Remove"
                        onClick={() => handleRemoveMembers([member.id])}
                      />
                    </CustomTooltip>
                  ),
                };
              })}
          />
        )}
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 600 }}>
            Add Members ({availableUsers.filter((user) => {
              const searchLower = availableUserSearch.toLowerCase();
              return (
                user.first_name?.toLowerCase().includes(searchLower) ||
                user.last_name?.toLowerCase().includes(searchLower) ||
                user.employee_number?.toLowerCase().includes(searchLower) ||
                user.roles?.name?.toLowerCase().includes(searchLower)
              );
            }).length} available)
          </h4>
          <input
            type="text"
            placeholder="Search users..."
            value={availableUserSearch}
            onChange={(e) => setAvailableUserSearch(e.target.value)}
            className="neon-input"
            style={{ width: 300 }}
          />
        </div>
        {availableUsers.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: 16 }}>
            All users are already members of this group.
          </p>
        ) : (
          <>
            <NeonTable
              columns={[
                { header: "Select", accessor: "select", width: 80, align: "center" },
                { header: "Name", accessor: "name", align: "center" },
                { header: "Emp #", accessor: "emp_number", width: 120, align: "center" },
                { header: "Role", accessor: "role", width: 200, align: "center" },
              ]}
              data={availableUsers
                .filter((user) => {
                  const searchLower = availableUserSearch.toLowerCase();
                  return (
                    user.first_name?.toLowerCase().includes(searchLower) ||
                    user.last_name?.toLowerCase().includes(searchLower) ||
                    user.employee_number?.toLowerCase().includes(searchLower) ||
                    user.roles?.name?.toLowerCase().includes(searchLower)
                  );
                })
                .map((user) => ({
                  select: (
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => {
                        setSelectedUsers((prev) =>
                          prev.includes(user.id)
                            ? prev.filter((id) => id !== user.id)
                            : [...prev, user.id]
                        );
                      }}
                    />
                  ),
                  name: `${user.last_name}, ${user.first_name}`,
                  emp_number: user.employee_number || <span style={{ color: "var(--text-secondary)" }}>—</span>,
                  role: user.roles?.name || <span style={{ color: "var(--text-secondary)" }}>No role</span>,
                }))}
            />
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <CustomTooltip text="Add selected users to group">
                <TextIconButton
                  variant="add"
                  icon={<FiUserPlus />}
                  label={`Add ${selectedUsers.length} Member(s)`}
                  onClick={handleAddMembers}
                  disabled={loading || selectedUsers.length === 0}
                />
              </CustomTooltip>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderManageAssignments = () => (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ color: "var(--accent)", fontSize: "1.125rem", fontWeight: 600 }}>
          Manage Assignments: {selectedGroup?.name}
        </h3>
        <CustomTooltip text="Back to groups list">
          <TextIconButton
            variant="cancel"
            icon={<FiX />}
            label="Back"
            onClick={() => setStage("list")}
          />
        </CustomTooltip>
      </div>

      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
          <TextIconButton
            variant={assignmentStep === "modules" ? "next" : "view"}
            icon={<FiBook />}
            label="Step 1: Modules"
            onClick={() => setAssignmentStep("modules")}
          />
          <TextIconButton
            variant={assignmentStep === "documents" ? "next" : "view"}
            icon={<FiFileText />}
            label="Step 2: Documents"
            onClick={() => setAssignmentStep("documents")}
          />
        </div>

        {assignmentStep === "modules" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 600 }}>
                Select Training Modules ({availableModules.filter((module) => {
                  const searchLower = moduleSearch.toLowerCase();
                  return (
                    module.name?.toLowerCase().includes(searchLower) ||
                    module.ref_code?.toLowerCase().includes(searchLower)
                  );
                }).length} available)
              </h4>
              <input
                type="text"
                placeholder="Search modules..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
                className="neon-input"
                style={{ width: 300 }}
              />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
              Select the modules to assign to all members of this group
            </p>
            {availableModules.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: 16 }}>
                No modules available
              </p>
            ) : (
              <NeonTable
                columns={[
                  { header: "Select", accessor: "select", width: 80, align: "center" },
                  { header: "Module Name", accessor: "name", align: "center" },
                  { header: "Ref Code", accessor: "ref_code", width: 120, align: "center" },
                  { header: "Version", accessor: "version", width: 100, align: "center" },
                ]}
                data={availableModules
                  .filter((module) => {
                    const searchLower = moduleSearch.toLowerCase();
                    return (
                      module.name?.toLowerCase().includes(searchLower) ||
                      module.ref_code?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((module) => ({
                    select: (
                      <input
                        type="checkbox"
                        checked={selectedModules.includes(module.id)}
                        onChange={() => toggleModuleSelection(module.id)}
                      />
                    ),
                    name: module.name,
                    ref_code: module.ref_code || <span style={{ color: "var(--text-secondary)" }}>—</span>,
                    version: module.version,
                  }))}
              />
            )}
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ color: "var(--text-primary)", fontSize: "1rem", fontWeight: 600 }}>
                Select Documents ({availableDocuments.filter((document) => {
                  const searchLower = documentSearch.toLowerCase();
                  return (
                    document.title?.toLowerCase().includes(searchLower) ||
                    document.reference_code?.toLowerCase().includes(searchLower)
                  );
                }).length} available)
              </h4>
              <input
                type="text"
                placeholder="Search documents..."
                value={documentSearch}
                onChange={(e) => setDocumentSearch(e.target.value)}
                className="neon-input"
                style={{ width: 300 }}
              />
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: 16 }}>
              Select the documents to assign to all members of this group
            </p>
            {availableDocuments.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontStyle: "italic", padding: 16 }}>
                No documents available
              </p>
            ) : (
              <NeonTable
                columns={[
                  { header: "Select", accessor: "select", width: 80, align: "center" },
                  { header: "Document Name", accessor: "name", align: "center" },
                  { header: "Ref Code", accessor: "ref_code", width: 120, align: "center" },
                  { header: "Version", accessor: "version", width: 100, align: "center" },
                ]}
                data={availableDocuments
                  .filter((document) => {
                    const searchLower = documentSearch.toLowerCase();
                    return (
                      document.title?.toLowerCase().includes(searchLower) ||
                      document.reference_code?.toLowerCase().includes(searchLower)
                    );
                  })
                  .map((document) => ({
                    select: (
                      <input
                        type="checkbox"
                        checked={selectedDocuments.includes(document.id)}
                        onChange={() => toggleDocumentSelection(document.id)}
                      />
                    ),
                    name: document.title,
                    ref_code: document.reference_code || <span style={{ color: "var(--text-secondary)" }}>—</span>,
                    version: document.current_version || <span style={{ color: "var(--text-secondary)" }}>—</span>,
                  }))}
              />
            )}
          </div>
        )}

        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <CustomTooltip text="Save assignments and sync to all group members">
            <TextIconButton
              variant="save"
              icon={<FiSave />}
              label="Save & Sync Assignments"
              onClick={handleSaveAssignments}
              disabled={loading}
            />
          </CustomTooltip>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", alignSelf: "center" }}>
            Selected: {selectedModules.length} module(s), {selectedDocuments.length} document(s)
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      {stage === "list" && renderGroupsList()}
      {(stage === "create" || stage === "edit") && renderCreateEdit()}
      {stage === "manage-members" && renderManageMembers()}
      {stage === "manage-assignments" && renderManageAssignments()}

      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        autoCloseMs={3000}
      />
    </div>
  );
}
