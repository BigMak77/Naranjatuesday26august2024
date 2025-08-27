"use client";

import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase-client";
import NeonTable from "@/components/NeonTable";
import NeonIconButton from "@/components/ui/NeonIconButton";
import {
  FiSave,
  FiEdit,
  FiUserPlus,
  FiDownload,
  FiUpload,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { useUser } from "@/lib/useUser";
import OverlayDialog from '@/components/ui/OverlayDialog';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  department_id?: string;
  role_id?: string;
  access_level?: string;
  phone?: string;
  created_at?: string;
  department_name?: string;
  role_title?: string;
  status?: string;
  nationality?: string;
  document_path?: string;
  role_profile_id?: string;
  is_archived?: boolean;
  last_updated_at?: string;
  is_anonymous?: boolean;
  auth_id?: string;
  start_date?: string;
  is_first_aid?: boolean;
  avatar_url?: string;
  is_trainer?: boolean;
  shift_id?: string;
  shift_name?: string;
  role_profile_name?: string;
}

// ---------------------- Main component (your logic kept) ----------------------
export default function UserManagementPanel() {
  useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [roles, setRoles] = useState<{ id: string; title: string; department_id: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(false);
  const [shiftPatterns, setShiftPatterns] = useState<{ id: string; name: string }[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);
  const [bulkAssignStep, setBulkAssignStep] = useState(0); // 0: type, 1: config, 2: users, 3: confirm
  const [bulkAssignType, setBulkAssignType] = useState(""); // "role", "shift", "first_aid", "trainer"
  const [bulkDeptId, setBulkDeptId] = useState("");
  const [bulkRoleId, setBulkRoleId] = useState("");
  const [bulkShiftId, setBulkShiftId] = useState("");
  const [bulkFirstAid, setBulkFirstAid] = useState(false);
  const [bulkTrainer, setBulkTrainer] = useState(false);
  const [bulkAssignLoading, setBulkAssignLoading] = useState(false);
  const [bulkSelectedUserIds, setBulkSelectedUserIds] = useState<string[]>([]);

  // store the element that opened the dialog (e.g. clicked name) to restore focus
  const openerRef = useRef<HTMLElement | null>(null);
  const firstNameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setLoading(true);
    const load = async () => {
      try {
        const [
          { data: u, error: userErr },
          { data: d, error: deptErr },
          { data: r, error: roleErr },
          { data: s, error: shiftErr },
          { data: rp, error: rpErr },
        ] = await Promise.all([
          supabase.from("users").select("*, shift_id, role_profile_id"),
          supabase.from("departments").select("id, name"),
          supabase.from("roles").select("id, title, department_id"),
          supabase.from("shift_patterns").select("id, name"),
          supabase.from("role_profiles").select("id, name"),
        ]);
        if (userErr || deptErr || roleErr || shiftErr || rpErr) {
          setErrorMsg("Failed to load data. Please check your connection and try again.");
          return;
        }
        const usersWithNames = (u || []).map((user) => {
          const role = r?.find((role) => role.id === user.role_id);
          return {
            ...user,
            shift_name: s?.find((sp) => sp.id === user.shift_id)?.name || "",
            shift_id: user.shift_id || "",
            role_profile_name: rp?.find((x) => x.id === user.role_profile_id)?.name || "",
            role_title: role ? role.title : "—",
          };
        });
        setUsers(usersWithNames);
        setDepartments(d || []);
        setRoles(r || []);
        setShiftPatterns(s || []);
      } catch {
        setErrorMsg("Unexpected error loading users.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenDialog = (user: User, addMode = false, opener?: HTMLElement | null) => {
    openerRef.current = opener || null;
    setSelectedUser(user);
    setIsAddMode(addMode);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setIsAddMode(false);
    setErrorMsg("");
    // focus restore handled by Modal
  };

  const handleBulkAssignStart = () => {
    setBulkAssignStep(0);
    setBulkAssignType("");
    setBulkDeptId("");
    setBulkRoleId("");
    setBulkShiftId("");
    setBulkFirstAid(false);
    setBulkTrainer(false);
    setBulkSelectedUserIds([]);
    setBulkAssignOpen(true);
  };

  const handleBulkAssignNext = () => {
    setBulkAssignStep((step) => step + 1);
  };
  const handleBulkAssignBack = () => {
    setBulkAssignStep((step) => step - 1);
  };
  const handleBulkAssignCancel = () => {
    setBulkAssignOpen(false);
  };

  const handleBulkAssignConfirm = async () => {
    if (bulkSelectedUserIds.length === 0) return;
    setBulkAssignLoading(true);
    let updateObj: any = {};
    if (bulkAssignType === "role") {
      if (!bulkDeptId || !bulkRoleId) return;
      updateObj = { department_id: bulkDeptId, role_id: bulkRoleId };
    } else if (bulkAssignType === "shift") {
      if (!bulkShiftId) return;
      updateObj = { shift_id: bulkShiftId };
    } else if (bulkAssignType === "first_aid") {
      updateObj = { is_first_aid: bulkFirstAid };
    } else if (bulkAssignType === "trainer") {
      updateObj = { is_trainer: bulkTrainer };
    }
    await supabase.from("users").update(updateObj).in("id", bulkSelectedUserIds);
    // Refresh users
    const { data: u } = await supabase.from("users").select("*, shift_id, role_profile_id");
    setUsers(u || []);
    setBulkAssignOpen(false);
    setBulkAssignLoading(false);
    setBulkSelectedUserIds([]);
  };

  const handleBulkAssignApply = async () => {
    if (bulkSelectedUserIds.length === 0) return;
    setBulkAssignLoading(true);
    let updateFields: Record<string, any> = {};
    if (bulkAssignType === "role") {
      if (!bulkDeptId || !bulkRoleId) return;
      updateFields = { department_id: bulkDeptId, role_id: bulkRoleId };
    } else if (bulkAssignType === "shift") {
      if (!bulkShiftId) return;
      updateFields = { shift_id: bulkShiftId };
    } else if (bulkAssignType === "first_aid") {
      updateFields = { is_first_aid: bulkFirstAid };
    } else if (bulkAssignType === "trainer") {
      updateFields = { is_trainer: bulkTrainer };
    }
    await supabase.from("users").update(updateFields).in("id", bulkSelectedUserIds);
    // Refresh users
    const { data: u } = await supabase.from("users").select("*, shift_id, role_profile_id");
    setUsers(u || []);
    setBulkAssignOpen(false);
    setBulkAssignLoading(false);
    setBulkAssignStep(0);
    setBulkAssignType("");
    setBulkDeptId("");
    setBulkRoleId("");
    setBulkShiftId("");
    setBulkFirstAid(false);
    setBulkTrainer(false);
    setBulkSelectedUserIds([]);
  };

  const allowedAccessLevels = ["User", "Manager", "Admin"];
  const cleanUserFields = (user: User): User => ({
    ...user,
    department_id: user.department_id || undefined,
    role_id: user.role_id || undefined,
    shift_id: user.shift_id || undefined,
    role_profile_id: user.role_profile_id || undefined,
    access_level: allowedAccessLevels.includes((user.access_level || "").trim())
      ? (user.access_level || "").trim()
      : "User",
  });

  const validateUser = (user: User) => {
    if (!user.email?.trim() || !user.first_name?.trim() || !user.last_name?.trim()) {
      setErrorMsg("Email, First Name, and Last Name are required.");
      return false;
    }
    setErrorMsg("");
    return true;
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    if (!validateUser(selectedUser)) {
      // move focus to first missing
      if (!selectedUser.first_name?.trim()) firstNameRef.current?.focus();
      return;
    }
    setSaving(true);
    const cleanedUser = cleanUserFields(selectedUser);
    try {
      if (isAddMode) {
        const { error: userErr, data: newUser } = await supabase
          .from("users")
          .insert({
            first_name: cleanedUser.first_name,
            last_name: cleanedUser.last_name,
            email: cleanedUser.email,
            department_id: cleanedUser.department_id,
            role_id: cleanedUser.role_id,
            access_level: cleanedUser.access_level,
            phone: cleanedUser.phone,
            shift_id: cleanedUser.shift_id,
            role_profile_id: cleanedUser.role_profile_id,
            nationality: cleanedUser.nationality,
            is_first_aid: cleanedUser.is_first_aid ?? false,
            is_trainer: cleanedUser.is_trainer ?? false,
            start_date: cleanedUser.start_date,
          })
          .select()
          .single();
        if (userErr) {
          setErrorMsg("Failed to add user: " + userErr.message);
          setSaving(false);
          return;
        }
        setUsers([...users, newUser as User]);
      } else {
        const { error: userErr } = await supabase
          .from("users")
          .update({
            first_name: cleanedUser.first_name,
            last_name: cleanedUser.last_name,
            email: cleanedUser.email,
            department_id: cleanedUser.department_id,
            role_id: cleanedUser.role_id,
            access_level: cleanedUser.access_level,
            phone: cleanedUser.phone,
            shift_id: cleanedUser.shift_id,
            role_profile_id: cleanedUser.role_profile_id,
            nationality: cleanedUser.nationality,
            is_first_aid: cleanedUser.is_first_aid ?? false,
            is_trainer: cleanedUser.is_trainer ?? false,
            start_date: cleanedUser.start_date,
          })
          .eq("id", cleanedUser.id);
        if (userErr) {
          setErrorMsg("Failed to update user: " + userErr.message);
          setSaving(false);
          return;
        }
        setUsers(users.map((u) => (u.id === cleanedUser.id ? { ...u, ...cleanedUser } : u)));
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        handleCloseDialog();
      }, 800);
    } catch (err: any) {
      setErrorMsg("Unexpected error saving user." + (err?.message ? ` ${err.message}` : ""));
    } finally {
      setSaving(false);
    }
  };

  // CSV Export handler (unchanged)
  const handleExportUsers = () => {
    if (!users.length) return;
    const csvRows = users.map((u) => ({
      id: u.id,
      email: u.email,
      first_name: u.first_name || "",
      last_name: u.last_name || "",
      department_id: u.department_id || "",
      role_id: u.role_id || "",
      access_level: u.access_level || "",
      phone: u.phone || "",
      nationality: u.nationality || "",
      is_first_aid: u.is_first_aid ? "true" : "false",
      is_trainer: u.is_trainer ? "true" : "false",
      start_date: u.start_date || "",
    }));
    const csv = [
      "id,email,first_name,last_name,department_id,role_id,access_level,phone,nationality,is_first_aid,is_trainer,start_date",
      ...csvRows.map((row) =>
        Object.values(row)
          .map((val) => `"${String(val).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // CSV Upload handler (unchanged)
  const handleImportUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    let usersToImport: Record<string, any>[] = [];
    try {
      const csvParse = (await import("csv-parse/sync")).parse;
      usersToImport = csvParse(text, { columns: true, skip_empty_lines: true });
      usersToImport = usersToImport.map((u) => ({
        ...u,
        is_first_aid: u.is_first_aid === "true" || u.is_first_aid === true,
        is_trainer: u.is_trainer === "true" || u.is_trainer === true,
      }));
    } catch {
      setErrorMsg("CSV parse error. Please check your file format.");
      return;
    }
    try {
      await supabase.from("users").upsert(usersToImport, { onConflict: "id" });
      const { data: u } = await supabase.from("users").select("*");
      setUsers(u || []);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 1000);
    } catch (err: any) {
      setErrorMsg("Failed to import users. " + (err.message || ""));
    }
  };

  const userTableColumns = [
    {
      header: "Select",
      accessor: "select",
      render: (_: any, row: any) => (
        <input
          type="checkbox"
          checked={selectedUserIds.includes(row.id)}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedUserIds((prev) => [...prev, row.id]);
            } else {
              setSelectedUserIds((prev) => prev.filter((id) => id !== row.id));
            }
          }}
          aria-label={`Select user ${row.name}`}
        />
      ),
    },
    { header: "Name", accessor: "name" },
    { header: "Department", accessor: "department_name" },
    { header: "Role", accessor: "role_title" },
    { header: "Access", accessor: "access_level" },
    { header: "Role Profile", accessor: "role_profile_name" },
    { header: "Shift", accessor: "shift_name" },
    { header: "Email", accessor: "email" },
    { header: "Start Date", accessor: "start_date" },
    { header: "First Aid", accessor: "is_first_aid" },
    { header: "Trainer", accessor: "is_trainer" },
  ];

  if (loading)
    return (
      <div className="neon-loading" style={{ textAlign: "center", margin: "2rem" }}>
        Loading users...
      </div>
    );
  if (errorMsg && !dialogOpen)
    return (
      <div className="neon-error" style={{ color: "#ea1c1c", textAlign: "center", margin: "2rem" }}>
        {errorMsg}
      </div>
    );

  return (
    <>
      <div className="neon-table-panel">
        <div style={{ marginBottom: '1rem' }}>
          <input
            type="checkbox"
            checked={selectedUserIds.length === users.length && users.length > 0}
            onChange={(e) => {
              if (e.target.checked) {
                setSelectedUserIds(users.map((u) => u.id));
              } else {
                setSelectedUserIds([]);
              }
            }}
            aria-label="Select all users"
          /> Select All
        </div>
        <div className="neon-table-scroll">
          <NeonTable
            columns={userTableColumns}
            data={users.map((user) => {
              const department = departments.find((d) => d.id === user.department_id);
              const role = roles.find((r) => r.id === user.role_id);
              return {
                id: user.id,
                name: (
                  <span
                    className="neon-link neon-user-name-selectable"
                    tabIndex={0}
                    role="button"
                    style={{ cursor: "pointer", color: "var(--neon)" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDialog(user, false, e.currentTarget as HTMLElement);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        handleOpenDialog(user, false, e.currentTarget as HTMLElement);
                      }
                    }}
                    aria-label={`Edit user: ${user.first_name || ""} ${user.last_name || ""}`}
                  >
                    {`${user.first_name || ""} ${user.last_name || ""}`.trim() || "—"}
                  </span>
                ),
                department_name: department ? department.name : "—",
                role_title: role ? role.title : "—",
                status: user.status || "—",
                access_level: user.access_level,
                role_profile_name: user.role_profile_name || "—",
                shift_name: user.shift_name || "—",
                email: user.email,
                start_date: user.start_date || "—",
                is_first_aid: user.is_first_aid ? <FiCheck color="#39ff14" /> : <FiX color="#ea1c1c" />,
                is_trainer: user.is_trainer ? <FiCheck color="#39ff14" /> : <FiX color="#ea1c1c" />,
                actions: (
                  <NeonIconButton
                    icon={<FiEdit />}
                    title="Edit User"
                    variant="edit"
                    onClick={(e: any) => {
                      handleOpenDialog(user, false, (e?.currentTarget as HTMLElement) ?? null);
                    }}
                  />
                ),
              };
            })}
            toolbar={
              <>
                <NeonIconButton
                  icon={<FiUserPlus />}
                  title="Add User"
                  variant="add"
                  onClick={(e: any) => {
                    handleOpenDialog(
                      {
                        id: "",
                        email: "",
                        first_name: "",
                        last_name: "",
                        department_id: "",
                        role_id: "",
                        access_level: "User",
                        phone: "",
                        nationality: "",
                        is_first_aid: false,
                        is_trainer: false,
                        start_date: "",
                      },
                      true,
                      (e?.currentTarget as HTMLElement) ?? null,
                    );
                  }}
                />
                <NeonIconButton
                  icon={<FiDownload />}
                  title="Download Users CSV"
                  variant="download"
                  onClick={handleExportUsers}
                />
                <label style={{ display: "inline-block" }}>
                  <NeonIconButton
                    icon={<FiUpload />}
                    title="Upload Users CSV"
                    variant="upload"
                    as="button"
                    onClick={() => fileInputRef.current?.click()}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleImportUsers}
                  />
                </label>
                <NeonIconButton
                  icon={<FiEdit />}
                  title="Bulk Assign"
                  variant="edit"
                  onClick={() => {
                    setBulkAssignOpen(true);
                    setBulkAssignStep(1); // Start at user selection step
                    setBulkAssignType("");
                    setBulkDeptId("");
                    setBulkRoleId("");
                    setBulkShiftId("");
                    setBulkFirstAid(false);
                    setBulkTrainer(false);
                    setBulkSelectedUserIds(selectedUserIds); // Use currently selected users
                  }}
                />
              </>
            }
          />
        </div>
      </div>

      {/* Overlaid dialog rendered via portal */}
      <OverlayDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        ariaLabelledby="user-editor-title"
      >
        <div className="neon-form-title" id="user-editor-title" style={{ marginBottom: "1.25rem" }}>
          {isAddMode ? "Add User" : "Edit User"}
        </div>

        {errorMsg && (
          <div id="user-editor-error" className="neon-error" style={{ color: "#ea1c1c", marginBottom: "1rem" }}>
            {errorMsg}
          </div>
        )}

        {selectedUser && (
          <div
            className="neon-form-grid neon-form-padding"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              gap: "1.5rem",
              rowGap: "2rem",
              alignItems: "start",
            }}
          >
            {/* first_name */}
            <div>
              <label className="neon-label" htmlFor="first-name-input">
                First Name
              </label>
              <input
                id="first-name-input"
                ref={firstNameRef}
                className="neon-input"
                value={selectedUser.first_name || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    first_name: e.target.value,
                  })
                }
                placeholder="First Name"
              />
            </div>
            {/* last_name */}
            <div>
              <label className="neon-label" htmlFor="last-name-input">
                Last Name
              </label>
              <input
                id="last-name-input"
                className="neon-input"
                value={selectedUser.last_name || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    last_name: e.target.value,
                  })
                }
                placeholder="Last Name"
              />
            </div>
            {/* email */}
            <div>
              <label className="neon-label" htmlFor="email-input">
                Email
              </label>
              <input
                id="email-input"
                className="neon-input"
                value={selectedUser.email || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    email: e.target.value,
                  })
                }
                placeholder="Email"
                inputMode="email"
                autoComplete="email"
              />
            </div>
            {/* department_id */}
            <div>
              <label className="neon-label" htmlFor="dept-select">
                Department
              </label>
              <select
                id="dept-select"
                className="neon-input"
                value={selectedUser.department_id || ""}
                onChange={(e) => {
                  setSelectedUser({
                    ...selectedUser,
                    department_id: e.target.value,
                    role_id: "", // Reset role when department changes
                  });
                }}
              >
                <option value="">Select Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            {/* role_id */}
            <div>
              <label className="neon-label" htmlFor="role-select">
                Role
              </label>
              <select
                id="role-select"
                className="neon-input"
                value={selectedUser.role_id || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    role_id: e.target.value,
                  })
                }
                disabled={!selectedUser.department_id}
              >
                <option value="">Select Role</option>
                {roles
                  .filter((r) => r.department_id === selectedUser.department_id)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
              </select>
            </div>
            {/* access_level */}
            <div>
              <label className="neon-label" htmlFor="access-select">
                Access Level
              </label>
              <select
                id="access-select"
                className="neon-input"
                value={selectedUser.access_level || "User"}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    access_level: e.target.value,
                  })
                }
              >
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            {/* phone */}
            <div>
              <label className="neon-label" htmlFor="phone-input">
                Phone
              </label>
              <input
                id="phone-input"
                className="neon-input"
                value={selectedUser.phone || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    phone: e.target.value,
                  })
                }
                placeholder="Phone"
                inputMode="tel"
                autoComplete="tel"
              />
            </div>
            {/* nationality */}
            <div>
              <label className="neon-label" htmlFor="nationality-input">
                Nationality
              </label>
              <input
                id="nationality-input"
                className="neon-input"
                value={selectedUser.nationality || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    nationality: e.target.value,
                  })
                }
                placeholder="Nationality"
              />
            </div>
            {/* is_first_aid */}
            <div>
              <label className="neon-label" htmlFor="firstaid-select">
                First Aid
              </label>
              <select
                id="firstaid-select"
                className="neon-input"
                value={selectedUser.is_first_aid ? "true" : "false"}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    is_first_aid: e.target.value === "true",
                  })
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            {/* is_trainer */}
            <div>
              <label className="neon-label" htmlFor="trainer-select">
                Trainer
              </label>
              <select
                id="trainer-select"
                className="neon-input"
                value={selectedUser.is_trainer ? "true" : "false"}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    is_trainer: e.target.value === "true",
                  })
                }
              >
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </div>
            {/* shift_id */}
            <div>
              <label className="neon-label" htmlFor="shift-select">
                Shift
              </label>
              <select
                id="shift-select"
                className="neon-input"
                value={selectedUser.shift_id || ""}
                onChange={(e) => {
                  const selectedPattern = shiftPatterns?.find((s) => s.id === e.target.value);
                  setSelectedUser({
                    ...selectedUser,
                    shift_id: e.target.value,
                    shift_name: selectedPattern ? selectedPattern.name : "",
                  });
                }}
              >
                <option value="">Select Shift</option>
                {shiftPatterns?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            {/* start_date */}
            <div>
              <label className="neon-label" htmlFor="startdate-input">
                Start Date
              </label>
              <input
                id="startdate-input"
                className="neon-input"
                type="date"
                value={selectedUser.start_date || ""}
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    start_date: e.target.value,
                  })
                }
                placeholder="Start Date"
              />
            </div>

            {showSuccess && (
              <div className="md:col-span-3 lg:col-span-3" style={{ gridColumn: "span 3", marginTop: "0.5rem" }}>
                <p className="neon-success">✅ User saved successfully!</p>
              </div>
            )}
          </div>
        )}

        <div
          className="neon-panel-actions"
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "flex-end",
            marginTop: "2rem",
          }}
        >
          <NeonIconButton
            variant="save"
            icon={saving ? <span className="neon-spinner" style={{ marginRight: 8 }} /> : <FiSave />}
            title={saving ? "Saving..." : "Save Changes"}
            onClick={handleSave}
            disabled={saving}
          />
          <button className="neon-btn neon-btn-danger" onClick={handleCloseDialog}>
            Close
          </button>
        </div>
      </OverlayDialog>

      {/* Staged Bulk Assign Overlay */}
      {bulkAssignOpen && (
        <OverlayDialog open={bulkAssignOpen} onClose={handleBulkAssignCancel} ariaLabelledby="bulk-assign-title">
          <div className="neon-form-title" id="bulk-assign-title" style={{ marginBottom: "1.25rem" }}>
            Bulk Assign
          </div>
          {/* Step 1: Select users */}
          {bulkAssignStep === 1 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="neon-label" style={{ marginBottom: "1rem" }}>
                Select users to assign:
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #222", borderRadius: 8, padding: 8 }}>
                {users.map((u) => (
                  <div key={u.id} style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: 4 }}>
                    <input
                      type="checkbox"
                      checked={bulkSelectedUserIds.includes(u.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setBulkSelectedUserIds((prev) => [...prev, u.id]);
                        } else {
                          setBulkSelectedUserIds((prev) => prev.filter((id) => id !== u.id));
                        }
                      }}
                      aria-label={`Select user ${u.first_name || ""} ${u.last_name || ""}`}
                    />
                    <span>{`${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</span>
                    <span style={{ color: "#888", fontSize: 12 }}>{u.email}</span>
                  </div>
                ))}
              </div>
              <div className="neon-panel-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button className="neon-btn" onClick={handleBulkAssignCancel}>Cancel</button>
                <button className="neon-btn neon-btn-primary" onClick={() => setBulkAssignStep(2)} disabled={bulkSelectedUserIds.length === 0}>Next</button>
              </div>
            </div>
          )}
          {/* Step 2: Configure assignment */}
          {bulkAssignStep === 2 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="neon-label" style={{ marginBottom: "1rem" }}>What would you like to bulk assign?</div>
              <div style={{ display: "flex", gap: "1rem" }}>
                <button className="neon-btn" onClick={() => { setBulkAssignType("role"); setBulkAssignStep(3); }}>Department/Role</button>
                <button className="neon-btn" onClick={() => { setBulkAssignType("shift"); setBulkAssignStep(3); }}>Shift</button>
                <button className="neon-btn" onClick={() => { setBulkAssignType("first_aid"); setBulkAssignStep(3); }}>First Aid</button>
                <button className="neon-btn" onClick={() => { setBulkAssignType("trainer"); setBulkAssignStep(3); }}>Trainer</button>
              </div>
              <div className="neon-panel-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button className="neon-btn" onClick={() => setBulkAssignStep(1)}>Back</button>
              </div>
            </div>
          )}
          {/* Step 3: Assignment config */}
          {bulkAssignStep === 3 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="neon-label" style={{ marginBottom: "1rem" }}>
                {bulkAssignType === "role" && "You are bulk assigning to Department/Role."}
                {bulkAssignType === "shift" && "You are bulk assigning to Shift."}
                {bulkAssignType === "first_aid" && "You are bulk assigning First Aid status."}
                {bulkAssignType === "trainer" && "You are bulk assigning Trainer status."}
              </div>
              {bulkAssignType === "role" && (
                <div className="neon-form-grid neon-form-padding" style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1.5rem" }}>
                  <div>
                    <label className="neon-label" htmlFor="bulk-dept-select">Department</label>
                    <select
                      id="bulk-dept-select"
                      className="neon-input"
                      value={bulkDeptId}
                      onChange={e => { setBulkDeptId(e.target.value); setBulkRoleId(""); }}
                    >
                      <option value="">Select Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="neon-label" htmlFor="bulk-role-select">Role</label>
                    <select
                      id="bulk-role-select"
                      className="neon-input"
                      value={bulkRoleId}
                      onChange={e => setBulkRoleId(e.target.value)}
                      disabled={!bulkDeptId}
                    >
                      <option value="">Select Role</option>
                      {roles.filter(r => r.department_id === bulkDeptId).map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {bulkAssignType === "shift" && (
                <div>
                  <label className="neon-label" htmlFor="bulk-shift-select">Shift</label>
                  <select
                    id="bulk-shift-select"
                    className="neon-input"
                    value={bulkShiftId}
                    onChange={e => setBulkShiftId(e.target.value)}
                  >
                    <option value="">Select Shift</option>
                    {shiftPatterns.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {bulkAssignType === "first_aid" && (
                <div>
                  <label className="neon-label" htmlFor="bulk-firstaid-select">First Aid</label>
                  <select
                    id="bulk-firstaid-select"
                    className="neon-input"
                    value={bulkFirstAid ? "true" : "false"}
                    onChange={e => setBulkFirstAid(e.target.value === "true")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              )}
              {bulkAssignType === "trainer" && (
                <div>
                  <label className="neon-label" htmlFor="bulk-trainer-select">Trainer</label>
                  <select
                    id="bulk-trainer-select"
                    className="neon-input"
                    value={bulkTrainer ? "true" : "false"}
                    onChange={e => setBulkTrainer(e.target.value === "true")}
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
              )}
              <div className="neon-panel-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button className="neon-btn" onClick={() => setBulkAssignStep(2)}>Back</button>
                <button className="neon-btn neon-btn-primary" onClick={() => setBulkAssignStep(4)} disabled={
                  (bulkAssignType === "role" && (!bulkDeptId || !bulkRoleId)) ||
                  (bulkAssignType === "shift" && !bulkShiftId)
                }>Next</button>
              </div>
            </div>
          )}
          {/* Step 4: Confirm bulk assignment */}
          {bulkAssignStep === 4 && (
            <div style={{ marginBottom: "2rem" }}>
              <div className="neon-label" style={{ marginBottom: "1rem" }}>
                Confirm bulk assignment:
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Assignment:</strong> {bulkAssignType === "role" && `Department: ${departments.find(d => d.id === bulkDeptId)?.name || ""}, Role: ${roles.find(r => r.id === bulkRoleId)?.title || ""}`}
                {bulkAssignType === "shift" && `Shift: ${shiftPatterns.find(s => s.id === bulkShiftId)?.name || ""}`}
                {bulkAssignType === "first_aid" && `First Aid: ${bulkFirstAid ? "Yes" : "No"}`}
                {bulkAssignType === "trainer" && `Trainer: ${bulkTrainer ? "Yes" : "No"}`}
              </div>
              <div style={{ marginBottom: "1rem" }}>
                <strong>Users:</strong> {bulkSelectedUserIds.length}
              </div>
              <div className="neon-panel-actions" style={{ display: "flex", gap: "1rem", justifyContent: "flex-end", marginTop: "2rem" }}>
                <button className="neon-btn" onClick={() => setBulkAssignStep(3)}>Back</button>
                <NeonIconButton
                  variant="save"
                  icon={bulkAssignLoading ? <span className="neon-spinner" style={{ marginRight: 8 }} /> : <FiSave />}
                  title={bulkAssignLoading ? "Assigning..." : "Confirm & Assign"}
                  onClick={handleBulkAssignConfirm}
                  disabled={bulkAssignLoading}
                />
                <button className="neon-btn neon-btn-danger" onClick={handleBulkAssignCancel}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </OverlayDialog>
      )}
    </>
  );
}
