"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import NeonForm from "@/components/NeonForm";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from "@/components/ui/dialog";
import NeonIconButton from "@/components/ui/NeonIconButton";
import { FiCheckSquare, FiX } from "react-icons/fi";

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

export default function AssignIssue({ 
  issueId, 
  onClose 
}: { 
  issueId: string;
  onClose?: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<{user?: User, department?: Department}>({});
  const [userSearch, setUserSearch] = useState("");
  const [deptSearch, setDeptSearch] = useState("");

  useEffect(() => {
    // Fetch all departments
    supabase
      .from("departments")
      .select("id, name")
      .then(({ data }) => setDepartments(data || []));
    // Fetch all users
    supabase
      .from("users")
      .select("id, first_name, last_name, department_id")
      .then(({ data }) => setUsers(data || []));
    // Fetch current assignment
    supabase
      .from("issues")
      .select("assigned_auth_id, department_id")
      .eq("id", issueId)
      .single()
      .then(async ({ data }) => {
        if (data) {
          let user: User | undefined = undefined;
          let department: Department | undefined = undefined;
          if (data.assigned_auth_id) {
            const { data: userData } = await supabase
              .from("users")
              .select("id, first_name, last_name, department_id")
              .eq("id", data.assigned_auth_id)
              .single();
            user = userData || undefined;
          }
          if (data.department_id) {
            const { data: deptData } = await supabase
              .from("departments")
              .select("id, name")
              .eq("id", data.department_id)
              .single();
            department = deptData || undefined;
          }
          setCurrentAssignment({ user, department });
        }
      });
  }, [issueId]);

  const filteredUsers = users.filter(
    (u) =>
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredDepartments = departments.filter(
    (d) => d.name.toLowerCase().includes(deptSearch.toLowerCase())
  );

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser && !selectedDepartment) return;
    setLoading(true);
    const updatePayload: any = {
      reassigned_at: new Date().toISOString(),
    };
    if (selectedUser) updatePayload.assigned_auth_id = selectedUser;
    if (selectedDepartment) updatePayload.department_id = selectedDepartment;
    await supabase
      .from("issues")
      .update(updatePayload)
      .eq("id", issueId);
    setLoading(false);
    setSuccess(true);
    
    // Auto-close after successful assignment if onClose is provided
    if (onClose) {
      setTimeout(() => {
        onClose();
      }, 1500);
    }
  };

  return (
    <Dialog open>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <DialogTitle>Assign Issue</DialogTitle>
            {onClose && (
              <NeonIconButton
                icon={<FiX />}
                variant="close"
                title="Close"
                onClick={onClose}
                style={{ padding: 8 }}
              />
            )}
          </div>
          <div className="centered-content">
            <form onSubmit={handleAssign}>
              <div className="mb-2">
                <strong>Current Assignment:</strong>
                <div>
                  User: {currentAssignment.user ? `${currentAssignment.user.first_name} ${currentAssignment.user.last_name}` : "None"}
                </div>
                <div>
                  Department: {currentAssignment.department ? currentAssignment.department.name : "None"}
                </div>
              </div>
              <input
                className="neon-input mb-2"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              <select
                className="neon-input"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
              >
                <option value="">Select User</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name} {u.last_name}
                  </option>
                ))}
              </select>
              <input
                className="neon-input mb-2 mt-2"
                placeholder="Search departments..."
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
              />
              <select
                className="neon-input"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                <option value="">Select Department</option>
                {filteredDepartments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
              <NeonIconButton
                icon={<FiCheckSquare />}
                style={{ backgroundColor: '#d9ed92', color: '#333' }}
                className="w-full mt-4"
                type="submit"
                disabled={loading || (!selectedUser && !selectedDepartment)}
                variant="assign"
                title={loading ? "Assigning..." : "Assign Issue"}
              >
                {loading ? "Assigning..." : "Assign Issue"}
              </NeonIconButton>
              {success && (
                <div className="neon-success mt-4">Assignment updated successfully!</div>
              )}
            </form>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}
