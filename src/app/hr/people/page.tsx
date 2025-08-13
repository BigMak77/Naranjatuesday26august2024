/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, ComponentProps, ReactElement } from "react";
import { supabase } from "@/lib/supabase-client";
import Papa from "papaparse";
import NeonTable from "@/components/NeonTable";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FiEdit3,
  FiCheck,
  FiUpload,
  FiDownload,
  FiFileText,
  FiUserPlus,
} from "react-icons/fi";
import UserManagementPanel from '@/components/user/UserManagementPanel'

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

function TableIconButton(props: BtnProps | AProps | LinkProps) {
  const { variant, icon, title, className = "" } = props as BaseBtnProps;
  const classes = `neon-btn-square neon-btn-${variant} ${className}`.trim();
  const router = useRouter();

  if ((props as AProps).as === "a") {
    const { as: _as, ...rest } = props as AProps; // Remove unused _as
    return (
      <a {...rest} className={classes} aria-label={title} title={title}>
        {icon}
      </a>
    );
  }
  if ((props as LinkProps).as === "link") {
    const { href, ...rest } = props as LinkProps;
    // Use a button that navigates programmatically for edit links
    if (variant === "edit" && href.startsWith("/hr/people/edit/")) {
      return (
        <button
          type="button"
          className={classes}
          aria-label={title}
          title={title}
          onClick={() => router.push(href)}
          {...(rest as any)}
        >
          {icon}
        </button>
      );
    }
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
  if (error) return <div className="hr-people-error-msg">{error}</div>;
  if (!users.length) return <div>All users are assigned to a department and role.</div>;

  return (
    <div className="hr-people-unassigned-panel">
      <h2 className="hr-people-unassigned-title">Unassigned Users</h2>
      <div className="hr-people-unassigned-table-wrapper">
        <table className="hr-people-unassigned-table w-full min-w-[700px]">
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
                    className="hr-people-unassigned-select"
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
                    className="hr-people-unassigned-select"
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
                  <TableIconButton
                    as="button"
                    variant="submit"           // or "save"
                    icon={<FiCheck />}
                    title="Assign"
                    onClick={() => handleAssign(u.id, u.department_id, u.role_id)}
                    disabled={!u.department_id || !u.role_id}
                  />
                </td>
                <td>
                  <TableIconButton
                    as="link"
                    href={`/hr/people/edit/${u.id}`}
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
  return <UserManagementPanel />
}
