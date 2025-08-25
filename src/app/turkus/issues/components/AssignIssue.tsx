"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  department_id: string;
}

interface Department {
  id: string;
  name: string;
}

export default function AssignIssue({ issueId }: { issueId: string }) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch all departments
    supabase
      .from("departments")
      .select("id, name")
      .then(({ data }) => setDepartments(data || []));
    // Fetch users in the current department only
    supabase.auth.getUser().then(({ data }) => {
      const departmentId = data?.user?.user_metadata?.department_id;
      if (departmentId) {
        supabase
          .from("users")
          .select("id, first_name, last_name, department_id")
          .eq("department_id", departmentId)
          .then(({ data }) => setUsers(data || []));
      } else {
        setUsers([]);
      }
    });
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await supabase
      .from("issues")
      .update({
        assigned_auth_id: selectedUser || null,
        department_id: selectedDepartment || null,
        reassigned_at: new Date().toISOString(),
        reassigned_to_department: selectedDepartment || null,
      })
      .eq("id", issueId);
    setLoading(false);
    alert("Issue assignment updated!");
    window.location.href = "/turkus/issues/my";
  };

  return (
    <div className="centered-content">
      <NeonForm title="Assign Issue" onSubmit={handleAssign}>
        <select
          className="neon-input"
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
        >
          <option value="">Select User</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.first_name} {u.last_name}
            </option>
          ))}
        </select>
        <select
          className="neon-input"
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="neon-btn w-full mt-4"
          disabled={loading}
        >
          {loading ? "Assigning..." : "Assign Issue"}
        </button>
      </NeonForm>
    </div>
  );
}
