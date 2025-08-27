"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { FiPlus } from "react-icons/fi";
import NeonIconButton from "@/components/ui/NeonIconButton";

interface Department {
  id: string;
  name: string;
}

export default function AddRolePage() {
  const [title, setTitle] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const loadDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name");
      if (data) setDepartments(data);
      if (error) console.error("Failed to load departments:", error.message);
    };

    loadDepartments();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.from("roles").insert([
      {
        title,
        department_id: departmentId,
      },
    ]);

    if (error) {
      setError(error.message);
    } else {
      router.push("/admin/org-chart");
    }

    setLoading(false);
  };

  return (
    <div className="after-hero">
      <div className="global-content">
        <form onSubmit={handleSubmit} className="add-role-form">
          <h1 className="add-role-title">Add Role</h1>

          <label className="add-role-label">
            <span className="add-role-label-text">Role Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="add-role-input"
              required
            />
          </label>

          <label className="add-role-label">
            <span className="add-role-label-text">Assign to Department</span>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="add-role-input"
              required
            >
              <option value="" disabled>
                Select a department
              </option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </label>

          {error && <p className="add-role-error">{error}</p>}

          <NeonIconButton
            variant="add"
            icon={<FiPlus />}
            title="Add Role"
          />
        </form>
      </div>
    </div>
  );
}
