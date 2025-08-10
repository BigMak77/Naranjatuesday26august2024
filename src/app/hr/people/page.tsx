/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, ComponentProps, ReactElement } from "react";
import { supabase } from "@/lib/supabase-client";
import Papa from "papaparse";
import NeonTable from "@/components/NeonTable";
import Link from "next/link";
import {
  FiEdit3,
  FiCheck,
  FiUpload,
  FiDownload,
  FiFileText,
} from "react-icons/fi";

/* ---------- Small helper: consistent square neon buttons ---------- */
type Variant =
  | "add" | "view" | "delete" | "next" | "back" | "archive"
  | "submit" | "save" | "cancel" | "edit" | "download"
  | "upload" | "search" | "refresh";

type BaseBtnProps = {
  variant: Variant;
  icon: ReactElement;   // e.g. <FiEdit3 />
  title: string;        // tooltip / aria-label
  className?: string;
};

type BtnProps   = BaseBtnProps & { as?: "button" } & ComponentProps<"button">;
type AProps     = BaseBtnProps & { as: "a" } & ComponentProps<"a">;
type LinkProps  = BaseBtnProps & { as: "link"; href: string };

function NeonIconButton(props: BtnProps | AProps | LinkProps) {
  const { variant, icon, title, className = "" } = props as BaseBtnProps;
  const classes = `neon-btn-square neon-btn-${variant} ${className}`.trim();

  if ((props as AProps).as === "a") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { as: _as, ...rest } = props as AProps; // Remove unused _as
    return (
      <a {...rest} className={classes} aria-label={title} title={title}>
        {icon}
      </a>
    );
  }
  if ((props as LinkProps).as === "link") {
    const { href, ...rest } = props as LinkProps;
    return (
      <Link href={href} className={classes} aria-label={title} title={title} {...(rest as any)}>
        {icon}
      </Link>
    );
  }
  const { as: _as, ...rest } = props as BtnProps;
  return (
    <button {...rest} className={classes} aria-label={title} title={title}>
      {icon}
    </button>
  );
}

/* ---------- Unassigned Users Widget ---------- */
function UnassignedUsersWidget({ departments, roles, onAssign }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: usersData, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, department_id, role_id")
        .or("department_id.is.null,role_id.is.null");
      if (error) setError("Failed to load users.");
      setUsers(usersData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleAssign = async (userId: string, departmentId: string, roleId: string) => {
    const { error } = await supabase
      .from("users")
      .update({ department_id: departmentId, role_id: roleId })
      .eq("id", userId);
    if (!error) {
      setUsers((users) =>
        users.map((u) =>
          u.id === userId ? { ...u, department_id: departmentId, role_id: roleId } : u
        )
      );
      onAssign(userId, departmentId, roleId);
    }
  };

  if (loading) return <div>Loading unassigned users...</div>;
  if (error) return <div className="neon-error">{error}</div>;
  if (!users.length) return <div>All users are assigned to a department and role.</div>;

  return (
    <div className="neon-panel mt-10">
      <h2 className="neon-form-title mb-4">Unassigned Users</h2>
      <div className="overflow-x-auto">
        <table className="neon-table w-full min-w-[700px]">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Assign</th>
              <th>Edit</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.first_name} {u.last_name}</td>
                <td>{u.email}</td>
                <td>
                  <select
                    value={u.department_id || ""}
                    onChange={(e) => handleAssign(u.id, e.target.value, u.role_id)}
                    className="neon-input w-full"
                  >
                    <option value="">Select department</option>
                    {departments.map((d: any) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <select
                    value={u.role_id || ""}
                    onChange={(e) => handleAssign(u.id, u.department_id, e.target.value)}
                    className="neon-input w-full"
                  >
                    <option value="">Select role</option>
                    {roles.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <NeonIconButton
                    as="button"
                    variant="submit"           // or "save"
                    icon={<FiCheck />}
                    title="Assign"
                    onClick={() => handleAssign(u.id, u.department_id, u.role_id)}
                    disabled={!u.department_id || !u.role_id}
                  />
                </td>
                <td>
                  <NeonIconButton
                    as="link"
                    href={`/hr/people/edituser?id=${u.id}`}
                    variant="edit"
                    icon={<FiEdit3 />}
                    title="Edit"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function PeopleManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportColumns, setExportColumns] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [{ data: usersData }, { data: deptData }, { data: roleData }] = await Promise.all([
        supabase
          .from("users")
          .select(
            `
          id,
          first_name,
          last_name,
          email,
          department_id,
          role_id,
          nationality,
          access_level,
          shift,
          phone,
          start_date,
          department:departments(name),
          role:roles(title)
        `
          ),
        supabase.from("departments").select("id, name"),
        supabase.from("roles").select("id, title"),
      ]);
      setUsers(usersData || []);
      setDepartments(deptData || []);
      setRoles(roleData || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  // CSV upload handler
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: Papa.ParseResult<any>) => {
        const allowedFields = [
          "auth_id",
          "first_name",
          "last_name",
          "department_id",
          "email",
          "nationality",
          "access_level",
          "shift",
          "phone",
          "department_name",
          "role_title",
          "start_date",
        ];
        const rows = (results.data as any[]).map((row) => {
          const filtered: any = {};
          allowedFields.forEach((f) => {
            if (row[f] !== undefined) filtered[f] = row[f];
          });
          return filtered;
        });
        const { error } = await supabase.from("users").upsert(rows, { onConflict: "auth_id" });
        if (error) setError("Failed to upload users.");
        else {
          setError(null);
          setUsers((prev) => [...prev, ...rows]);
        }
      },
      error: () => setError("Failed to parse CSV."),
    });
  };

  // CSV export modal behavior
  const allowedFields = [
    "auth_id",
    "first_name",
    "last_name",
    "department_id",
    "email",
    "nationality",
    "access_level",
    "shift",
    "phone",
    "department_name",
    "role_title",
    "start_date",
  ];
  const allColumns = allowedFields;

  const handleCSVExport = () => {
    setExportColumns(allColumns);
    setShowExportModal(true);
  };

  const handleExportConfirm = () => {
    if (!users.length || exportColumns.length === 0) return;
    const filtered = users.map((u) => {
      const obj: any = {};
      exportColumns.forEach((col) => {
        obj[col] = u[col];
      });
      return obj;
    });
    const csv = Papa.unparse(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "users_export.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  // Filter + sort
  const filteredUsers = users
    .filter((u) => {
      const searchStr = `${u.first_name} ${u.last_name} ${u.department?.name || ""} ${
        u.role?.title || ""
      }`.toLowerCase();
      return searchStr.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortCol) return 0;
      let aVal = a[sortCol];
      let bVal = b[sortCol];
      if (sortCol === "department") {
        aVal = a.department?.name || "";
        bVal = b.department?.name || "";
      }
      if (sortCol === "role") {
        aVal = a.role?.title || "";
        bVal = b.role?.title || "";
      }
      if (sortCol === "start_date") {
        aVal = a.start_date || "";
        bVal = b.start_date || "";
      }
      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  return (
    <main className="min-h-screen bg-background text-text">
      <div className="max-w-5xl mx-auto p-8">
        {/* Toolbar */}
        <div className="flex flex-wrap gap-4 mb-6 items-center">
          <NeonIconButton
            as="button"
            variant="download"
            icon={<FiFileText />}
            title="Export CSV"
            onClick={handleCSVExport}
          />

          <NeonIconButton
            as="button"
            variant="download"
            icon={<FiDownload />}
            title="Download CSV Template"
            onClick={() => {
              const template = [
                {
                  auth_id: "",
                  first_name: "",
                  last_name: "",
                  department_id: "",
                  email: "",
                  nationality: "",
                  access_level: "",
                  shift: "",
                  phone: "",
                  department_name: "",
                  role_title: "",
                  start_date: "",
                },
              ];
              const csv = Papa.unparse(template);
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "user_template.csv";
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          />

          {/* File input styled as neon square button */}
          <label
            className="neon-btn-square neon-btn-upload cursor-pointer"
            title="Upload CSV"
            aria-label="Upload CSV"
          >
            <FiUpload />
            <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
          </label>
        </div>

        {/* Search */}
        <div className="neon-search-bar-wrapper mb-6">
          <input
            type="search"
            placeholder="Search by name, department, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="neon-input neon-input-search"
          />
        </div>

        {/* Table */}
        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-neon">{error}</p>
        ) : (
          <NeonTable
            columns={[
              { header: "Name", accessor: "name" },
              { header: "Department", accessor: "department" },
              { header: "Role", accessor: "role" },
              { header: "Start Date", accessor: "start_date" },
              { header: "Actions", accessor: "actions" },
            ]}
            data={filteredUsers.map((u) => ({
              name: `${u.first_name} ${u.last_name}`,
              department: u.department?.name || u.department_id || "",
              role: u.role?.title || u.role_id || "",
              start_date: u.start_date
                ? (() => {
                    const d = new Date(u.start_date);
                    return !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB") : "";
                  })()
                : "",
              actions: (
                <NeonIconButton
                  as="link"
                  href={`/hr/people/edituser?id=${u.id}`}
                  variant="edit"
                  icon={<FiEdit3 />}
                  title="Edit"
                />
              ),
            }))}
          />
        )}
      </div>

      <UnassignedUsersWidget
        departments={departments}
        roles={roles}
        onAssign={(userId: string, departmentId: string, roleId: string) => {
          setUsers((users) =>
            users.map((u) =>
              u.id === userId ? { ...u, department_id: departmentId, role_id: roleId } : u
            )
          );
        }}
      />

      {/* Export modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-background bg-opacity-80 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded shadow-glow max-w-md w-full text-neon">
            <h2 className="text-xl font-bold mb-4">Select Columns to Export</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExportConfirm();
              }}
            >
              <div className="grid grid-cols-2 gap-2 mb-4">
                {allColumns.map((col) => (
                  <label key={`export-col-${col}`} className="flex items-center gap-2 text-text">
                    <input
                      type="checkbox"
                      checked={exportColumns.includes(col)}
                      onChange={(e) => {
                        setExportColumns((prev) =>
                          e.target.checked ? [...prev, col] : prev.filter((c) => c !== col)
                        );
                      }}
                    />
                    {col}
                  </label>
                ))}
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-background text-neon"
                  onClick={() => setShowExportModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 rounded bg-neon text-background shadow-glow">
                  Export
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
