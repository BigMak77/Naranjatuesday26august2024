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

// ---------- Small, dependency-free Modal with portal + focus trap ----------
function Modal({
  open,
  title,
  onClose,
  children,
  labelledById,
  describedById,
  initialFocusRef,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  labelledById: string;
  describedById?: string;
  initialFocusRef?: React.RefObject<HTMLElement>;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const lastActiveRef = useRef<HTMLElement | null>(null);

  // Lock background scroll
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // Save/restore last focused element
  useEffect(() => {
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null;
    } else {
      lastActiveRef.current?.focus?.();
    }
  }, [open]);

  // Move focus into modal
  useEffect(() => {
    if (!open) return;
    const focusTarget =
      initialFocusRef?.current ||
      (contentRef.current?.querySelector(
        "input,select,textarea,button,[tabindex]:not([tabindex='-1'])",
      ) as HTMLElement | null);
    focusTarget?.focus?.();
  }, [open, initialFocusRef]);

  // Focus trap + esc + backdrop click
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const root = contentRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])",
          ),
        ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (current === first || !root.contains(current)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (current === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      const panel = contentRef.current;
      if (!panel) return;
      if (!panel.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // use mousedown on the overlay element only
    const overlay = document.getElementById("app-dialog-overlay");
    overlay?.addEventListener("mousedown", onMouseDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      overlay?.removeEventListener("mousedown", onMouseDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const dialog = (
    <div
      id="app-dialog-overlay"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledById}
      aria-describedby={describedById}
      className="fixed inset-0 z-[999] flex items-center justify-center"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* Panel */}
      <div
        ref={contentRef}
        className="relative w-full max-w-4xl mx-4 rounded-2xl bg-white shadow-2xl border border-black/5 p-6"
        role="document"
      >
        {children}
      </div>
    </div>
  );

  // SSR guard for createPortal
  if (typeof window === "undefined") return dialog;
  return createPortal(dialog, document.body);
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
        const usersWithNames = (u || []).map((user) => ({
          ...user,
          shift_name: s?.find((sp) => sp.id === user.shift_id)?.name || "",
          shift_id: user.shift_id || "",
          role_profile_name: rp?.find((x) => x.id === user.role_profile_id)?.name || "",
        }));
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
              </>
            }
          />
        </div>
      </div>

      {/* Overlaid dialog rendered via portal */}
      <Modal
        open={dialogOpen}
        onClose={handleCloseDialog}
        title={isAddMode ? "Add User" : "Edit User"}
        labelledById="user-editor-title"
        describedById={errorMsg ? "user-editor-error" : undefined}
        initialFocusRef={firstNameRef as React.RefObject<HTMLElement>}
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
                onChange={(e) =>
                  setSelectedUser({
                    ...selectedUser,
                    department_id: e.target.value,
                    role_id: "",
                  })
                }
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
      </Modal>
    </>
  );
}
