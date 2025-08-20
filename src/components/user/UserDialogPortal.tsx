"use client"
import { createPortal } from "react-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import NeonIconButton from "@/components/ui/NeonIconButton";
import BehaviourSelector from "@/components/BehaviourSelector";
import { FiSave } from "react-icons/fi";

type Department = { id: string; name: string };
type Role = { id: string; title: string; department_id: string };
type User = {
  first_name?: string;
  last_name?: string;
  email?: string;
  department_id?: string;
  role_id?: string;
  access_level?: string;
  phone?: string;
};

interface UserDialogPortalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isAddMode: boolean;
  selectedUser: User | null;
  departments: Department[];
  roles: Role[];
  behaviours: string[];
  setSelectedUser: (user: User) => void;
  setBehaviours: (behaviours: string[]) => void;
  showSuccess: boolean;
  saving: boolean;
  handleSave: () => void;
}

export default function UserDialogPortal({
  open,
  onOpenChange,
  isAddMode,
  selectedUser,
  departments,
  roles,
  behaviours,
  setSelectedUser,
  setBehaviours,
  showSuccess,
  saving,
  handleSave,
}: UserDialogPortalProps) {
  if (!open) return null;
  return createPortal(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isAddMode ? "Add User" : "Edit User"}</DialogTitle>
        </DialogHeader>
        {selectedUser && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input className="neon-input" value={selectedUser.first_name || ""} onChange={e => setSelectedUser({ ...selectedUser, first_name: e.target.value })} placeholder="First Name" />
            <input className="neon-input" value={selectedUser.last_name || ""} onChange={e => setSelectedUser({ ...selectedUser, last_name: e.target.value })} placeholder="Last Name" />
            <input className="neon-input" value={selectedUser.email || ""} onChange={e => setSelectedUser({ ...selectedUser, email: e.target.value })} placeholder="Email" />
            <select className="neon-input" value={selectedUser.department_id || ""} onChange={e => setSelectedUser({ ...selectedUser, department_id: e.target.value, role_id: "" })}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="neon-input" value={selectedUser.role_id || ""} onChange={e => setSelectedUser({ ...selectedUser, role_id: e.target.value })}>
              <option value="">Select Role</option>
              {roles.filter(r => r.department_id === selectedUser.department_id).map(r => (
                <option key={r.id} value={r.id}>{r.title}</option>
              ))}
            </select>
            <select className="neon-input" value={selectedUser.access_level || ""} onChange={e => setSelectedUser({ ...selectedUser, access_level: e.target.value })}>
              <option value="User">User</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
            </select>
            <input className="neon-input" value={selectedUser.phone || ""} onChange={e => setSelectedUser({ ...selectedUser, phone: e.target.value })} placeholder="Phone" />
            <div className="md:col-span-2 lg:col-span-3">
              <BehaviourSelector selected={behaviours} onChange={setBehaviours} max={5} />
            </div>
            {showSuccess && <p className="neon-success md:col-span-2 lg:col-span-3">✅ User saved successfully!</p>}
          </div>
        )}
        <DialogFooter className="mt-4">
          <NeonIconButton
            variant="save"
            icon={<FiSave />}
            title={saving ? "Saving..." : "Save Changes"}
            onClick={handleSave}
            disabled={saving}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>,
    document.body
  );
}
