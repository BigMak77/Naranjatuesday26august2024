import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-client";
import { useUser } from "@/lib/useUser";
import TextIconButton from "@/components/ui/TextIconButtons";

interface Issue {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  category: string;
  department_id: string;
  reported_by: string;
}

export default function IssuesWidget() {
  const { user, loading: userLoading } = useUser();
  // Extend the user type to include receive_notifications
  type Profile = typeof user & { receive_notifications?: boolean };
  const profile = user as Profile; // Use 'user' as 'profile' if that's the intended structure
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<{ open: boolean; issue: Issue | null }>({ open: false, issue: null });
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user || !profile) {
      setIssues([]);
      setLoading(false);
      return;
    }
    if (!profile.receive_notifications) {
      setIssues([]);
      setLoading(false);
      return;
    }
    // Fetch open issues for all departments the user belongs to
    const fetchIssues = async () => {
      // If user.department_id is an array, use .in, else .eq
      let departmentIds: string[] = [];
      if (Array.isArray(profile.department_id)) {
        departmentIds = profile.department_id;
      } else if (profile.department_id) {
        departmentIds = [profile.department_id];
      }
      let query = supabase
        .from("issues")
        .select("id, title, description, priority, status, category, department_id, reported_by")
        .eq("status", "Open");
      if (departmentIds.length > 1) {
        query = query.in("department_id", departmentIds);
      } else if (departmentIds.length === 1) {
        query = query.eq("department_id", departmentIds[0]);
      }
      const { data, error } = await query;
      setIssues(data || []);
      setLoading(false);
    };
    fetchIssues();
  }, [user, profile, userLoading]);

  // Fetch departments on mount
  useEffect(() => {
    supabase.from("departments").select("id, name").then(({ data }) => {
      setDepartments(data || []);
    });
  }, []);

  // Fetch users when department changes
  useEffect(() => {
    if (!selectedDept) return;
    setLoadingUsers(true);
    supabase
      .from("users")
      .select("id, first_name, last_name, receive_notifications")
      .eq("department_id", selectedDept)
      .eq("receive_notifications", true)
      .then(({ data }) => {
        setUsers(data || []);
        setLoadingUsers(false);
      });
  }, [selectedDept]);

  if (userLoading || loading) return <div>Loading issues…</div>;
  if (!user || !profile) return null;
  if (!profile.receive_notifications) return null;
  if (!issues.length) return <div>No open issues for your department.</div>;

  return (
    <div className="issues-widget">
      <div className="issues-widget-list">
        {issues.map((issue) => (
          <div key={issue.id} className="issues-widget-item issues-widget-card">
            <div className="issues-widget-inline-row">
              <span className="issues-widget-label">Type: {issue.category}</span>
              <span className="issues-widget-label">Details of Issue: {issue.description}</span>
              <span className="issues-widget-label">Priority: {issue.priority}</span>
              <span className="issues-widget-label">Status: {issue.status}</span>
              <div className="issues-widget-actions-inline">
                <TextIconButton
                  as="button"
                  variant="assign"
                  label="Assign"
                  className="neon-btn-assign"
                  onClick={() => setAssignModal({ open: true, issue })}
                >
                </TextIconButton>
                <TextIconButton
                  as="button"
                  variant="submit"
                  label="Completed"
                  className="neon-btn-confirm"
                  onClick={() => { /* TODO: completed handler */ }}
                >                </TextIconButton>
              </div>
            </div>
          </div>
        ))}
      </div>
      {assignModal.open && assignModal.issue && (
        <div className="neon-modal-overlay">
          <div className="neon-modal" style={{ minWidth: 340, maxWidth: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="neon-modal-title" style={{ marginBottom: 0 }}>Assign Issue</h2>
              <TextIconButton
                as="button"
                variant="close"
                label="Close"
                className="neon-btn-close"
                onClick={() => setAssignModal({ open: false, issue: null })}
              >
              </TextIconButton>
            </div>
            <div className="neon-modal-content">
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="dept-select">Department</label>
                <select
                  id="dept-select"
                  value={selectedDept}
                  onChange={e => setSelectedDept(e.target.value)}
                  style={{ width: '100%', marginTop: 4 }}
                >
                  <option value="">Select department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label htmlFor="user-select">User</label>
                <select
                  id="user-select"
                  value={selectedUser}
                  onChange={e => setSelectedUser(e.target.value)}
                  style={{ width: '100%', marginTop: 4 }}
                  disabled={!selectedDept || loadingUsers}
                >
                  <option value="">{loadingUsers ? 'Loading users…' : 'Select user…'}</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                  ))}
                </select>
              </div>
              <TextIconButton
                as="button"
                variant="submit"
                className="neon-btn-confirm"
                label="Assign Issue"
                disabled={!selectedDept || !selectedUser}
                onClick={async () => {
                  if (!assignModal.issue || !selectedDept || !selectedUser) return;
                  const now = new Date().toISOString();
                  await supabase
                    .from("issues")
                    .update({
                      department_id: selectedDept,
                      assigned_to: selectedUser,
                      status: "Assigned",
                      assigned_at: now,
                      reassigned_at: now,
                      reassigned_to_department: selectedDept
                    })
                    .eq("id", assignModal.issue.id);
                  // Refresh issues list
                  const { data } = await supabase
                    .from("issues")
                    .select("id, title, description, priority, status, category, department_id, reported_by")
                    .eq("status", "Open");
                  setIssues(data || []);
                  setAssignModal({ open: false, issue: null });
                  setSelectedDept("");
                  setSelectedUser("");
                }}
              >
                Assign
              </TextIconButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
