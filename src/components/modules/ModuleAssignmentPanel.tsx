"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

interface Role {
  id: string;
  title: string;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
}

interface AssignmentCheckbox {
  role_id: string;
  department_id: string;
}

interface Props {
  moduleId: string;
}

export default function ModuleAssignmentPanel({ moduleId }: Props) {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [assigned, setAssigned] = useState<AssignmentCheckbox[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [
        { data: d, error: dErr },
        { data: r, error: rErr },
        { data: current, error: cErr },
      ] = await Promise.all([
        supabase.from("departments").select("id, name"),
        supabase.from("roles").select("id, title, department_id"),
        supabase
          .from("module_roles")
          .select("role_id, department_id")
          .eq("module_id", moduleId),
      ]);

      if (dErr || rErr || cErr) {
        console.error("Failed to load data:", dErr, rErr, cErr);
      }

      setDepartments(d || []);
      setRoles(r || []);
      setAssigned(current || []);
      setLoading(false);
    };

    if (moduleId) load();
  }, [moduleId]);

  const isChecked = (role_id: string, department_id: string) =>
    assigned.some(
      (a) => a.role_id === role_id && a.department_id === department_id,
    );

  const toggle = (role_id: string, department_id: string) => {
    setAssigned((prev) => {
      const exists = prev.find(
        (a) => a.role_id === role_id && a.department_id === department_id,
      );
      return exists
        ? prev.filter(
            (a) =>
              !(a.role_id === role_id && a.department_id === department_id),
          )
        : [...prev, { role_id, department_id }];
    });
  };

  const handleSave = async () => {
    setSaving(true);

    const { error: deleteError } = await supabase
      .from("module_roles")
      .delete()
      .eq("module_id", moduleId);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      setSaving(false);
      return;
    }

    if (assigned.length > 0) {
      const { error: insertError } = await supabase.from("module_roles").insert(
        assigned.map((a) => ({
          module_id: moduleId,
          role_id: a.role_id,
          department_id: a.department_id,
        })),
      );

      if (insertError) {
        console.error("Insert error:", insertError);
      }
    }

    setSaving(false);
  };

  if (loading) return <p className="neon-loading">Loading assignments...</p>;

  return (
    <div className="module-assignment-panel">
      <h3 className="module-assignment-title">
        <span
          className="module-assignment-title-icon"
          aria-label="Assign Roles and Departments"
          role="img"
        >
          🎯
        </span>{" "}
        Assign Roles & Departments
      </h3>

      {departments.map((dep) => (
        <div key={dep.id} className="module-assignment-department">
          <h4 className="module-assignment-department-title">{dep.name}</h4>
          <div className="module-assignment-role-list">
            {roles
              .filter((r) => r.department_id === dep.id)
              .map((role) => (
                <label key={role.id} className="module-assignment-role-label">
                  <input
                    type="checkbox"
                    checked={isChecked(role.id, dep.id)}
                    onChange={() => toggle(role.id, dep.id)}
                  />
                  {role.title}
                </label>
              ))}
          </div>
        </div>
      ))}

      <div className="module-assignment-actions">
        <button
          onClick={handleSave}
          disabled={saving}
          className="neon-btn neon-btn-square neon-btn-save module-assignment-save-btn"
          data-variant="save"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-save neon-icon"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
          </svg>
        </button>
        <button
          type="button"
          className="neon-btn neon-btn-edit module-assignment-edit-btn"
          data-variant="edit"
          onClick={() => router.push(`/admin/modules/edit/${moduleId}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-edit neon-icon"
          >
            <path d="M11 4h2a2 2 0 0 1 2 2v2"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L7 20.5 2.5 16 18.5 2.5z"></path>
          </svg>
        </button>
        <button
          type="button"
          className="neon-btn neon-btn-view module-assignment-view-btn"
          data-variant="view"
          onClick={() => router.push(`/admin/modules/${moduleId}`)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="feather feather-eye neon-icon"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
          </svg>
        </button>
      </div>
    </div>
  );
}
