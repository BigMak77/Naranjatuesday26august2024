'use client'

import { useEffect, useState } from 'react'
import { getChildDepartments } from '@/lib/getChildDepartments'
import { useUser } from '@/lib/useUser'
import { supabase } from '@/lib/supabase-client'
import {
  FiUsers,
  FiClipboard,
  FiAlertCircle,
  FiActivity
} from 'react-icons/fi'
import NeonFeatureCard from '@/components/NeonFeatureCard'

export default function ManagerDashboard() {
  const { user } = useUser();
  const [users, setUsers] = useState<Array<{ id: string; first_name: string; last_name: string; department?: { name?: string }; role?: { title?: string } }>>([]);
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; status: string; due_date?: string }>>([]);
  const [issues, setIssues] = useState<Array<{ id: string; title: string; status: string; created_at?: string }>>([]);
  const [training, setTraining] = useState<Array<{ id: string; module: string; status: string; completed_at?: string }>>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Only show dashboard if user is manager or admin
  const allowed = user && typeof user.access_level === 'string' && ['manager', 'admin'].includes(user.access_level.toLowerCase());

  useEffect(() => {
    if (!allowed) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch team members
        const visibleDepartments = await getChildDepartments(user.department_id);
        const { data: teamData, error: teamError } = await supabase
          .from('users')
          .select('id, first_name, last_name, department:departments(name), role:roles(title)')
          .in('department_id', visibleDepartments)
          .gt('access_level', user.access_level);
        if (teamError) throw teamError;
        // Normalize department and role to single objects
        setUsers((teamData || []).map(u => ({
          ...u,
          department: Array.isArray(u.department) ? u.department[0] : u.department,
          role: Array.isArray(u.role) ? u.role[0] : u.role,
        })));

        // Fetch manager's tasks
        const { data: tasksData, error: tasksError } = await supabase
          .from('tasks')
          .select('id, title, status, due_date')
          .eq('assigned_to', user.auth_id);
        if (tasksError) throw tasksError;
        setTasks(tasksData || []);

        // Fetch manager's issues
        const { data: issuesData, error: issuesError } = await supabase
          .from('issues')
          .select('id, title, status, created_at')
          .eq('assigned_to', user.auth_id);
        if (issuesError) throw issuesError;
        setIssues(issuesData || []);

        // Fetch manager's training
        const { data: trainingData, error: trainingError } = await supabase
          .from('training')
          .select('id, module, status, completed_at')
          .eq('auth_id', user.auth_id);
        if (trainingError) throw trainingError;
        setTraining(trainingData || []);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, allowed]);

  // Show loading if user is not loaded yet
  if (typeof user === 'undefined') {
    return <main className="after-hero"><div className="global-content"><p className="manager-dashboard-loading">Loading user...</p></div></main>;
  }

  if (!allowed) return <main className="after-hero"><div className="global-content"><p className="manager-dashboard-error">Access denied.</p></div></main>;

  return (
    <main className="after-hero">
    
      <div className="global-content manager-dashboard-cards">
        {loading ? (
          <p className="manager-dashboard-loading">Loading...</p>
        ) : error ? (
          <p className="manager-dashboard-error">{error}</p>
        ) : (
          <>
            {/* Team Section */}
            <NeonFeatureCard title="My Team" icon={<FiUsers />} text="Your direct reports and team members." href="/manager/team">
              {users.length === 0 ? (
                <p>No team members found.</p>
              ) : (
                <table className="manager-dashboard-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u, i) => (
                      <tr key={i}>
                        <td>{u.first_name} {u.last_name}</td>
                        <td>{u.department?.name || '—'}</td>
                        <td>{u.role?.title || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </NeonFeatureCard>

            {/* Tasks Section */}
            <NeonFeatureCard title="My Tasks" icon={<FiClipboard />} text="Your assigned tasks and deadlines." href="/manager/tasks">
              {tasks.length === 0 ? (
                <p>No tasks assigned.</p>
              ) : (
                <table className="manager-dashboard-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, i) => (
                      <tr key={i}>
                        <td>{t.title}</td>
                        <td>{t.status}</td>
                        <td>{t.due_date ? new Date(t.due_date).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </NeonFeatureCard>

            {/* Issues Section */}
            <NeonFeatureCard title="My Issues" icon={<FiAlertCircle />} text="Your open issues and tickets." href="/manager/issues">
              {issues.length === 0 ? (
                <p>No issues assigned.</p>
              ) : (
                <table className="manager-dashboard-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Created At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issues.map((iss, i) => (
                      <tr key={i}>
                        <td>{iss.title}</td>
                        <td>{iss.status}</td>
                        <td>{iss.created_at ? new Date(iss.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </NeonFeatureCard>

            {/* Training Section */}
            <NeonFeatureCard title="My Training" icon={<FiActivity />} text="Your training modules and completion status." href="/manager/training">
              {training.length === 0 ? (
                <p>No training records found.</p>
              ) : (
                <table className="manager-dashboard-table">
                  <thead>
                    <tr>
                      <th>Module</th>
                      <th>Status</th>
                      <th>Completed At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {training.map((tr, i) => (
                      <tr key={i}>
                        <td>{tr.module}</td>
                        <td>{tr.status}</td>
                        <td>{tr.completed_at ? new Date(tr.completed_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </NeonFeatureCard>
          </>
        )}
      </div>
    </main>
  );
}
